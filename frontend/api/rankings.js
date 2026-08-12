const connectToDatabase = require("./utils/db");
const Ranking = require("./models/Ranking");
const { sortByScore } = require("./utils/gradeCalculations");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRegNoQueryForBranch(branch) {
  const b = branch.toUpperCase();
  if (b === "CSE") {
    return {
      $and: [
        { $or: [{ regNo: /^\d{2}030112[01]/ }, { regNo: "230301180026" }] },
        { regNo: { $nin: ["230301120110", "230301120186", "230301120371", "230301120481"] } }
      ]
    };
  }
  if (b === "CIVIL") return { regNo: /^\d{2}030111[01]/ };
  if (b === "ME") return { regNo: /^\d{2}030116[01]/ };
  if (b === "ECE") {
    return {
      $or: [
        { regNo: /^\d{2}030113[012]/ },
        { regNo: { $in: ["230301120110", "230301120186", "230301120371", "230301120481"] } }
      ]
    };
  }
  if (b === "EEE") return { regNo: /^\d{2}030115[01]/ };
  if (b === "BIO") return { regNo: { $regex: /^\d{2}0301180/, $ne: "230301180026" } };
  if (b === "MI") return { regNo: /^\d{2}030119[01]/ };
  if (b === "AERO") return { $or: [{ regNo: /^\d{2}0301230/ }, { regNo: "230301231033" }] };
  return null;
}

function getSectionFromRegNo(regNo) {
  if (regNo === "230301180026") return "I";
  if (/^\d{2}0301120/.test(regNo)) {
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

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
};

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    await connectToDatabase();

    const action = req.query.action;

    // /api/rankings?action=meta
    if (action === "meta") {
      const semesters = await Ranking.distinct("semester", { sgpa: { $gt: 0 } });
      const batches = await Ranking.distinct("batch", { batch: { $ne: null } });
      const branches = ["CSE", "CIVIL", "ME", "ECE", "EEE", "BIO", "MI", "AERO"];
      return res.json({
        semesters: semesters.sort((a, b) => Number(a) - Number(b)),
        batches: batches.filter(Boolean).sort(),
        branches
      });
    }

    // /api/rankings?action=top (default)
    const { semester, branch, search, limit = 50, sortBy = "sgpa", section, batch } = req.query;
    const query = {};
    const andClauses = [];
    const maxRank = Math.max(1, Number(limit) || 50);

    if (semester) query.semester = Number(semester);
    if (batch) query.batch = batch;
    
    if (branch) {
      const bq = getRegNoQueryForBranch(branch);
      if (bq) andClauses.push(bq);
      else query.branch = branch;
    }

    const isGlobalSearch = search && !branch;
    if (isGlobalSearch) {
      const escaped = escapeRegex(search);
      andClauses.push({
        $or: [
          { studentName: { $regex: escaped, $options: "i" } },
          { regNo: { $regex: escaped, $options: "i" } },
        ]
      });
    }

    if (sortBy === "cgpa") {
      if (!section) query.cgpa = { $gt: 0 };
    } else {
      if (!section) query.sgpa = { $gt: 0 };
    }

    if (andClauses.length > 0) query.$and = andClauses;
    
    let rankings = await Ranking.find(query).lean();

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

    if (branch) {
      const scoreKey = sortBy === "cgpa" ? "cgpa" : "sgpa";
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
    }

    if (search && branch) {
      const s = search.toLowerCase();
      rankings = rankings.filter(r => {
        const nameMatch = r.studentName && r.studentName.toLowerCase().includes(s);
        const regMatch = r.regNo && r.regNo.toLowerCase().includes(s);
        return nameMatch || regMatch;
      });
    }

    let bounded = [];
    if (branch || search) {
      if (branch && !search) {
        for (const r of rankings) {
          if (r.dynamicRank > maxRank) break;
          bounded.push(r);
        }
      } else if (search) {
        bounded = rankings.slice(0, maxRank);
      }
    } else {
      const rankKey = sortBy === "cgpa" ? "cgpaRank" : "sgpaRank";
      bounded = rankings.filter((ranking) => {
        const rank = Number(ranking[rankKey] || ranking.universityRank);
        return Number.isFinite(rank) && rank <= maxRank;
      });
    }

    return res.json(bounded);
  } catch (err) {
    console.error("Vercel Serverless Rankings Error:", err);
    return res.status(500).json({ message: "Server error fetching rankings" });
  }
};
