const express = require("express");
const router = express.Router();
const Ranking = require("../models/Ranking");

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

// Top 50 rankers
router.get("/top", async (req, res) => {
  try {
    const { semester, branch, search, limit = 50, sortBy = "sgpa" } = req.query;
    const query = {};
    const andClauses = [];

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
      query.cgpa = { $gt: 0 };
    } else {
      query.sgpa = { $gt: 0 };
    }

    if (andClauses.length > 0) query.$and = andClauses;
    
    const sortConfig = sortBy === "cgpa" ? { cgpa: -1, sgpa: -1 } : { sgpa: -1, cgpa: -1 };
    
    let rankings = await Ranking.find(query)
      .sort(sortConfig)
      .lean();
      
    if (!semester) {
      const seen = new Set();
      rankings = rankings.filter(r => {
        if (seen.has(r.regNo)) return false;
        seen.add(r.regNo);
        return true;
      });
    }
    
    res.json(rankings.slice(0, Number(limit)));
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
