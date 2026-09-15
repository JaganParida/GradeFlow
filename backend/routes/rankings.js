const express = require("express");
const router = express.Router();
const Ranking = require("../models/Ranking");
const { sortByScore } = require("../utils/gradeCalculations");
const { validateAcademicFilters } = require("../middleware/validation");
const { requireStudentOrAdmin } = require("../middleware/auth");
const { publicLimiter } = require("../middleware/rateLimiters");
const { globalDbQueue } = require("../utils/dbProtection");

// Escape special regex characters to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRegNoQueryForBranch(branch) {
  const b = branch.toUpperCase();
  if (b === "CSE") {
    return {
      $and: [
        { $or: [{ regNo: /^\d{2}030112[0-9]/ }, { regNo: "230301180026" }] },
        { regNo: { $nin: ["230301120110", "230301120186", "230301120371", "230301120481"] } }
      ]
    };
  }
  if (b === "CIVIL") return { regNo: /^\d{2}030111[0-9]/ };
  if (b === "ME") return { regNo: /^\d{2}030116[0-9]/ };
  if (b === "ECE") {
    return {
      $or: [
        { regNo: /^\d{2}030113[0-9]/ },
        { regNo: { $in: ["230301120110", "230301120186", "230301120371", "230301120481"] } }
      ]
    };
  }
  if (b === "EEE") return { regNo: /^\d{2}030115[0-9]/ };
  if (b === "BIO") return { regNo: { $regex: /^\d{2}030118[0-9]/, $ne: "230301180026" } };
  if (b === "MI") return { regNo: /^\d{2}030119[0-9]/ };
  if (b === "AERO") return { $or: [{ regNo: /^\d{2}030123[0-9]/ }, { regNo: "230301231033" }] };
  return null;
}

function getSectionFromRegNo(regNo) {
  if (regNo === "230301180026") return "I";
  
  if (/^\d{2}030112[0-9]/.test(regNo)) {
     const num = parseInt(regNo.slice(-3), 10);
     if (num >= 1 && num <= 60) return "A";
     if (num >= 61 && num <= 120) return "B";
     if (num >= 121 && num <= 180) return "C";
     if (num >= 181 && num <= 240) return "D";
     if (num >= 241 && num <= 300) return "E";
     if (num >= 301 && num <= 360) return "F";
     if (num >= 361 && num <= 420) return "G";
     if (num >= 421 && num <= 480) return "H";
     if (num >= 481 && num <= 549) return "I";
  }
  return "J";
}

// Top 50 rankers
router.get("/top", publicLimiter, requireStudentOrAdmin, validateAcademicFilters, async (req, res) => {
  try {
    // Set safe public edge cache headers for ranking aggregations
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");

    const { semester, branch, search, limit = 50, sortBy = "sgpa", section, batch } = req.query;
    const query = {};
    const andClauses = [];
    const maxRank = Math.max(1, Number(limit) || 50);

    if (semester) query.semester = Number(semester);
    if (batch) query.batch = batch;
    
    if (branch) {
      const bq = getRegNoQueryForBranch(branch);
      if (bq) andClauses.push(bq);
      else query.branch = branch; // fallback
    }

    if (search && String(search).trim()) {
      const escaped = escapeRegex(String(search).trim());
      andClauses.push({
        $or: [
          { studentName: { $regex: escaped, $options: "i" } },
          { regNo: { $regex: escaped, $options: "i" } },
        ]
      });
    }

    if (sortBy === "cgpa") {
      if (!section && !search) query.cgpa = { $gt: 0 };
    } else {
      if (!section && !search) query.sgpa = { $gt: 0 };
    }

    if (andClauses.length > 0) query.$and = andClauses;
    
    const projectionFields =
      "regNo studentName branch batch semester sgpa cgpa deptRank deptCgpaRank universityRank cgpaRank sgpaRank percentile totalStudents deptStudents sectionSgpaRank sectionCgpaRank";

    const cleanSortBy = sortBy === "cgpa" ? "cgpa" : "sgpa";
    const primaryScore = cleanSortBy === "cgpa" ? "cgpa" : "sgpa";
    const secondaryScore = cleanSortBy === "cgpa" ? "sgpa" : "cgpa";

    let rankings = [];

    if (!semester) {
      // Cumulative CGPA mode: aggregate latest document per student
      const pipeline = [
        { $match: query },
        { $sort: { semester: -1 } },
        {
          $group: {
            _id: "$regNo",
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
        {
          $project: {
            regNo: 1,
            studentName: 1,
            branch: 1,
            batch: 1,
            semester: 1,
            sgpa: 1,
            cgpa: 1,
            deptRank: 1,
            deptCgpaRank: 1,
            universityRank: 1,
            cgpaRank: 1,
            sgpaRank: 1,
            percentile: 1,
            totalStudents: 1,
            deptStudents: 1,
            sectionSgpaRank: 1,
            sectionCgpaRank: 1,
          },
        },
        { $sort: { [primaryScore]: -1, [secondaryScore]: -1, regNo: 1 } },
      ];

      if (!section && !search && !branch) {
        pipeline.push({ $limit: maxRank });
      } else if (section) {
        pipeline.push({ $limit: 800 });
      } else {
        pipeline.push({ $limit: Math.max(maxRank, 150) });
      }

      rankings = await globalDbQueue.run(() => Ranking.aggregate(pipeline));
    } else {
      // Semester specified: query directly with DB-level sorting and limits
      let dbQuery = Ranking.find(query)
        .select(projectionFields)
        .sort({ [primaryScore]: -1, [secondaryScore]: -1, regNo: 1 });

      if (!section && !search && !branch) {
        dbQuery = dbQuery.limit(maxRank);
      } else if (section) {
        dbQuery = dbQuery.limit(800);
      } else {
        dbQuery = dbQuery.limit(Math.max(maxRank, 150));
      }

      rankings = await globalDbQueue.run(() => dbQuery.lean());
    }

    if (branch === "CSE" && section) {
      rankings = rankings.filter(r => getSectionFromRegNo(r.regNo) === section);
    }

    if (sortBy === "cgpa") {
      sortByScore(rankings, "cgpa", "sgpa");
    } else {
      sortByScore(rankings, "sgpa", "cgpa");
    }

    const scoreKey = sortBy === "cgpa" ? "cgpa" : "sgpa";
    const rankKey = cleanSortBy === "cgpa" ? "cgpaRank" : "sgpaRank";

    if (branch) {
      let currentRank = 1;
      let previousScore = null;
      for (const r of rankings) {
        const score = Number(r[scoreKey]) || 0;
        if (previousScore !== null && score < previousScore) {
          currentRank++;
        }
        r.dynamicRank = currentRank;
        previousScore = score;
      }
    } else {
      let currentRank = 1;
      let previousScore = null;
      rankings.forEach((r, idx) => {
        const score = Number(r[scoreKey]) || 0;
        if (idx === 0) {
          currentRank = 1;
        } else if (previousScore !== null && score < previousScore) {
          currentRank = idx + 1;
        }
        previousScore = score;
        if (!r[rankKey] && !r.universityRank) {
          r[rankKey] = currentRank;
        }
      });
    }

    if (search) {
      const s = String(search).trim().toLowerCase();
      rankings = rankings.filter((r) => {
        const nameMatch = r.studentName && r.studentName.toLowerCase().includes(s);
        const regMatch = r.regNo && r.regNo.toLowerCase().includes(s);
        return nameMatch || regMatch;
      });
    }

    let bounded = [];
    if (search) {
      bounded = rankings.slice(0, 100);
    } else if (branch) {
      for (const r of rankings) {
        if (r.dynamicRank > maxRank) break;
        bounded.push(r);
      }
    } else {
      bounded = rankings.slice(0, maxRank);
    }

    res.json(bounded);
  } catch (err) {
    console.error("Rankings top error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Available semesters and branches
router.get("/meta", requireStudentOrAdmin, async (req, res) => {
  try {
    const semesters = await Ranking.distinct("semester", { sgpa: { $gt: 0 } });
    const batches = await Ranking.distinct("batch", { batch: { $ne: null } });
    const branches = ["CSE", "CIVIL", "ME", "ECE", "EEE", "BIO", "MI", "AERO"];
    res.json({
      semesters: semesters.sort((a, b) => Number(a) - Number(b)),
      batches: batches.filter(Boolean).sort(),
      branches
    });
  } catch (err) {
    console.error("Rankings meta error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
