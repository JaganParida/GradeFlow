const express = require("express");
const router = express.Router();
const SemesterResult = require("../models/SemesterResult");
const InternalMark = require("../models/InternalMark");
const Ranking = require("../models/Ranking");

const GRADE_POINTS = {
  O: 10,
  E: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  F: 2,
  R: 0,
  M: 0,
  S: 0,
};

function calcCGPA(results) {
  let cgpaNumerator = 0;
  let cgpaDenominator = 0;

  results.forEach((r) => {
    let semTW = 0;
    let semTC = 0;

    r.subjects.forEach((s) => {
      // Exception: Sem 5 R-grade 6-credit project is fully excluded
      if (Number(r.semester) === 5 && s.grade === 'R' && (Number(s.credit) === 6 && (s.type && s.type.toLowerCase().includes('proj')))) {
        return;
      }
      // All other grades (F=2, R=0, S=0, M=0) contribute per official formula
      if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
        semTW += s.credit * GRADE_POINTS[s.grade];
        semTC += s.credit;
      }
    });

    if (semTC > 0) {
      const semSGPA = Math.floor((semTW / semTC) * 100 + 0.0001) / 100;
      cgpaNumerator += semSGPA * semTC;
      cgpaDenominator += semTC;
    }
  });

  return cgpaDenominator > 0
    ? Math.floor((cgpaNumerator / cgpaDenominator) * 100 + 0.0001) / 100
    : 0;
}

function calcAcademicHealth(cgpa, sgpa, backlogs, results) {
  let score = 0;
  score += Math.min(cgpa * 5, 50);
  score += Math.min(sgpa * 2, 20);
  score += backlogs === 0 ? 20 : Math.max(0, 20 - backlogs * 5);
  const totalSubjects = results.reduce((a, r) => a + r.subjects.length, 0);
  score += Math.min(10, totalSubjects > 0 ? 10 : 0);
  return Math.round(Math.min(score, 100));
}

// In-Memory Cache (15 minutes expiry)
const studentCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

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

// GET student full profile
router.get("/:regNo", async (req, res) => {
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

    const cgpa = calcCGPA(results);
    const backlogs = results.flatMap((r) =>
      r.subjects
        .filter((s) => {
          if (Number(r.semester) === 5 && s.grade === 'R' && (Number(s.credit) === 6 && (s.type && s.type.toLowerCase().includes('proj')))) {
            return false;
          }
          return ["F", "M", "S", "R"].includes(s.grade);
        })
        .map((s) => ({
          subName: s.subName,
          subCode: s.subCode,
          credit: s.credit,
          grade: s.grade,
          semester: r.semester,
        }))
    );
    const latestResult = results[results.length - 1];
    
    let liveLatestSgpa = 0;
    let semTW = 0;
    let semTC = 0;
    latestResult.subjects.forEach((s) => {
      if (Number(latestResult.semester) === 5 && s.grade === 'R' && (Number(s.credit) === 6 && (s.type && s.type.toLowerCase().includes('proj')))) {
        return; 
      }
      // All grades (F=2, R=0, S=0, M=0) are included per official formula
      if (s.credit && GRADE_POINTS[s.grade] !== undefined) {
        semTW += s.credit * GRADE_POINTS[s.grade];
        semTC += s.credit;
      }
    });
    if (semTC > 0) {
      liveLatestSgpa = Math.floor((semTW / semTC) * 100 + 0.0001) / 100;
    }

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

    const responseData = {
      regNo,
      studentName: latestResult.studentName,
      branch: latestResult.branch,
      batch: latestResult.batch,
      cgpa,
      latestSgpa: liveLatestSgpa,
      latestSemester: latestResult.semester,
      totalCredits: results.reduce((a, r) => {
        return a + r.subjects.reduce((sum, s) => {
          // Only exclude the Sem5 R-project special case
          if (Number(r.semester) === 5 && s.grade === 'R' && (Number(s.credit) === 6 && (s.type && s.type.toLowerCase().includes('proj')))) return sum;
          return sum + (s.credit || 0);
        }, 0);
      }, 0),
      creditsCleared: results.reduce((a, r) => {
        return a + r.subjects.reduce((sum, s) => {
          if (Number(r.semester) === 5 && s.grade === 'R' && (Number(s.credit) === 6 && (s.type && s.type.toLowerCase().includes('proj')))) return sum;
          if (["F", "M", "S", "R"].includes(s.grade)) return sum;
          return sum + (s.credit || 0);
        }, 0);
      }, 0),
      academicHealthScore: healthScore,
      backlogs: backlogs, // Now contains subName, subCode, credit, grade, semester
      results,
      ranking: ranking || null,
    };

    setCache(regNo, responseData);
    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET specific semester result
router.get("/:regNo/semester/:sem", async (req, res) => {
  try {
    const result = await SemesterResult.findOne({
      regNo: req.params.regNo,
      semester: req.params.sem,
    });
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET specific semester ranking
router.get("/:regNo/ranking/:sem", async (req, res) => {
  try {
    const ranking = await Ranking.findOne({
      regNo: req.params.regNo,
      semester: req.params.sem,
    });
    if (!ranking) return res.status(404).json({ message: "Ranking not found" });
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET internal marks
router.get("/:regNo/internal/:sem", async (req, res) => {
  try {
    const marks = await InternalMark.findOne({
      regNo: req.params.regNo,
      semester: req.params.sem,
    });
    if (!marks)
      return res.status(404).json({ message: "Internal marks not found" });
    res.json(marks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
