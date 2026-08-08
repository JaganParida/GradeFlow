const express = require("express");
const router = express.Router();
const SemesterResult = require("../models/SemesterResult");
const InternalMark = require("../models/InternalMark");
const Ranking = require("../models/Ranking");
const Student = require("../models/Student");
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

// Middleware to validate regNo format (prevent malformed queries)
const validateRegNo = (req, res, next) => {
  const { regNo } = req.params;
  // Allow alphanumeric registration numbers between 5 and 20 characters
  if (!regNo || !/^[a-zA-Z0-9]{5,20}$/.test(regNo)) {
    return res.status(400).json({ message: "Invalid registration number format" });
  }
  next();
};

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

// GET student full profile
router.get("/:regNo", validateRegNo, async (req, res) => {
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
      backlogs: backlogs, // Now contains subName, subCode, credit, grade, semester
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
router.get("/:regNo/semester/:sem", validateRegNo, async (req, res) => {
  try {
    const result = await SemesterResult.findOne({
      regNo: req.params.regNo,
      semester: req.params.sem,
    });
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  } catch (err) {
    console.error("Semester result error:", err);
    res.status(500).json({ message: "Server error fetching semester result" });
  }
});

// GET specific semester ranking
router.get("/:regNo/ranking/:sem", validateRegNo, async (req, res) => {
  try {
    const ranking = await Ranking.findOne({
      regNo: req.params.regNo,
      semester: req.params.sem,
    });
    if (!ranking) return res.status(404).json({ message: "Ranking not found" });
    res.json(ranking);
  } catch (err) {
    console.error("Ranking fetch error:", err);
    res.status(500).json({ message: "Server error fetching ranking" });
  }
});

// GET internal marks
router.get("/:regNo/internal/:sem", validateRegNo, async (req, res) => {
  try {
    const marks = await InternalMark.findOne({
      regNo: req.params.regNo,
      semester: req.params.sem,
    });
    if (!marks)
      return res.status(404).json({ message: "Internal marks not found" });
    res.json(marks);
  } catch (err) {
    console.error("Internal marks fetch error:", err);
    res.status(500).json({ message: "Server error fetching internal marks" });
  }
});

module.exports = router;
module.exports.clearStudentCache = clearStudentCache;
