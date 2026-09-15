const connectToDatabase = require("./_lib/db");
const Ranking = require("./_lib/models/Ranking");
const SystemConfig = require("./_lib/models/SystemConfig");
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
  const adminToken = cookies.jwt || req.headers["x-admin-token"] || (req.headers.authorization?.startsWith("Bearer") ? req.headers.authorization.split(" ")[1] : null);
  const studentToken = cookies.student_jwt || req.headers["x-student-token"] || (req.headers.authorization?.startsWith("Bearer") ? req.headers.authorization.split(" ")[1] : null);

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
      let metaDoc = await SystemConfig.findOne({ key: "rankings_meta" }).lean();
      if (!metaDoc?.rankingsMeta?.semesters?.length) {
        const semesters = await Ranking.distinct("semester", { sgpa: { $gt: 0 } });
        const batches = await Ranking.distinct("batch", { batch: { $ne: null } });
        const branches = ["CSE", "CIVIL", "ME", "ECE", "EEE", "BIO", "MI", "AERO"];
        const version = Date.now();

        metaDoc = await SystemConfig.findOneAndUpdate(
          { key: "rankings_meta" },
          {
            $set: {
              key: "rankings_meta",
              "rankingsMeta.version": version,
              "rankingsMeta.semesters": semesters.map(Number).sort((a, b) => a - b),
              "rankingsMeta.batches": batches.filter(Boolean).sort(),
              "rankingsMeta.branches": branches,
              "rankingsMeta.updatedAt": new Date(),
            },
          },
          { upsert: true, new: true }
        ).lean();
      }

      const meta = metaDoc?.rankingsMeta || {};
      const version = meta.version || (meta.updatedAt ? new Date(meta.updatedAt).getTime() : 1);
      res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
      return res.json({
        semesters: (meta.semesters || []).map(Number).sort((a, b) => a - b),
        batches: (meta.batches || []).filter(Boolean).sort(),
        branches: meta.branches || ["CSE", "CIVIL", "ME", "ECE", "EEE", "BIO", "MI", "AERO"],
        version,
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
    if (req.query.v) {
      // Versioned query: 100% immutable Edge CDN cache hit (24 hours). 0 CPU, 0 DB reads!
      res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
    } else {
      // Fallback for unversioned legacy calls
      res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    }

    const projectionFields =
      "regNo studentName branch batch semester sgpa cgpa deptRank deptCgpaRank universityRank cgpaRank sgpaRank percentile totalStudents deptStudents sectionSgpaRank sectionCgpaRank";

    const primaryScore = cleanSortBy === "cgpa" ? "cgpa" : "sgpa";
    const secondaryScore = cleanSortBy === "cgpa" ? "sgpa" : "cgpa";

    let rankings = [];

    if (!semester) {
      // Cumulative CGPA mode across latest semester per student
      // High-performance index-assisted aggregation instead of full database scan
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

      if (!cleanSection && !cleanSearch && !cleanBranch) {
        pipeline.push({ $limit: maxRank });
      } else if (cleanSection) {
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

      if (!cleanSection && !cleanSearch && !cleanBranch) {
        dbQuery = dbQuery.limit(maxRank);
      } else if (cleanSection) {
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
      // Guarantee fallback rank if unpopulated in database
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
      // Direct slice guarantees exactly maxRank top students even when competition ties occur
      bounded = rankings.slice(0, maxRank);
    }

    return res.json(bounded);
  } catch (err) {
    console.error("Vercel Serverless Rankings Error:", err);
    return res.status(500).json({ message: err.message || "Server error fetching rankings", error: err.toString() });
  }
};
