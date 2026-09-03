const connectToDatabase = require("./_lib/db");
const Ranking = require("./_lib/models/Ranking");
const { sortByScore } = require("./_lib/gradeCalculations");
const { globalDbQueue } = require("./_lib/dbProtection");

function escapeRegex(str) {
  if (typeof str !== "string") return "";
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

const jwt = require("jsonwebtoken");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

function verifyAuth(req) {
  const cookies = parseCookies(req.headers.cookie);
  const adminToken = cookies.jwt || (req.headers.authorization?.startsWith("Bearer") ? req.headers.authorization.split(" ")[1] : null);
  const studentToken = cookies.student_jwt || (req.headers.authorization?.startsWith("Bearer") ? req.headers.authorization.split(" ")[1] : null);

  if (adminToken && adminToken !== "none") {
    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
      if (decoded) return { role: "admin", user: decoded };
    } catch {}
  }

  if (studentToken && studentToken !== "none") {
    try {
      const decoded = jwt.verify(studentToken, process.env.JWT_SECRET);
      if (decoded && decoded.regNo) return { role: "student", user: decoded };
    } catch {}
  }

  return null;
}

const { applyCors } = require("./_lib/cors");

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,OPTIONS")) return;
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    await connectToDatabase();

    const auth = verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ message: "Authentication required. Please log in to view rankings.", code: "AUTH_REQUIRED" });
    }

    const action = req.query.action;

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

    const { semester, branch, search, limit = 50, sortBy = "sgpa", section, batch } = req.query;
    const cleanSearch = typeof search === "string" ? search.trim().slice(0, 100) : "";
    const cleanBranch = typeof branch === "string" ? branch.trim().slice(0, 30) : "";
    const cleanBatch = typeof batch === "string" ? batch.trim().slice(0, 20) : "";
    const cleanSection = typeof section === "string" ? section.trim().slice(0, 20) : "";
    const cleanSortBy = sortBy === "cgpa" ? "cgpa" : "sgpa";
    const maxRank = Math.min(200, Math.max(1, Number(limit) || 50));

    const query = {};
    const andClauses = [];

    if (semester && !isNaN(Number(semester))) query.semester = Number(semester);
    if (cleanBatch) query.batch = cleanBatch;
    
    if (cleanBranch) {
      const bq = getRegNoQueryForBranch(cleanBranch);
      if (bq) andClauses.push(bq);
      else query.branch = cleanBranch;
    }

    const isGlobalSearch = Boolean(cleanSearch && !cleanBranch);
    if (isGlobalSearch) {
      const escaped = escapeRegex(cleanSearch);
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
    
    // Set safe public edge cache headers
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");

    let rankings = await globalDbQueue.run(() =>
      Ranking.find(query).lean()
    );

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

    if (cleanSearch && cleanBranch) {
      const s = cleanSearch.toLowerCase();
      rankings = rankings.filter(r => {
        const nameMatch = r.studentName && String(r.studentName).toLowerCase().includes(s);
        const regMatch = r.regNo && String(r.regNo).toLowerCase().includes(s);
        return nameMatch || regMatch;
      });
    }

    let bounded = [];
    if (cleanBranch || cleanSearch) {
      if (cleanBranch && !cleanSearch) {
        for (const r of rankings) {
          if (r.dynamicRank > maxRank) break;
          bounded.push(r);
        }
      } else if (cleanSearch) {
        bounded = rankings.slice(0, maxRank);
      }
    } else {
      const rankKey = cleanSortBy === "cgpa" ? "cgpaRank" : "sgpaRank";
      bounded = rankings.filter((ranking) => {
        const rank = Number(ranking[rankKey] || ranking.universityRank);
        return Number.isFinite(rank) && rank <= maxRank;
      });
    }

    return res.json(bounded);
  } catch (err) {
    console.error("Vercel Serverless Rankings Error:", err);
    return res.status(500).json({ message: err.message || "Server error fetching rankings", error: err.toString() });
  }
};
