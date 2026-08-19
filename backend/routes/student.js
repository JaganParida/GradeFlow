const express = require("express");
const router = express.Router();
const SemesterResult = require("../models/SemesterResult");
const InternalMark = require("../models/InternalMark");
const Ranking = require("../models/Ranking");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const { requireStudentOrAdmin } = require("../middleware/auth");
const {
  calculateBacklogs,
  calculateCGPA,
  calculateSemesterMetrics,
  getSectionFromRegNo,
} = require("../utils/gradeCalculations");

function calcAcademicHealth(cgpa, sgpa, backlogs, results) {
  let score = 0;
  score += Math.min(cgpa * 5, 50);
  score += Math.min(sgpa * 2, 20);
  score += backlogs === 0 ? 20 : Math.max(0, 20 - backlogs * 5);
  const totalSubjects = results.reduce((a, r) => a + r.subjects.length, 0);
  score += Math.min(10, totalSubjects > 0 ? 10 : 0);
  return Math.round(Math.min(score, 100));
}

const { validateRegNoParam } = require("../middleware/validation");
const validateRegNo = validateRegNoParam;

// In-Memory Cache — short TTL so stale data expires quickly
const studentCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (was 15)

function setCache(regNo, data) {
  studentCache.set(regNo, { data, expiry: Date.now() + CACHE_TTL_MS });
}

function getCache(regNo) {
  const cached = studentCache.get(regNo);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    studentCache.delete(regNo);
    return null;
  }
  return cached.data;
}

// Exported so admin routes can invalidate cache immediately after upload
function clearStudentCache(regNo) {
  if (regNo) {
    studentCache.delete(regNo);
  } else {
    studentCache.clear(); // clear all
  }
}

// GET student full profile (Protected: Student can only view self, Admin can view any)
router.get("/:regNo", validateRegNo, requireStudentOrAdmin, async (req, res) => {
  try {
    const { regNo } = req.params;
    
    // Check Cache First! (Zero CPU load, instant response)
    const cachedData = getCache(regNo);
    if (cachedData) {
      return res.json(cachedData);
    }

    const results = await SemesterResult.find({ regNo }).sort({ semester: 1 });
    if (!results.length)
      return res.status(404).json({ message: "Student not found" });

    const cgpa = calculateCGPA(results);
    const backlogs = calculateBacklogs(results);
    const latestResult = results[results.length - 1];
    const latestMetrics = calculateSemesterMetrics(
      latestResult.subjects,
      latestResult.semester,
    );
    const liveLatestSgpa =
      latestResult.subjects && latestResult.subjects.length > 0
        ? latestMetrics.sgpa
        : typeof latestResult.sgpa === "number"
          ? latestResult.sgpa
          : latestMetrics.sgpa;

    const healthScore = calcAcademicHealth(
      cgpa,
      liveLatestSgpa,
      backlogs.length,
      results,
    );

    const ranking = await Ranking.findOne({
      regNo,
      semester: latestResult.semester,
    });

    const studentProfile = await Student.findOne({ regNo });

    const responseData = {
      regNo,
      studentName: latestResult.studentName,
      branch: studentProfile?.branch || latestResult.branch,
      batch: studentProfile?.batch || latestResult.batch,
      section: studentProfile?.section || getSectionFromRegNo(regNo),
      cgpa,
      latestSgpa: liveLatestSgpa,
      latestSemester: latestResult.semester,
      totalCredits: results.reduce(
        (sum, r) =>
          sum + calculateSemesterMetrics(r.subjects, r.semester).totalCredits,
        0,
      ),
      creditsCleared: results.reduce(
        (sum, r) =>
          sum + calculateSemesterMetrics(r.subjects, r.semester).creditsCleared,
        0,
      ),
      academicHealthScore: healthScore,
      backlogs: backlogs, // Contains subName, subCode, credit, grade, semester
      results,
      ranking: ranking || null,
    };

    setCache(regNo, responseData);
    res.json(responseData);
  } catch (err) {
    console.error("Student profile error:", err);
    res.status(500).json({ message: "Server error fetching student profile" });
  }
});

// GET specific semester result
router.get(["/:regNo/semester/:sem", "/:regNo/semesters/:sem"], validateRegNo, requireStudentOrAdmin, async (req, res) => {
  try {
    const semNum = Number(req.params.sem);
    const result = await SemesterResult.findOne({
      regNo: req.params.regNo,
      $or: [{ semester: req.params.sem }, { semester: isNaN(semNum) ? req.params.sem : semNum }],
    });
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  } catch (err) {
    console.error("Semester result error:", err);
    res.status(500).json({ message: "Server error fetching semester result" });
  }
});

// GET specific semester ranking
router.get("/:regNo/ranking/:sem", validateRegNo, requireStudentOrAdmin, async (req, res) => {
  try {
    const semNum = Number(req.params.sem);
    const ranking = await Ranking.findOne({
      regNo: req.params.regNo,
      $or: [{ semester: req.params.sem }, { semester: isNaN(semNum) ? req.params.sem : semNum }],
    });
    if (!ranking) return res.status(404).json({ message: "Ranking not found" });
    res.json(ranking);
  } catch (err) {
    console.error("Ranking fetch error:", err);
    res.status(500).json({ message: "Server error fetching ranking" });
  }
});

// GET internal marks
router.get(["/:regNo/internal/:sem", "/:regNo/internals/:sem"], validateRegNo, requireStudentOrAdmin, async (req, res) => {
  try {
    const semNum = Number(req.params.sem);
    const marks = await InternalMark.findOne({
      regNo: req.params.regNo,
      $or: [{ semester: req.params.sem }, { semester: isNaN(semNum) ? req.params.sem : semNum }],
    });
    if (!marks)
      return res.status(404).json({ message: "Internal marks not found" });
    res.json(marks);
  } catch (err) {
    console.error("Internal marks fetch error:", err);
    res.status(500).json({ message: "Server error fetching internal marks" });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   ATTENDANCE TRACKER PERSISTENCE (MONGODB SYNC)
═══════════════════════════════════════════════════════════════════ */

// GET student attendance tracker data
router.get("/:regNo/attendance", validateRegNo, requireStudentOrAdmin, async (req, res) => {
  try {
    const { regNo } = req.params;
    const cleanReg = regNo.toUpperCase();

    const attendance = await Attendance.findOne({ regNo: cleanReg });
    if (!attendance) {
      return res.json({
        success: true,
        attendance: null,
        message: "No custom attendance record saved yet.",
      });
    }

    res.json({
      success: true,
      attendance: {
        regNo: attendance.regNo,
        section: attendance.section,
        targetGoal: attendance.targetGoal,
        savedSubjects: attendance.savedSubjects,
        dailyLogs: attendance.dailyLogs ? Object.fromEntries(attendance.dailyLogs) : {},
        lastSyncedAt: attendance.lastSyncedAt,
      },
    });
  } catch (err) {
    console.error("Attendance fetch error:", err);
    res.status(500).json({ message: "Server error fetching attendance data" });
  }
});

// POST save/sync student attendance tracker data
router.post("/:regNo/attendance", validateRegNo, requireStudentOrAdmin, async (req, res) => {
  try {
    const { regNo } = req.params;
    const cleanReg = regNo.toUpperCase();
    const { section, targetGoal, savedSubjects, dailyLogs } = req.body;

    const updatedAttendance = await Attendance.findOneAndUpdate(
      { regNo: cleanReg },
      {
        regNo: cleanReg,
        section: section || "CSE-A",
        targetGoal: Number(targetGoal) || 75,
        savedSubjects: Array.isArray(savedSubjects) ? savedSubjects : [],
        dailyLogs: dailyLogs && typeof dailyLogs === "object" ? dailyLogs : {},
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Attendance data saved successfully to database.",
      attendance: updatedAttendance,
    });
  } catch (err) {
    console.error("Attendance save error:", err);
    res.status(500).json({ message: "Server error saving attendance data" });
  }
});

module.exports = router;
module.exports.clearStudentCache = clearStudentCache;

