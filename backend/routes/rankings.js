const express = require("express");
const router = express.Router();
const Ranking = require("../models/Ranking");
const { sortByScore } = require("../utils/gradeCalculations");

function getRegNoQueryForBranch(branch) {
  const b = branch.toUpperCase();
  if (b === "CSE") {
    return {
      $and: [
        { $or: [{ regNo: /^23030112[01]/ }, { regNo: "230301180026" }] },
        { regNo: { $nin: ["230301120110", "230301120186", "230301120371", "230301120481"] } }
      ]
    };
  }
  if (b === "CIVIL") return { regNo: /^23030111[01]/ };
  if (b === "ME") return { regNo: /^23030116[01]/ };
  if (b === "ECE") {
    return {
      $or: [
        { regNo: /^23030113[012]/ },
        { regNo: { $in: ["230301120110", "230301120186", "230301120371", "230301120481"] } }
      ]
    };
  }
  if (b === "EEE") return { regNo: /^23030115[01]/ };
  if (b === "BIO") return { regNo: { $regex: /^230301180/, $ne: "230301180026" } };
  if (b === "MI") return { regNo: /^23030119[01]/ };
  if (b === "AERO") return { $or: [{ regNo: /^230301230/ }, { regNo: "230301231033" }] };
  return null;
}

function getSectionFromRegNo(regNo) {
  if (regNo === "230301180026") return "I";
  
  if (regNo.startsWith("230301120")) {
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
router.get("/top", async (req, res) => {
  try {
    const { semester, branch, search, limit = 50, sortBy = "sgpa", section } = req.query;
    const query = {};
    const andClauses = [];
    const maxRank = Math.max(1, Number(limit) || 50);

    if (semester) query.semester = Number(semester);
    
    if (branch) {
      const bq = getRegNoQueryForBranch(branch);
      if (bq) andClauses.push(bq);
      else query.branch = branch; // fallback
    }

    if (search) {
      andClauses.push({
        $or: [
          { studentName: { $regex: search, $options: "i" } },
          { regNo: { $regex: search, $options: "i" } },
        ]
      });
    }

    if (sortBy === "cgpa") {
      if (!section) query.cgpa = { $gt: 0 };
    } else {
      if (!section) query.sgpa = { $gt: 0 };
    }

    if (andClauses.length > 0) query.$and = andClauses;
    
    let rankings = await Ranking.find(query)
      .lean();

    if (branch === "CSE" && section) {
      rankings = rankings.filter(r => getSectionFromRegNo(r.regNo) === section);
    }

    if (!semester) {
      const latestByRegNo = new Map();
      rankings.forEach((ranking) => {
        const existing = latestByRegNo.get(ranking.regNo);
        if (!existing || Number(ranking.semester) > Number(existing.semester)) {
          latestByRegNo.set(ranking.regNo, ranking);
        }
      });
      rankings = Array.from(latestByRegNo.values());
    }

    if (sortBy === "cgpa") {
      sortByScore(rankings, "cgpa", "sgpa");
    } else {
      sortByScore(rankings, "sgpa", "cgpa");
    }

    let bounded;
    if (branch || search) {
      const scoreKey = sortBy === "cgpa" ? "cgpa" : "sgpa";
      let currentRank = 1;
      let previousScore = null;
      bounded = [];
      for (const r of rankings) {
        const score = Number(r[scoreKey]) || 0;
        if (previousScore !== null && score < previousScore) {
          currentRank++;
        }
        if (currentRank > maxRank) break;
        bounded.push(r);
        previousScore = score;
      }
    } else {
      const rankKey = sortBy === "cgpa" ? "cgpaRank" : "sgpaRank";
      bounded = rankings.filter((ranking) => {
        const rank = Number(ranking[rankKey] || ranking.universityRank);
        return Number.isFinite(rank) && rank <= maxRank;
      });
    }

    res.json(bounded);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Available semesters and branches
router.get("/meta", async (req, res) => {
  try {
    const semesters = await Ranking.distinct("semester", { sgpa: { $gt: 0 } });
    const branches = ["CSE", "CIVIL", "ME", "ECE", "EEE", "BIO", "MI", "AERO"];
    res.json({ semesters: semesters.sort(), branches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
