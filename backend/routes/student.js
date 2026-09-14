const express = require("express");
const router = express.Router();
const SemesterResult = require("../models/SemesterResult");
const InternalMark = require("../models/InternalMark");
const Ranking = require("../models/Ranking");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const { requireStudentOrAdmin } = require("../middleware/auth");
const { studentSearchLimiter } = require("../middleware/rateLimiters");
const { globalDbQueue } = require("../utils/dbProtection");
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

const crypto = require("crypto");
const { validateRegNoParam } = require("../middleware/validation");
const validateRegNo = validateRegNoParam;

// In-Memory Cache — short TTL so stale data expires quickly
const studentCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function setCache(regNo, data, etag = "") {
  studentCache.set(regNo, { data, etag, expiry: Date.now() + CACHE_TTL_MS });
}

function getCache(regNo) {
  const cached = studentCache.get(regNo);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    studentCache.delete(regNo);
    return null;
  }
  return cached;
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
router.get("/:regNo", studentSearchLimiter, validateRegNo, requireStudentOrAdmin, async (req, res) => {
  try {
    const { regNo } = req.params;

    // Enforce strictly private headers for student academic records with ETag validation
    res.setHeader("Cache-Control", "private, no-cache");
    res.setHeader("Pragma", "no-cache");
    
    // Check Cache First! (Zero CPU load, ~1ms instant response)
    const cached = getCache(regNo);
    if (cached) {
      if (cached.etag) {
        res.setHeader("ETag", cached.etag);
        if (req.headers["if-none-match"] === cached.etag) {
          return res.status(304).end();
        }
      }
      return res.json(cached.data);
    }

    const results = await globalDbQueue.run(() =>
      SemesterResult.find({ regNo }).sort({ semester: 1 })
    );
    if (!results || !results.length)
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

    const [allRankings, attendanceDoc] = await Promise.all([
      Ranking.find({ regNo }).lean(),
      Attendance.findOne({ regNo }).select("targetGoal savedSubjects section lastSyncedAt").lean(),
    ]);

    const rankingsMap = {};
    (allRankings || []).forEach((r) => {
      if (r.semester) rankingsMap[String(r.semester)] = r;
    });

    const ranking = rankingsMap[String(latestResult.semester)] || null;

    let attendanceSummary = null;
    if (attendanceDoc && Array.isArray(attendanceDoc.savedSubjects) && attendanceDoc.savedSubjects.length > 0) {
      let totalAttended = 0;
      let totalDelivered = 0;
      let activeSubjectsCount = 0;

      attendanceDoc.savedSubjects.forEach((sub) => {
        let subDelivered = 0;
        let subAttended = 0;
        (sub.components || []).forEach((c) => {
          subAttended += Number(c.attended) || 0;
          subDelivered += Number(c.delivered) || 0;
        });
        totalAttended += subAttended;
        totalDelivered += subDelivered;
        if (subDelivered > 0) {
          activeSubjectsCount++;
        }
      });

      if (totalDelivered > 0) {
        const percentage = Number(((totalAttended / totalDelivered) * 100).toFixed(2));
        attendanceSummary = {
          percentage,
          totalAttended,
          totalDelivered,
          targetGoal: attendanceDoc.targetGoal || 75,
          subjectsCount: activeSubjectsCount > 0 ? activeSubjectsCount : attendanceDoc.savedSubjects.length,
        };
      }
    }

    const formattedAttendance = attendanceDoc
      ? {
          regNo,
          section: attendanceDoc.section || getSectionFromRegNo(regNo),
          targetGoal: attendanceDoc.targetGoal || 75,
          savedSubjects: attendanceDoc.savedSubjects || [],
          dailyLogs: {},
          lastSyncedAt: attendanceDoc.lastSyncedAt || new Date(),
        }
      : null;

    const responseData = {
      regNo,
      studentName: latestResult.studentName,
      branch: latestResult.branch,
      batch: latestResult.batch,
      section: getSectionFromRegNo(regNo),
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
      rankingsMap,
      attendance: formattedAttendance,
      attendanceSummary,
    };

    const bodyString = JSON.stringify(responseData);
    const etag = `"${crypto.createHash("md5").update(bodyString).digest("hex")}"`;
    res.setHeader("ETag", etag);

    setCache(regNo, responseData, etag);

    if (req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(bodyString);
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

    const cleanSavedSubjects = Array.isArray(savedSubjects)
      ? savedSubjects.map((s) => ({
          subjectName: String(s.subjectName || s.name || "").trim(),
          code: String(s.code || s.subCode || "").trim(),
          section: String(s.section || section || "").trim(),
          weeklyOccurrences: Array.isArray(s.weeklyOccurrences) ? s.weeklyOccurrences : [],
          components: Array.isArray(s.components)
            ? s.components.map((c) => ({
                type: String(c.type || "PP").trim().toUpperCase(),
                attended: Math.max(0, parseInt(c.attended, 10) || 0),
                delivered: Math.max(0, parseInt(c.delivered, 10) || 0),
              }))
            : [],
          lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : new Date(),
        }))
      : [];

    const cleanDailyLogs = {};
    if (dailyLogs && typeof dailyLogs === "object") {
      Object.keys(dailyLogs).forEach((dKey) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dKey) && typeof dailyLogs[dKey] === "object" && dailyLogs[dKey] !== null) {
          const slotMap = {};
          Object.keys(dailyLogs[dKey]).forEach((slotKey) => {
            const val = dailyLogs[dKey][slotKey];
            if (val === "present" || val === "absent") {
              slotMap[slotKey] = val;
            }
          });
          if (Object.keys(slotMap).length > 0) {
            cleanDailyLogs[dKey] = slotMap;
          }
        }
      });
    }

    const updatedAttendance = await Attendance.findOneAndUpdate(
      { regNo: cleanReg },
      {
        $set: {
          regNo: cleanReg,
          section: section || "CSE-A",
          targetGoal: Math.max(1, Math.min(100, Number(targetGoal) || 75)),
          savedSubjects: cleanSavedSubjects,
          dailyLogs: cleanDailyLogs,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Attendance data saved successfully to database.",
      attendance: {
        regNo: updatedAttendance.regNo,
        section: updatedAttendance.section,
        targetGoal: updatedAttendance.targetGoal,
        savedSubjects: updatedAttendance.savedSubjects,
        dailyLogs: updatedAttendance.dailyLogs
          ? (updatedAttendance.dailyLogs instanceof Map
              ? Object.fromEntries(updatedAttendance.dailyLogs)
              : updatedAttendance.dailyLogs)
          : {},
        lastSyncedAt: updatedAttendance.lastSyncedAt,
      },
    });
  } catch (err) {
    console.error("Attendance save error:", err);
    res.status(500).json({ message: "Server error saving attendance data" });
  }
});

module.exports = router;
module.exports.clearStudentCache = clearStudentCache;

