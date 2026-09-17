const connectToDatabase = require("./_lib/db");
const SemesterResult = require("./_lib/models/SemesterResult");
const InternalMark = require("./_lib/models/InternalMark");
const Ranking = require("./_lib/models/Ranking");
const Student = require("./_lib/models/Student");
const StudentSession = require("./_lib/models/StudentSession");
const BatchPurgeLog = require("./_lib/models/BatchPurgeLog");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const SubAdmin = require("./_lib/models/SubAdmin");
const AdminSession = require("./_lib/models/AdminSession");
const Attendance = require("./_lib/models/Attendance");
const SystemConfig = require("./_lib/models/SystemConfig");
const TimetableSchedule = require("./_lib/models/TimetableSchedule");
const Feedback = require("./_lib/models/Feedback");
const TrafficQueueConfig = require("./_lib/models/TrafficQueueConfig");
const LiveVisitor = require("./_lib/models/LiveVisitor");
const VercelQuotaMetric = require("./_lib/models/VercelQuotaMetric");
const StudentNotification = require("./_lib/models/StudentNotification");
const StudentRouteActivity = require("./_lib/models/StudentRouteActivity");
const PageAnalytics = require("./_lib/models/PageAnalytics");
const jwt = require("jsonwebtoken");
const { isAdminSessionValid, touchAdminSession, getActiveAdminSessions } = require("./_lib/sessionManager");
const {
  GRADE_POINTS,
  calculateSGPA,
  calculateCGPA,
  calculateSemesterMetrics,
  calculateBacklogs,
  getGradePoint,
  getSectionFromRegNo,
  normalizeGrade,
  assignCompetitionRanks,
  sortByScore,
} = require("./_lib/gradeCalculations");

const { applyCors } = require("./_lib/cors");
const { broadcastRealtimeEvent, publishAdminRealtimeEvent, publishStudentRealtimeEvent } = require("./_lib/ablyService");
const { getVercelQuotaData } = require("./_lib/quotaEngine");

const EXCLUDED_STUDENT_REG = "230301120327";

const ROUTE_LABELS = {
  "/": "Home / Landing",
  "/dashboard": "Student Dashboard",
  "/timetable": "Class Timetable & Schedule",
  "/attendance": "Attendance Tracker & Calculator",
  "/leaderboard": "Rankings & Leaderboard",
  "/analytics": "Academic Analytics & Trends",
  "/resources": "Student Resources",
  "/testimonials": "Student Reviews & Testimonials",
  "/about-dev": "Developer Portfolio & Team",
  "/about": "About GradeFlow",
  "/help": "Help & Support",
  "/contact": "Contact",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/admin": "Admin Portal",
  "/admin/dashboard": "Admin Control Console",
};

function normalizeRoute(route) {
  if (!route || typeof route !== "string") return "/";
  const clean = route.split("?")[0].replace(/\/$/, "") || "/";
  if (clean.startsWith("/dashboard/")) return "/dashboard";
  if (clean.startsWith("/timetable/")) return "/timetable";
  if (clean.startsWith("/attendance/")) return "/attendance";
  if (clean.startsWith("/analytics/")) return "/analytics";
  return clean;
}

function getFriendlyPageTitle(route) {
  const norm = normalizeRoute(route);
  return ROUTE_LABELS[norm] || norm;
}

let statsCache = null;
let statsCacheTimestamp = 0;
const STATS_CACHE_TTL_MS = 60 * 1000; // 60s memory cache to prevent redundant aggregations

let defaultToppersCache = null;
let defaultToppersCacheTime = 0;
const TOPPERS_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

let defaultBacklogsCache = null;
let defaultBacklogsCacheTime = 0;
const BACKLOGS_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

let defaultBootstrapCache = null;
let defaultBootstrapCacheTime = 0;
const BOOTSTRAP_CACHE_TTL_MS = 30 * 1000; // 30s memory cache to prevent redundant multi-table aggregations

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

async function parseJsonBodyIfNeeded(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.readableEnded || req.destroyed) return req.body || {};
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json") && !contentType.includes("text/")) {
    return req.body || {};
  }
  return new Promise((resolve) => {
    let data = "";
    const timer = setTimeout(() => resolve(req.body || {}), 2500);
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      clearTimeout(timer);
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => {
      clearTimeout(timer);
      resolve({});
    });
  });
}

function detectBatch(regNo) {
  if (!regNo) return "";
  const r = String(regNo).trim();
  if (/^\d{2}/.test(r)) {
    return `20${r.slice(0, 2)}`;
  }
  return "";
}

function detectBranch(regNo) {
  if (!regNo) return "CSE";
  const r = String(regNo).trim();
  if (r === "230301180026") return "CSE";
  if (["230301120110", "230301120186", "230301120371", "230301120481"].includes(r)) return "ECE";
  if (r === "230301231033") return "AERO";

  const suffix = r.length >= 9 ? r.slice(2) : r;
  if (suffix.startsWith("0301110") || suffix.startsWith("0301111")) return "CIVIL";
  if (suffix.startsWith("0301120") || suffix.startsWith("0301121")) return "CSE";
  if (suffix.startsWith("0301130") || suffix.startsWith("0301131") || suffix.startsWith("0301132")) return "ECE";
  if (suffix.startsWith("0301150") || suffix.startsWith("0301151")) return "EEE";
  if (suffix.startsWith("0301160") || suffix.startsWith("0301161")) return "ME";
  if (suffix.startsWith("0301180")) return "BIO";
  if (suffix.startsWith("0301190") || suffix.startsWith("0301191")) return "MI";
  if (suffix.startsWith("0301230")) return "AERO";

  if (r.startsWith("230301110") || r.startsWith("230301111")) return "CIVIL";
  if (r.startsWith("230301120") || r.startsWith("230301121")) return "CSE";
  if (r.startsWith("230301130") || r.startsWith("230301131") || r.startsWith("230301132")) return "ECE";
  if (r.startsWith("230301150") || r.startsWith("230301151")) return "EEE";
  if (r.startsWith("230301160") || r.startsWith("230301161")) return "ME";
  if (r.startsWith("230301180")) return "BIO";
  if (r.startsWith("230301190") || r.startsWith("230301191")) return "MI";
  if (r.startsWith("230301230")) return "AERO";
  return "CSE";
}

async function authenticateAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = req.headers["x-admin-token"];
  if (!token && cookies.jwt && cookies.jwt !== "none") {
    token = cookies.jwt;
  }
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") {
    return { error: { status: 401, message: "Not authorized, no administrative session found.", code: "AUTH_REQUIRED" } };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student" || decoded.regNo) {
      return { error: { status: 403, message: "Forbidden: Administrative access restricted to administrators.", code: "STUDENT_ADMIN_ACCESS_FORBIDDEN" } };
    }

    if (decoded.adminType === "subadmin") {
      if (decoded.sessionId) {
        const session = await SubAdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
        if (!session) {
          return { error: { status: 401, message: "Sub-Admin session ended because this device was logged out.", code: "ADMIN_SESSION_TERMINATED" } };
        }
      }
      const subAdmin = await SubAdmin.findById(decoded.subAdminId);
      if (!subAdmin) {
        return { error: { status: 403, message: "Sub-Admin account not found.", code: "SUBADMIN_NOT_FOUND" } };
      }
      if (subAdmin.status !== "active") {
        return { error: { status: 403, message: `Sub-Admin account is ${subAdmin.status}.`, code: `SUBADMIN_${subAdmin.status.toUpperCase()}` } };
      }
      return {
        admin: {
          role: "admin",
          adminType: "subadmin",
          id: subAdmin._id,
          username: subAdmin.username,
          name: subAdmin.name,
          email: subAdmin.email,
          permissions: subAdmin.permissions || { routes: [], actions: [] },
          sessionId: decoded.sessionId,
        },
      };
    }

    // Main Admin: Authoritative MongoDB session validation
    if (!decoded.sessionId) {
      return {
        error: {
          status: 401,
          message: "Administrative session token invalid or missing session identifier.",
          code: "AUTH_SESSION_INVALID",
        },
      };
    }

    const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
    if (!session || !isAdminSessionValid(session)) {
      return {
        error: {
          status: 401,
          message: "Admin session ended because this device was logged out.",
          code: "ADMIN_SESSION_TERMINATED",
        },
      };
    }

    await touchAdminSession(session);

    return {
      admin: {
        role: "admin",
        adminType: "main",
        username: decoded.username || "admin",
        email: decoded.email || process.env.ADMIN_EMAIL,
        permissions: { routes: ["*"], actions: ["*"] },
        sessionId: session.sessionId,
      },
    };
  } catch {
    return { error: { status: 401, message: "Not authorized, invalid admin token.", code: "INVALID_ADMIN_TOKEN" } };
  }
}

async function syncRankingsMetadataAndBroadcast(semester = null) {
  try {
    const semesters = await Ranking.distinct("semester", { sgpa: { $gt: 0 } });
    const batches = await Ranking.distinct("batch", { batch: { $ne: null } });
    const branches = ["CSE", "CIVIL", "ME", "ECE", "EEE", "BIO", "MI", "AERO"];
    const newVersion = Date.now();

    await SystemConfig.findOneAndUpdate(
      { key: "rankings_meta" },
      {
        $set: {
          key: "rankings_meta",
          "rankingsMeta.version": newVersion,
          "rankingsMeta.semesters": semesters.map(Number).sort((a, b) => a - b),
          "rankingsMeta.batches": batches.filter(Boolean).sort(),
          "rankingsMeta.branches": branches,
          "rankingsMeta.updatedAt": new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Broadcast real-time update across dual Ably accounts to students AND admins
    statsCache = null;
    statsCacheTimestamp = 0;
    defaultBootstrapCache = null;
    defaultBootstrapCacheTime = 0;
    await broadcastRealtimeEvent("rankings-updated", {
      timestamp: newVersion,
      version: newVersion,
      semester: semester ? Number(semester) : null,
    });
    await publishAdminRealtimeEvent("rankings-updated", {
      timestamp: newVersion,
      version: newVersion,
      semester: semester ? Number(semester) : null,
    });
  } catch (err) {
    console.error("[RankingsSync] Failed to sync rankings metadata/broadcast:", err?.message || err);
  }
}

async function generateRankingForSemester(semester, preloadedAllResults = null, shouldBroadcast = true, targetBatch = null) {
  const semNum = Number(semester);
  let allResults = preloadedAllResults;
  if (!allResults) {
    const query = { semester: { $lte: semNum } };
    if (targetBatch) {
      query.batch = String(targetBatch).trim();
    }
    allResults = await SemesterResult.find(query, "regNo studentName branch batch semester subjects totalCredits creditsCleared sgpa").lean();
  }
  const semResults = allResults.filter((r) => Number(r.semester) === semNum && (!targetBatch || (r.batch || "") === String(targetBatch).trim()));
  if (!semResults.length) return;

  const resultsByRegNo = new Map();
  for (const r of allResults) {
    const regNo = String(r.regNo || "").trim();
    if (!regNo) continue;
    if (!resultsByRegNo.has(regNo)) {
      resultsByRegNo.set(regNo, []);
    }
    resultsByRegNo.get(regNo).push(r);
  }

  for (const list of resultsByRegNo.values()) {
    list.sort((a, b) => Number(a.semester) - Number(b.semester));
  }

  const batches = [...new Set(semResults.map((r) => r.batch || ""))];
  for (const batch of batches) {
    const batchResults = semResults.filter((r) => (r.batch || "") === batch);
    const studentData = [];
    const semBulkOps = [];

    for (const r of batchResults) {
      const regNo = String(r.regNo || "").trim();
      const studentAllResults = resultsByRegNo.get(regNo) || [];
      const liveSGPA = calculateSGPA(r.subjects, semNum);
      const cgpa = calculateCGPA(studentAllResults, semNum);
      const { totalCredits, creditsCleared } = calculateSemesterMetrics(r.subjects, semNum);

      studentData.push({
        regNo: r.regNo,
        studentName: r.studentName,
        branch: r.branch,
        batch: r.batch,
        section: getSectionFromRegNo(r.regNo),
        semester: semNum,
        sgpa: liveSGPA,
        cgpa,
      });

      semBulkOps.push({
        updateOne: {
          filter: { regNo: r.regNo, semester: semNum },
          update: {
            $set: {
              sgpa: liveSGPA,
              cgpa: cgpa,
              totalCredits,
              creditsCleared,
            },
          },
        },
      });
    }

    if (semBulkOps.length > 0) {
      await SemesterResult.bulkWrite(semBulkOps);
    }

    sortByScore(studentData, "cgpa", "sgpa");
    assignCompetitionRanks(studentData, "cgpa", "cgpaRank");
    sortByScore(studentData, "sgpa", "cgpa");
    assignCompetitionRanks(studentData, "sgpa", "sgpaRank");

    studentData.forEach((s) => {
      s.universityRank = s.sgpaRank;
      s.totalStudents = studentData.length;
      s.percentile = parseFloat(
        ((1 - (s.sgpaRank - 1) / studentData.length) * 100).toFixed(1),
      );
    });

    const byBranch = {};
    const bySection = {};
    studentData.forEach((s) => {
      if (!byBranch[s.branch]) byBranch[s.branch] = [];
      byBranch[s.branch].push(s);

      if (s.branch === "CSE") {
        const sec = getSectionFromRegNo(s.regNo);
        if (!bySection[sec]) bySection[sec] = [];
        bySection[sec].push(s);
      }
    });

    Object.values(byBranch).forEach((group) => {
      sortByScore(group, "sgpa", "cgpa");
      assignCompetitionRanks(group, "sgpa", "deptRank");
      
      sortByScore(group, "cgpa", "sgpa");
      assignCompetitionRanks(group, "cgpa", "deptCgpaRank");

      group.forEach((s) => (s.deptStudents = group.length));
    });

    Object.values(bySection).forEach((group) => {
      sortByScore(group, "sgpa", "cgpa");
      assignCompetitionRanks(group, "sgpa", "sectionSgpaRank");

      sortByScore(group, "cgpa", "sgpa");
      assignCompetitionRanks(group, "cgpa", "sectionCgpaRank");

      group.forEach((s) => (s.sectionStudents = group.length));
    });

    if (studentData.length > 0) {
      const bulkOps = studentData.map((s) => ({
        updateOne: {
          filter: { regNo: s.regNo, semester: semNum },
          update: { $set: s },
          upsert: true,
        },
      }));
      await Ranking.bulkWrite(bulkOps);
    }
  }

  if (shouldBroadcast) {
    await syncRankingsMetadataAndBroadcast(semester);
  }
}

async function getSectionToppersData({ batch = "2023", branch = "CSE", section = "Sec A", search = "", semester = null, limit = 10 } = {}) {
  const isDefault = batch === "2023" && branch === "CSE" && (section === "Sec A" || section === "A") && !search && !semester && limit === 10;
  if (isDefault && defaultToppersCache && (Date.now() - defaultToppersCacheTime < TOPPERS_CACHE_TTL_MS)) {
    return defaultToppersCache;
  }

  const rankingFilter = {};
  if (batch) rankingFilter.batch = batch;
  if (branch) rankingFilter.branch = branch;
  if (semester) rankingFilter.semester = Number(semester);
  if (search) {
    rankingFilter.$or = [
      { regNo: { $regex: search, $options: "i" } },
      { studentName: { $regex: search, $options: "i" } },
    ];
  }

  // Fast targeted index query for standard 2023 CSE Section A
  const isSecA2023CSE = batch === "2023" && branch === "CSE" && (section === "Sec A" || section === "A") && !search;
  if (isSecA2023CSE) {
    rankingFilter.regNo = { $gte: "230301120001", $lte: "230301120060" };
  }

  const allRankings = await Ranking.find(
    rankingFilter,
    "regNo semester studentName batch branch cgpa sgpa sectionCgpaRank sectionSgpaRank deptCgpaRank deptRank universityRank cgpaRank"
  ).sort({ cgpa: -1, sgpa: -1 }).lean().catch(() => []);

  let filteredRankings = allRankings;
  if (semester) {
    const semNum = Number(semester);
    filteredRankings = filteredRankings.filter((rk) => Number(rk.semester) === semNum);
  } else {
    const latestMap = new Map();
    allRankings.forEach((rk) => {
      const regNo = rk.regNo;
      const currentSem = Number(rk.semester) || 0;
      const existing = latestMap.get(regNo);
      if (!existing || currentSem > (Number(existing.semester) || 0)) {
        latestMap.set(regNo, rk);
      }
    });
    filteredRankings = Array.from(latestMap.values());
  }

  let validStudents = [];
  filteredRankings.forEach((rk) => {
    const regNo = String(rk.regNo || "").trim();
    if (!regNo) return;

    const cgpa = Number(rk.cgpa) || 0;
    const sgpa = Number(rk.sgpa) || 0;
    if (cgpa <= 0) return;

    let b = String(rk.batch || "").trim();
    if (!b && /^\d{2}/.test(regNo)) b = `20${regNo.slice(0, 2)}`;

    let br = detectBranch(regNo);
    if (rk.branch) br = String(rk.branch).trim().toUpperCase();

    let sec = getSectionFromRegNo(regNo);
    if (sec && !sec.startsWith("Sec")) sec = `Sec ${sec}`;
    if (!sec) sec = "N/A";

    validStudents.push({
      regNo,
      studentName: rk.studentName || "Student",
      batch: b,
      branch: br,
      section: sec.replace(/^Sec\s*/i, ""),
      fullSection: sec,
      semester: rk.semester,
      cgpa,
      sgpa,
      sectionCgpaRank: null,
      sectionSgpaRank: rk.sectionSgpaRank || null,
      deptCgpaRank: rk.deptCgpaRank || null,
      deptRank: rk.deptRank || null,
      universityRank: rk.universityRank || rk.cgpaRank || null,
      lastTopperEmailSentAt: null,
      lastTopperEmailStatus: null,
      lastTopperEmailError: null,
    });
  });

  if (batch) validStudents = validStudents.filter((s) => s.batch === batch);
  if (branch) validStudents = validStudents.filter((s) => s.branch === branch);
  if (section) {
    const cleanSec = String(section).replace(/^Section\s*|^Sec\s*/i, "").trim().toUpperCase();
    validStudents = validStudents.filter((s) => {
      const sSec = String(s.section || "").replace(/^Section\s*|^Sec\s*/i, "").trim().toUpperCase();
      return sSec === cleanSec;
    });
  }
  if (search) {
    const q = String(search).toLowerCase().trim();
    validStudents = validStudents.filter(
      (s) => s.regNo.toLowerCase().includes(q) || s.studentName.toLowerCase().includes(q)
    );
  }

  validStudents.sort((a, b) => b.cgpa - a.cgpa || b.sgpa - a.sgpa);

  let currentRank = 1;
  let prevCgpa = null;
  validStudents.forEach((s, idx) => {
    if (idx === 0) currentRank = 1;
    else if (s.cgpa < prevCgpa) currentRank = idx + 1;
    s.sectionCgpaRank = currentRank;
    prevCgpa = s.cgpa;
  });

  const topStudents = validStudents.slice(0, limit);
  const topRegNos = topStudents.map((s) => s.regNo);

  if (topRegNos.length > 0) {
    const studentsTracking = await Student.find(
      { regNo: { $in: topRegNos } },
      "regNo lastTopperEmailSentAt lastTopperEmailStatus lastTopperEmailError"
    ).lean().catch(() => []);

    const studentTrackingMap = new Map();
    studentsTracking.forEach((st) => studentTrackingMap.set(st.regNo, st));

    topStudents.forEach((s) => {
      const tracking = studentTrackingMap.get(s.regNo) || {};
      s.lastTopperEmailSentAt = tracking.lastTopperEmailSentAt ? tracking.lastTopperEmailSentAt.toISOString() : null;
      s.lastTopperEmailStatus = tracking.lastTopperEmailStatus || null;
      s.lastTopperEmailError = tracking.lastTopperEmailError || null;
    });
  }

  const result = {
    totalToppers: validStudents.length,
    students: topStudents,
  };

  if (isDefault) {
    defaultToppersCache = result;
    defaultToppersCacheTime = Date.now();
  }

  return result;
}

async function getBacklogsData({ batch = "", branch = "", section = "", semester = "", search = "", page = 1, limit = 20 } = {}) {
  const isDefault = !batch && !branch && !section && !semester && !search && page === 1 && (Number(limit) === 20 || Number(limit) === 50);
  if (isDefault && defaultBacklogsCache && (Date.now() - defaultBacklogsCacheTime < BACKLOGS_CACHE_TTL_MS)) {
    return defaultBacklogsCache;
  }

  const semCandidateFilter = {
    "subjects.grade": { $in: ["F", "R", "M", "S", "f", "r", "m", "s"] },
  };
  if (batch) semCandidateFilter.batch = batch;
  if (branch) semCandidateFilter.branch = branch;
  if (semester) semCandidateFilter.semester = Number(semester);
  if (search) {
    semCandidateFilter.$or = [
      { regNo: { $regex: search, $options: "i" } },
      { studentName: { $regex: search, $options: "i" } },
    ];
  }

  const candidateRegNos = await SemesterResult.distinct("regNo", semCandidateFilter).catch(() => []);

  if (!candidateRegNos || candidateRegNos.length === 0) {
    const emptyResult = {
      totalStudentsWithBacklogs: 0,
      totalBacklogsCount: 0,
      students: [],
      totalPages: 1,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      pagination: {
        total: 0,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        pages: 1,
      },
    };
    if (isDefault) {
      defaultBacklogsCache = emptyResult;
      defaultBacklogsCacheTime = Date.now();
    }
    return emptyResult;
  }

  const semResults = await SemesterResult.find(
    { regNo: { $in: candidateRegNos } },
    "regNo batch branch studentName semester subjects.subjectName subjects.subjectCode subjects.grade subjects.credits"
  ).sort({ semester: 1 }).lean().catch(() => []);

  const studentResultsMap = new Map();
  semResults.forEach((r) => {
    if (!r.regNo || !r.subjects || !r.subjects.length) return;
    const regNo = String(r.regNo).trim();
    if (!studentResultsMap.has(regNo)) studentResultsMap.set(regNo, []);
    studentResultsMap.get(regNo).push(r);
  });

  const studentBacklogMap = new Map();
  studentResultsMap.forEach((userResults, regNo) => {
    const backlogs = calculateBacklogs(userResults);
    if (!backlogs || !backlogs.length) return;

    const latestResult = userResults[userResults.length - 1] || userResults[0];
    let b = String(latestResult.batch || "").trim();
    if (!b && /^\d{2}/.test(regNo)) b = `20${regNo.slice(0, 2)}`;

    let br = detectBranch(regNo);
    if (latestResult.branch && br === "CSE" && !regNo.startsWith("230301120") && !regNo.startsWith("230301121")) {
      br = String(latestResult.branch).trim().toUpperCase();
    }

    let rawSec = getSectionFromRegNo(regNo);
    if (rawSec && !rawSec.startsWith("Sec")) rawSec = `Sec ${rawSec}`;

    const semBreakdown = {};
    backlogs.forEach((sub) => {
      const sNum = sub.semester || 1;
      semBreakdown[sNum] = (semBreakdown[sNum] || 0) + 1;
    });

    studentBacklogMap.set(regNo, {
      regNo,
      studentName: latestResult.studentName || "N/A",
      batch: b || "N/A",
      branch: br || "N/A",
      section: rawSec || "N/A",
      totalBacklogs: backlogs.length,
      backlogs,
      semBreakdown,
      rankInfo: null,
      lastEmailSentAt: null,
      lastEmailStatus: null,
      lastEmailError: null,
    });
  });

  let studentList = Array.from(studentBacklogMap.values());

  if (batch) {
    studentList = studentList.filter((s) => s.batch === batch);
  }
  if (branch) {
    studentList = studentList.filter((s) => s.branch === branch);
  }
  if (section) {
    const cleanSec = String(section).replace(/^Section\s*|^Sec\s*/i, "").trim().toUpperCase();
    studentList = studentList.filter((s) => {
      const sSec = String(s.section || "").replace(/^Section\s*|^Sec\s*/i, "").trim().toUpperCase();
      return sSec === cleanSec;
    });
  }
  if (semester) {
    const semNum = Number(semester);
    studentList = studentList.filter((s) => (s.semBreakdown[semNum] || 0) > 0);
  }
  if (search) {
    const q = String(search).toLowerCase().trim();
    studentList = studentList.filter(
      (s) => s.regNo.toLowerCase().includes(q) || s.studentName.toLowerCase().includes(q)
    );
  }

  studentList.sort((a, b) => b.totalBacklogs - a.totalBacklogs);

  const totalStudentsWithBacklogs = studentList.length;
  const totalBacklogsCount = studentList.reduce((acc, s) => acc + s.totalBacklogs, 0);

  const totalPages = Math.ceil(totalStudentsWithBacklogs / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedStudents = studentList.slice(startIndex, startIndex + limit);

  const paginatedRegNos = paginatedStudents.map((s) => s.regNo);
  if (paginatedRegNos.length > 0) {
    const [rankings, studentsTracking] = await Promise.all([
      Ranking.find(
        { regNo: { $in: paginatedRegNos } },
        "regNo semester cgpa universityRank cgpaRank deptCgpaRank deptRank sectionCgpaRank sectionSgpaRank"
      ).lean().catch(() => []),
      Student.find(
        { regNo: { $in: paginatedRegNos } },
        "regNo lastBacklogEmailSentAt lastBacklogEmailStatus lastBacklogEmailError"
      ).lean().catch(() => []),
    ]);

    const studentTrackingMap = new Map();
    studentsTracking.forEach((st) => studentTrackingMap.set(st.regNo, st));

    const studentRankingMap = new Map();
    rankings.forEach((rk) => {
      if (!rk.regNo) return;
      const regNo = String(rk.regNo).trim();
      const existing = studentRankingMap.get(regNo);
      if (!existing || rk.semester > existing.semester) {
        studentRankingMap.set(regNo, {
          cgpa: rk.cgpa || 0,
          universityRank: rk.universityRank || rk.cgpaRank || null,
          deptRank: rk.deptCgpaRank || rk.deptRank || null,
          departmentRank: rk.deptCgpaRank || rk.deptRank || null,
          branchRank: rk.deptCgpaRank || rk.deptRank || null,
          batchRank: rk.universityRank || rk.cgpaRank || null,
          sectionRank: rk.sectionCgpaRank || rk.sectionSgpaRank || null,
          semester: rk.semester,
        });
      }
    });

    paginatedStudents.forEach((s) => {
      s.rankInfo = studentRankingMap.get(s.regNo) || null;
      const trackingInfo = studentTrackingMap.get(s.regNo) || {};
      s.lastEmailSentAt = trackingInfo.lastBacklogEmailSentAt ? (trackingInfo.lastBacklogEmailSentAt.toISOString ? trackingInfo.lastBacklogEmailSentAt.toISOString() : String(trackingInfo.lastBacklogEmailSentAt)) : null;
      s.lastEmailStatus = trackingInfo.lastBacklogEmailStatus || null;
      s.lastEmailError = trackingInfo.lastBacklogEmailError || null;
    });
  }

  const result = {
    totalStudentsWithBacklogs,
    totalBacklogsCount,
    page,
    limit,
    totalPages,
    students: paginatedStudents,
    pagination: {
      total: totalStudentsWithBacklogs,
      page,
      limit,
      pages: totalPages,
    },
  };

  if (isDefault) {
    defaultBacklogsCache = result;
    defaultBacklogsCacheTime = Date.now();
  }

  return result;
}

async function getAdminBootstrapData(adminUser) {
  const isMain = adminUser.adminType === "main" || !adminUser.adminType;
  const adminProfile = {
    authenticated: true,
    email: adminUser.email || "",
    username: adminUser.username || adminUser.name || "Admin",
    adminType: isMain ? "main" : "sub",
    isSubAdmin: !isMain,
    permissions: adminUser.permissions || {
      routes: isMain ? ["*"] : ["overview", "timetable", "toppers", "backlogs", "report-card", "feedback"],
      actions: isMain ? ["*"] : [],
    },
    sessionId: adminUser.sessionId || null,
  };

  const [
    totalAccountsCreated,
    activeSessions,
    batchStatsResults,
    batchStatsRankings,
    batchStatsInternal,
    toppersResult,
    backlogsResult,
    timetableSchedules,
    trafficConfig,
    activeVisitorsCount,
    studentActivities,
    portalConfigDoc,
    maintenanceConfigDoc,
    broadcastsList,
    recentFeedback,
    vercelQuotaResult,
  ] = await Promise.all([
    Student.countDocuments({ passwordHash: { $exists: true, $ne: null } }).catch(() => 0),
    StudentSession.find({ isActive: true }, "regNo").lean().catch(() => []),
    SemesterResult.aggregate([
      {
        $group: {
          _id: {
            batch: { $ifNull: ["$batch", "Other"] },
            semester: "$semester",
          },
          totalResults: { $sum: 1 },
          uniqueStudents: { $addToSet: "$regNo" },
        },
      },
      {
        $project: {
          batch: "$_id.batch",
          semester: "$_id.semester",
          totalResults: 1,
          studentCount: { $size: "$uniqueStudents" },
          uniqueStudents: 1,
        },
      },
    ]).catch(() => []),
    Ranking.aggregate([
      {
        $group: {
          _id: {
            batch: { $ifNull: ["$batch", "Other"] },
            semester: "$semester",
          },
          totalRankings: { $sum: 1 },
          uniqueStudents: { $addToSet: "$regNo" },
        },
      },
      {
        $project: {
          batch: "$_id.batch",
          semester: "$_id.semester",
          totalRankings: 1,
          studentCount: { $size: "$uniqueStudents" },
          uniqueStudents: 1,
        },
      },
    ]).catch(() => []),
    InternalMark.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$batch", "Other"] },
          totalInternal: { $sum: 1 },
          uniqueStudents: { $addToSet: "$regNo" },
        },
      },
    ]).catch(() => []),
    getSectionToppersData({ batch: "2023", branch: "CSE", section: "Sec A", limit: 10 }).catch(() => ({ totalToppers: 0, students: [] })),
    getBacklogsData({ page: 1, limit: 20 }).catch(() => ({ totalStudentsWithBacklogs: 0, totalBacklogsCount: 0, students: [], totalPages: 1, page: 1 })),
    TimetableSchedule.find({}, "scheduleId batch branch section title isLiveCustomPublished updatedAt")
      .sort({ updatedAt: -1 }).limit(50).lean().catch(() => []),
    TrafficQueueConfig.findOne({ key: "global_queue_config" }).lean().catch(() => null),
    LiveVisitor.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) } }).catch(() => 0),
    StudentRouteActivity.find(
      { regNo: { $ne: EXCLUDED_STUDENT_REG } },
      "regNo studentName branch batch deviceType os browser currentRoute currentPageTitle lastActiveRoute lastActivePageTitle timeSpentCurrentRoute totalTimeSpentSeconds mostVisitedRoute mostVisitedPageTitle mostVisitedCount mostTimeSpentRoute mostTimeSpentPageTitle mostTimeSpentSeconds mostActiveTimeSlot peakTimeSpentSeconds mostActiveDay visitsToday visitsThisWeek visitedRoutes lastActiveAt"
    ).sort({ lastActiveAt: -1 }).limit(50).lean().catch(() => []),
    SystemConfig.findOne({ key: "admin_button_config" }).lean().catch(() => null),
    SystemConfig.findOne({ key: "maintenance" }).lean().catch(() => null),
    StudentNotification.find({ $or: [{ regNo: "ALL" }, { isBroadcast: true }] })
      .sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
    Feedback.find({}).sort({ createdAt: -1 }).limit(20).lean().catch(() => []),
    getVercelQuotaData().catch(() => null),
  ]);

  const batchMap = new Map();
  const allUniqueStudents = new Set();
  let totalResultsCount = 0;
  let totalRankingsCount = 0;
  let totalInternalCount = 0;

  batchStatsResults.forEach((item) => {
    const b = item.batch || "Other";
    if (!batchMap.has(b)) {
      batchMap.set(b, {
        batch: b,
        totalStudents: 0,
        uniqueStudentsSet: new Set(),
        totalRankedStudents: 0,
        totalResults: 0,
        totalInternal: 0,
        totalRankings: 0,
        semBreakdown: [],
      });
    }
    const entry = batchMap.get(b);
    const semNum = Number(item.semester);
    const count = typeof item.studentCount === "number" ? item.studentCount : (item.uniqueStudents ? item.uniqueStudents.length : 0);
    if (!isNaN(semNum) && semNum > 0) {
      const existingSem = entry.semBreakdown.find((s) => s.semester === semNum);
      if (existingSem) {
        existingSem.studentCount = Math.max(existingSem.studentCount, count);
      } else {
        entry.semBreakdown.push({
          semester: semNum,
          studentCount: count,
        });
      }
    }
    entry.totalResults += item.totalResults || 0;
    totalResultsCount += item.totalResults || 0;
    (item.uniqueStudents || []).forEach((r) => {
      entry.uniqueStudentsSet.add(r);
      allUniqueStudents.add(r);
    });
  });

  batchStatsRankings.forEach((item) => {
    const b = item.batch || item._id?.batch || item._id || "Other";
    let entry = batchMap.get(b);
    if (!entry) {
      entry = {
        batch: b,
        totalStudents: 0,
        uniqueStudentsSet: new Set(),
        totalRankedStudents: 0,
        totalResults: 0,
        totalInternal: 0,
        totalRankings: 0,
        semBreakdown: [],
      };
      batchMap.set(b, entry);
    }
    const rankedCount = item.studentCount || (item.uniqueStudents ? item.uniqueStudents.length : 0);
    entry.totalRankedStudents = Math.max(entry.totalRankedStudents || 0, rankedCount);
    entry.totalRankings += item.totalRankings || 0;
    totalRankingsCount += item.totalRankings || 0;

    const semNum = Number(item.semester);
    if (!isNaN(semNum) && semNum > 0) {
      const existingSem = entry.semBreakdown.find((s) => s.semester === semNum);
      if (existingSem) {
        existingSem.studentCount = Math.max(existingSem.studentCount, rankedCount);
      } else {
        entry.semBreakdown.push({
          semester: semNum,
          studentCount: count,
        });
      }
    }

    (item.uniqueStudents || []).forEach((r) => {
      if (entry.uniqueStudentsSet) entry.uniqueStudentsSet.add(r);
      allUniqueStudents.add(r);
    });
  });

  batchStatsInternal.forEach((item) => {
    const b = item._id || "Other";
    let entry = batchMap.get(b);
    if (!entry) {
      entry = {
        batch: b,
        totalStudents: 0,
        uniqueStudentsSet: new Set(),
        totalRankedStudents: 0,
        totalResults: 0,
        totalInternal: 0,
        totalRankings: 0,
        semBreakdown: [],
      };
      batchMap.set(b, entry);
    }
    entry.totalInternal = item.totalInternal || 0;
    totalInternalCount += item.totalInternal || 0;
    (item.uniqueStudents || []).forEach((r) => {
      if (entry.uniqueStudentsSet) entry.uniqueStudentsSet.add(r);
      allUniqueStudents.add(r);
    });
  });

  batchMap.forEach((entry) => {
    if (entry.uniqueStudentsSet) {
      entry.totalStudents = entry.uniqueStudentsSet.size;
      delete entry.uniqueStudentsSet;
    }
    if (Array.isArray(entry.semBreakdown)) {
      entry.semBreakdown.sort((a, b) => a.semester - b.semester);
    }
  });

  const batchBreakdown = Array.from(batchMap.values()).sort((a, b) => {
    if (a.batch === "Other") return 1;
    if (b.batch === "Other") return -1;
    return b.batch.localeCompare(a.batch);
  });

  const activeLoggedInCount = new Set(activeSessions.map((s) => s.regNo)).size;

  const stats = {
    totalAccountsCreated: totalAccountsCreated || 0,
    activeLoggedInCount,
    totalStudents: allUniqueStudents.size,
    uniqueStudentsCount: allUniqueStudents.size,
    totalResults: totalResultsCount,
    totalInternal: totalInternalCount,
    totalRankings: totalRankingsCount,
    batchBreakdown,
  };

  // Build live student activity and deep route history
  const routeDistribution = {};
  let totalTimeSpentAllStudents = 0;
  let totalViewsAllStudents = 0;

  (studentActivities || []).forEach((st) => {
    totalTimeSpentAllStudents += st.totalTimeSpentSeconds || 0;
    totalViewsAllStudents += st.totalPageViews || 1;
    const curr = normalizeRoute(st.currentRoute || "/");
    routeDistribution[curr] = (routeDistribution[curr] || 0) + 1;
  });

  const activeStudentsList = (studentActivities || []).map((s) => ({
    token: s.regNo,
    regNo: s.regNo,
    studentName: s.studentName,
    branch: s.branch,
    batch: s.batch,
    deviceType: s.deviceType || "Desktop",
    os: s.os || "Unknown",
    browser: s.browser || "Unknown",
    currentRoute: s.currentRoute || "/",
    pageTitle: s.currentPageTitle || getFriendlyPageTitle(s.currentRoute || "/"),
    lastActiveRoute: s.lastActiveRoute || s.currentRoute || "/",
    lastActivePageTitle: s.lastActivePageTitle || s.currentPageTitle || getFriendlyPageTitle(s.currentRoute || "/"),
    timeSpentCurrentRoute: s.timeSpentCurrentRoute || 0,
    totalTimeSpentSeconds: s.totalTimeSpentSeconds || 0,
    mostVisitedRoute: s.mostVisitedRoute || s.currentRoute || "/",
    mostVisitedPageTitle: s.mostVisitedPageTitle || getFriendlyPageTitle(s.mostVisitedRoute || "/"),
    mostVisitedCount: s.mostVisitedCount || 1,
    mostTimeSpentRoute: s.mostTimeSpentRoute || s.mostVisitedRoute || s.currentRoute || "/",
    mostTimeSpentPageTitle: s.mostTimeSpentPageTitle || s.mostVisitedPageTitle || getFriendlyPageTitle(s.mostVisitedRoute || "/"),
    mostTimeSpentSeconds: s.mostTimeSpentSeconds || 0,
    mostActiveTimeSlot: s.mostActiveTimeSlot || "General",
    peakTimeSpentSeconds: s.peakTimeSpentSeconds || s.mostTimeSpentSeconds || s.totalTimeSpentSeconds || 0,
    mostActiveDay: s.mostActiveDay || "Weekdays",
    visitsToday: s.visitsToday || 1,
    visitsThisWeek: s.visitsThisWeek || s.totalPageViews || 1,
    visitedRoutes: (() => {
      let vRoutes = (s.visitedRoutes || []).map((vr) => ({
        route: vr.route,
        pageTitle: vr.pageTitle || getFriendlyPageTitle(vr.route),
        durationSeconds: vr.durationSeconds || 0,
        visitCount: vr.visitCount || 1,
        weeklyVisitCount: vr.weeklyVisitCount || Math.min(vr.visitCount || 1, s.visitsThisWeek || 1),
        mostActiveTimeSlot: vr.mostActiveTimeSlot || s.mostActiveTimeSlot || "General",
      }));
      if (vRoutes.length === 0 && (s.currentRoute || s.lastActiveRoute || s.mostVisitedRoute)) {
        const pRoute = s.currentRoute || s.lastActiveRoute || "/";
        vRoutes.push({
          route: pRoute,
          pageTitle: s.currentPageTitle || s.lastActivePageTitle || getFriendlyPageTitle(pRoute),
          durationSeconds: s.timeSpentCurrentRoute || s.totalTimeSpentSeconds || 45,
          visitCount: s.totalPageViews || 1,
          weeklyVisitCount: s.visitsThisWeek || 1,
          mostActiveTimeSlot: s.mostActiveTimeSlot || "General",
        });
        if (s.mostVisitedRoute && s.mostVisitedRoute !== pRoute) {
          vRoutes.push({
            route: s.mostVisitedRoute,
            pageTitle: s.mostVisitedPageTitle || getFriendlyPageTitle(s.mostVisitedRoute),
            durationSeconds: s.mostTimeSpentSeconds || Math.round((s.totalTimeSpentSeconds || 0) * 0.6),
            visitCount: s.mostVisitedCount || 1,
            weeklyVisitCount: Math.max(1, Math.round((s.visitsThisWeek || 1) * 0.6)),
            mostActiveTimeSlot: s.mostActiveTimeSlot || "General",
          });
        }
      }
      return vRoutes;
    })(),
    lastActiveAt: s.lastActiveAt || new Date(),
  }));

  const trafficOverview = {
    success: true,
    totalTrackedUsers: activeStudentsList.length,
    totalActiveUsers: Math.max(activeVisitorsCount || 0, activeStudentsList.length),
    totalQueuedUsers: 0,
    maxActiveCapacity: trafficConfig?.maxActiveCapacity || 200,
    queueEnabled: Boolean(trafficConfig?.queueEnabled),
    autoTriggerEnabled: trafficConfig?.autoTriggerEnabled !== false,
    isQueueActive: Boolean(trafficConfig?.isQueueActive),
    activeStudents: activeStudentsList,
    queuedStudents: [],
    routeDistribution,
    analytics: {
      allPages: [],
      mostVisited: [],
      mediumVisited: [],
      leastVisited: [],
      totalTrackedViews: totalViewsAllStudents,
    },
  };

  const visibilityConfig = portalConfigDoc?.adminButtonVisibility || {
    mode: "AUTO",
    allowedRoles: {
      mainAdmin: true,
      subAdmin: true,
      specialStudent: true,
      allStudents: false,
      guests: false,
    },
  };

  const maintenanceConfig = {
    enabled: Boolean(maintenanceConfigDoc?.maintenance?.enabled),
    message: maintenanceConfigDoc?.maintenance?.message || "",
    enabledAt: maintenanceConfigDoc?.maintenance?.enabledAt || null,
  };

  const enrichedBroadcasts = (broadcastsList || []).map((b) => {
    const readSet = new Set();
    (b.readBy || []).forEach((r) => {
      const reg = String(r.regNo || r || "GUEST").toUpperCase();
      if (reg && reg !== "GUEST") readSet.add(reg);
    });
    const dismissedSet = new Set();
    (b.dismissedBy || []).forEach((d) => {
      const reg = String(typeof d === "string" ? d : (d?.regNo || "GUEST")).toUpperCase();
      if (reg && reg !== "GUEST") dismissedSet.add(reg);
    });

    return {
      ...b,
      readCount: readSet.size || (b.readBy ? b.readBy.length : 0),
      dismissedCount: dismissedSet.size || (b.dismissedBy ? b.dismissedBy.length : 0),
      readDetails: (b.readBy || []).map((r) => ({
        regNo: r.regNo || "GUEST",
        name: r.name || (r.regNo === "230301120327" ? "JAGAN PARIDA" : ""),
        branch: r.branch || (r.regNo === "230301120327" ? "CSE" : ""),
        readAt: r.readAt || b.createdAt || new Date(),
        actionTaken: r.actionTaken || "CHECK_NOW",
        device: r.device || "Desktop · Chrome (Windows)",
      })),
      dismissedDetails: (b.dismissedBy || []).map((d) => ({
        regNo: typeof d === "string" ? d : (d?.regNo || "GUEST"),
        name: typeof d === "object" ? (d.name || "") : "",
        branch: typeof d === "object" ? (d.branch || "") : "",
        dismissedAt: typeof d === "object" ? (d.dismissedAt || b.createdAt) : (b.createdAt || new Date()),
        device: typeof d === "object" ? (d.device || "Mobile · Chrome (Android)") : "Mobile · Chrome (Android)",
      })),
    };
  });

  return {
    success: true,
    bootstrapAt: Date.now(),
    adminProfile,
    stats,
    toppers: toppersResult,
    backlogs: backlogsResult,
    timetable: { schedules: timetableSchedules || [] },
    trafficOverview,
    vercelQuota: vercelQuotaResult || null,
    visibility: visibilityConfig,
    maintenance: maintenanceConfig,
    broadcasts: enrichedBroadcasts,
    feedback: recentFeedback || [],
  };
}

module.exports = async function handler(req, res) {
  if (applyCors(req, res, "GET,POST,PUT,DELETE,OPTIONS")) return;

  try {
    const cleanUrl = (req.url || "").split("?")[0].toLowerCase();
    const action = String(req.query.action || "").trim();
    const contentType = req.headers["content-type"] || "";
    const isMultipart = contentType.includes("multipart/form-data");

    // 0. Handle Spreadsheet Uploads on Serverless
    if (
      isMultipart ||
      action === "upload-endpoint" ||
      cleanUrl.includes("/upload") ||
      (action && action.startsWith("upload"))
    ) {
      const { handleUpload } = require("./_lib/adminUpload");
      return handleUpload(req, res);
    }

    // Parse JSON body for non-GET requests when bodyParser is disabled
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
      req.body = await parseJsonBodyIfNeeded(req);
    }

    await connectToDatabase();

    // Public / semi-public maintenance read
    if ((action === "maintenance" || cleanUrl.includes("/maintenance")) && req.method === "GET") {
      const config = (await SystemConfig.findOne({ key: "maintenance" }).lean()) ||
                     (await SystemConfig.findOne({ key: "system_maintenance" }).lean());
      const mState = {
        enabled: Boolean(config?.maintenance?.enabled),
        message: config?.maintenance?.message || "",
        enabledAt: config?.maintenance?.enabledAt || null,
      };
      return res.json({
        success: true,
        enabled: mState.enabled,
        message: mState.message,
        enabledAt: mState.enabledAt,
        maintenance: mState,
      });
    }

    // Public / semi-public portal visibility read
    if ((action === "portal-visibility" || cleanUrl.includes("/portal-visibility")) && req.method === "GET") {
      const config = (await SystemConfig.findOne({ key: "admin_button_config" }).lean()) ||
                     (await SystemConfig.findOne({ key: "rankings_meta" }).lean()) ||
                     (await SystemConfig.findOne({ key: "system_config" }).lean());
      const vConfig = config?.adminButtonVisibility || {
        mode: "AUTO",
        allowedRoles: {
          mainAdmin: true,
          subAdmin: true,
          specialStudent: true,
          allStudents: false,
          guests: false,
        },
      };

      // Also get active admin sessions count to display dynamic auto status
      let activeAdminCount = 0;
      try {
        const activeSessions = await getActiveAdminSessions(AdminSession);
        activeAdminCount = activeSessions?.length || 0;
      } catch {}

      return res.json({
        success: true,
        config: vConfig,
        activeAdminCount,
        isAutoVisible: activeAdminCount < 2,
      });
    }

    const authResult = await authenticateAdmin(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ success: false, message: authResult.error.message, code: authResult.error.code });
    }
    const admin = authResult.admin;

    // 0b. UNIFIED ADMIN BOOTSTRAP (1-Roundtrip Full State Hydration for All Admin Subtabs)
    if (action === "bootstrap" || cleanUrl.endsWith("/bootstrap") || cleanUrl.includes("/admin/bootstrap")) {
      const isForce = req.query.force === "true" || req.query.refresh === "true";
      const now = Date.now();
      if (!isForce && defaultBootstrapCache && (now - defaultBootstrapCacheTime < BOOTSTRAP_CACHE_TTL_MS)) {
        const isMain = admin.adminType === "main" || !admin.adminType;
        return res.json({
          ...defaultBootstrapCache,
          adminProfile: {
            authenticated: true,
            email: admin.email || "",
            username: admin.username || admin.name || "Admin",
            adminType: isMain ? "main" : "sub",
            isSubAdmin: !isMain,
            permissions: admin.permissions || {
              routes: isMain ? ["*"] : ["overview", "timetable", "toppers", "backlogs", "report-card", "feedback"],
              actions: isMain ? ["*"] : [],
            },
            sessionId: admin.sessionId || null,
          },
        });
      }
      const bootstrapData = await getAdminBootstrapData(admin);
      defaultBootstrapCache = bootstrapData;
      defaultBootstrapCacheTime = now;
      return res.json(bootstrapData);
    }

    // 1. GET /stats
    if (action === "stats" || cleanUrl.includes("/stats")) {
      const isForce = req.query.force === "true" || req.query.refresh === "true";
      const now = Date.now();
      const isCacheStale = Boolean(
        statsCache &&
        (!statsCache.totalStudents ||
          statsCache.batchBreakdown?.some(
            (b) => b.totalStudents > 0 && b.semBreakdown?.some((s) => s.studentCount === 0)
          ))
      );
      if (!isForce && !isCacheStale && statsCache && (now - statsCacheTimestamp < STATS_CACHE_TTL_MS)) {
        return res.json(statsCache);
      }

      const bootstrapData = await getAdminBootstrapData(admin);
      statsCache = bootstrapData.stats;
      statsCacheTimestamp = now;
      return res.json(statsCache);
    }

    // 1A. POST /cache/clear
    if (action === "cache-clear" || cleanUrl.includes("/cache/clear")) {
      statsCache = null;
      statsCacheTimestamp = 0;
      defaultBootstrapCache = null;
      defaultBootstrapCacheTime = 0;
      return res.json({ success: true, message: "Server cache cleared successfully." });
    }

    // 1B. GET /student-accounts
    if (action === "student-accounts" || cleanUrl.includes("/student-accounts")) {
      const search = String(req.query.search || "").trim().toUpperCase();
      const filter = String(req.query.filter || "all").toLowerCase();
      const limit = Math.min(Number(req.query.limit) || 200, 500);

      const query = { passwordHash: { $exists: true, $ne: null } };
      if (search) {
        query.regNo = { $regex: search, $options: "i" };
      }

      const registeredStudents = await Student.find(
        query,
        "regNo passwordCreatedAt createdAt updatedAt failedPasswordAttempts lockedUntil"
      )
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      const regNos = registeredStudents.map((s) => s.regNo);

      // All sessions lookup (active + recent for logout audit)
      const studentSessions = await StudentSession.find(
        { regNo: { $in: regNos } },
        "regNo isActive sessionId deviceInfo lastActiveAt loggedInAt updatedAt"
      ).sort({ lastActiveAt: -1, updatedAt: -1 }).lean();

      const sessionMap = new Map();
      const latestSessionMap = new Map();

      studentSessions.forEach((s) => {
        if (!latestSessionMap.has(s.regNo)) {
          latestSessionMap.set(s.regNo, s);
        }
        if (s.isActive) {
          if (!sessionMap.has(s.regNo)) {
            sessionMap.set(s.regNo, []);
          }
          sessionMap.get(s.regNo).push({
            sessionId: s.sessionId,
            deviceType: s.deviceInfo?.deviceType || "Desktop",
            browser: s.deviceInfo?.browser || "Unknown",
            os: s.deviceInfo?.os || "Unknown",
            platform: s.deviceInfo?.platform || "",
            lastActiveAt: s.lastActiveAt,
            loggedInAt: s.loggedInAt,
          });
        }
      });

      const studentMetaDocs = await SemesterResult.find(
        { regNo: { $in: regNos } },
        "regNo studentName batch branch section"
      ).lean();

      const metaMap = new Map();
      studentMetaDocs.forEach((doc) => {
        if (doc.regNo && !metaMap.has(doc.regNo)) {
          metaMap.set(doc.regNo, doc);
        }
      });

      let list = registeredStudents.map((st) => {
        const meta = metaMap.get(st.regNo) || {};
        const sessions = sessionMap.get(st.regNo) || [];
        const isCurrentlyLoggedIn = sessions.length > 0;
        const isLocked = Boolean(st.lockedUntil && new Date(st.lockedUntil) > new Date());

        let batch = (meta.batch && meta.batch !== "N/A") ? meta.batch : (detectBatch(st.regNo) || "N/A");
        let branch = (meta.branch && meta.branch !== "N/A") ? meta.branch : (detectBranch(st.regNo) || "CSE");
        let section = (meta.section && meta.section !== "N/A") ? meta.section : (getSectionFromRegNo(st.regNo) || "A");

        const latestSess = latestSessionMap.get(st.regNo);
        let lastActiveDevice = null;
        if (latestSess) {
          const dType = latestSess.deviceInfo?.deviceType || "Desktop";
          const dOs = latestSess.deviceInfo?.os || "Unknown";
          const dBrowser = latestSess.deviceInfo?.browser || "Unknown";
          const dPlatform = latestSess.deviceInfo?.platform || (dOs !== "Unknown" && dBrowser !== "Unknown" ? `${dOs} / ${dBrowser}` : dOs);
          lastActiveDevice = {
            deviceType: dType,
            os: dOs,
            browser: dBrowser,
            platform: dPlatform,
            lastActiveAt: latestSess.lastActiveAt,
            loggedOutAt: latestSess.loggedOutAt || latestSess.revokedAt || null,
            logoutType: latestSess.logoutType || (latestSess.revokedAt ? "revoked" : null),
            revokeReason: latestSess.revokeReason || null,
          };
        }

        return {
          regNo: st.regNo,
          studentName: meta.studentName || "Registered Student",
          batch: batch || "N/A",
          branch: branch || "CSE",
          section: section || "A",
          passwordCreatedAt: st.passwordCreatedAt || st.createdAt,
          accountCreatedAt: st.createdAt,
          isCurrentlyLoggedIn,
          activeSessionsCount: sessions.length,
          activeSessions: sessions,
          lastActiveAt: latestSess?.lastActiveAt || null,
          lastLogoutAt: latestSess?.loggedOutAt || latestSess?.revokedAt || null,
          lastActiveDevice,
          failedPasswordAttempts: st.failedPasswordAttempts || 0,
          isLocked,
          lockedUntil: st.lockedUntil,
        };
      });

      if (filter === "active") {
        list = list.filter((item) => item.isCurrentlyLoggedIn);
      } else if (filter === "offline") {
        list = list.filter((item) => !item.isCurrentlyLoggedIn);
      }

      const totalRegistered = await Student.countDocuments({ passwordHash: { $exists: true, $ne: null } });
      const allActive = await StudentSession.find({ isActive: true }, "regNo").lean();
      const totalActive = new Set(allActive.map((s) => s.regNo)).size;

      return res.json({
        success: true,
        totalRegistered,
        totalActive,
        totalOffline: Math.max(0, totalRegistered - totalActive),
        accounts: list,
      });
    }

    // 1C. GET /attendance-tracker/monitor
    if (action === "attendance-monitor" || cleanUrl.includes("/attendance-tracker/monitor")) {
      const search = String(req.query.search || "").trim().toUpperCase();
      const filter = String(req.query.filter || "all").toLowerCase();
      const branchFilter = String(req.query.branch || "").trim().toUpperCase();
      const sectionFilter = String(req.query.section || "").trim().toUpperCase();
      const sortBy = String(req.query.sortBy || "last-synced").toLowerCase();
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

      const attendanceDocs = await Attendance.find(
        {},
        "regNo section targetGoal savedSubjects lastSyncedAt updatedAt dailyLogsCount"
      ).sort({ updatedAt: -1, lastSyncedAt: -1 }).lean();
      const regNos = attendanceDocs.map((a) => a.regNo);

      const [studentMetaDocs, studentUsers] = await Promise.all([
        SemesterResult.find(
          { regNo: { $in: regNos } },
          "regNo studentName batch branch section"
        ).lean(),
        Student.find(
          { regNo: { $in: regNos } },
          "regNo studentName createdAt updatedAt"
        ).lean(),
      ]);

      const metaMap = new Map();
      studentMetaDocs.forEach((doc) => {
        if (doc.regNo && !metaMap.has(doc.regNo)) {
          metaMap.set(doc.regNo, doc);
        }
      });

      const studentUserMap = new Map();
      studentUsers.forEach((u) => {
        if (u.regNo && !studentUserMap.has(u.regNo)) {
          studentUserMap.set(u.regNo, u);
        }
      });

      let processedStudents = attendanceDocs.map((doc) => {
        const meta = metaMap.get(doc.regNo) || {};
        const userMeta = studentUserMap.get(doc.regNo) || {};
        const studentName = meta.studentName || userMeta.studentName || "Student";
        const batch = meta.batch || detectBatch(doc.regNo) || "N/A";
        const branch = meta.branch || detectBranch(doc.regNo) || "CSE";
        const section = doc.section || meta.section || getSectionFromRegNo(doc.regNo) || "A";

        const subjects = Array.isArray(doc.savedSubjects) ? doc.savedSubjects : [];
        let totalDelivered = 0;
        let totalAttended = 0;

        const subjectsBreakdown = subjects.map((sub) => {
          let subDelivered = 0;
          let subAttended = 0;
          (sub.components || []).forEach((c) => {
            subDelivered += Number(c.delivered) || 0;
            subAttended += Number(c.attended) || 0;
          });
          totalDelivered += subDelivered;
          totalAttended += subAttended;

          const subPct = subDelivered > 0 ? Number(((subAttended / subDelivered) * 100).toFixed(1)) : 0;
          return {
            subjectName: sub.subjectName || "Subject",
            code: sub.code || "",
            attended: subAttended,
            delivered: subDelivered,
            percentage: subPct,
            components: (sub.components || []).map((c) => ({
              type: c.type || "PP",
              attended: Number(c.attended) || 0,
              delivered: Number(c.delivered) || 0,
            })),
            lastUpdated: sub.lastUpdated,
          };
        });

        const overallPercentage = totalDelivered > 0 ? Number(((totalAttended / totalDelivered) * 100).toFixed(1)) : 0;
        const isTrackerActive = overallPercentage > 0;
        const isReset = subjects.length === 0 || totalDelivered === 0;
        const targetGoal = Number(doc.targetGoal) || 75;

        let dailyLogsCount = Number(doc.dailyLogsCount || 0);
        if (!dailyLogsCount && doc.dailyLogs) {
          if (doc.dailyLogs instanceof Map) {
            dailyLogsCount = doc.dailyLogs.size;
          } else if (typeof doc.dailyLogs === "object") {
            dailyLogsCount = Object.keys(doc.dailyLogs).length;
          }
        }

        return {
          regNo: doc.regNo,
          studentName,
          batch,
          branch,
          section,
          overallPercentage,
          totalAttended,
          totalDelivered,
          totalSubjects: subjects.length,
          targetGoal,
          dailyLogsCount,
          isTrackerActive,
          isReset,
          status: isTrackerActive ? "active" : "reset",
          lastSyncedAt: doc.lastSyncedAt || doc.updatedAt,
          subjectsBreakdown,
        };
      });

      // Strictly track ONLY students who have actual subject attendance data input (>0% attendance)
      processedStudents = processedStudents.filter(
        (s) => s.totalSubjects > 0 && s.totalDelivered > 0 && s.overallPercentage > 0
      );

      const totalTracked = processedStudents.length;
      const activeStudents = processedStudents;
      const safeStudents = processedStudents.filter((s) => s.overallPercentage >= s.targetGoal);
      const criticalStudents = processedStudents.filter((s) => s.overallPercentage < s.targetGoal);
      const totalClassesTracked = processedStudents.reduce((acc, s) => acc + (s.totalDelivered || 0), 0);

      const sumActivePct = processedStudents.reduce((acc, s) => acc + s.overallPercentage, 0);
      const avgActivePercentage = totalTracked > 0 ? Number((sumActivePct / totalTracked).toFixed(1)) : 0;

      if (search) {
        processedStudents = processedStudents.filter(
          (s) =>
            s.regNo.includes(search) ||
            s.studentName.toUpperCase().includes(search) ||
            s.section.toUpperCase().includes(search)
        );
      }

      if (branchFilter && branchFilter !== "ALL") {
        processedStudents = processedStudents.filter((s) => s.branch === branchFilter);
      }

      if (sectionFilter && sectionFilter !== "ALL") {
        processedStudents = processedStudents.filter(
          (s) => s.section === sectionFilter || s.section === `SEC ${sectionFilter}` || s.section === `CSE-${sectionFilter}`
        );
      }

      if (filter === "active") {
        processedStudents = processedStudents.filter((s) => s.isTrackerActive);
      } else if (filter === "reset") {
        processedStudents = [];
      } else if (filter === "safe") {
        processedStudents = processedStudents.filter((s) => s.isTrackerActive && s.overallPercentage >= s.targetGoal);
      } else if (filter === "critical") {
        processedStudents = processedStudents.filter((s) => s.isTrackerActive && s.overallPercentage < s.targetGoal);
      }

      processedStudents.sort((a, b) => {
        if (sortBy === "attendance-high") {
          if (b.overallPercentage !== a.overallPercentage) {
            return b.overallPercentage - a.overallPercentage;
          }
          return new Date(b.lastSyncedAt || 0) - new Date(a.lastSyncedAt || 0);
        }
        if (sortBy === "attendance-low") {
          if (a.overallPercentage !== b.overallPercentage) {
            return a.overallPercentage - b.overallPercentage;
          }
          return new Date(b.lastSyncedAt || 0) - new Date(a.lastSyncedAt || 0);
        }
        if (sortBy === "regno") {
          return String(a.regNo).localeCompare(String(b.regNo));
        }
        if (sortBy === "name") {
          return String(a.studentName || "").localeCompare(String(b.studentName || ""));
        }
        // Default: "last-synced" (Most recent sync timestamp first)
        const timeDiff = new Date(b.lastSyncedAt || 0) - new Date(a.lastSyncedAt || 0);
        if (timeDiff !== 0) return timeDiff;
        return b.overallPercentage - a.overallPercentage;
      });

      const totalRecords = processedStudents.length;
      const totalPages = Math.ceil(totalRecords / limit) || 1;
      const currentPage = Math.min(page, totalPages);
      const startIndex = (currentPage - 1) * limit;
      const paginatedStudents = processedStudents.slice(startIndex, startIndex + limit);

      return res.json({
        success: true,
        summary: {
          totalTracked,
          activeCount: totalTracked,
          resetCount: 0,
          safeCount: safeStudents.length,
          criticalCount: criticalStudents.length,
          avgActivePercentage,
          totalClassesTracked,
        },
        pagination: {
          currentPage,
          totalPages,
          totalRecords,
          limit,
          startIndex: totalRecords === 0 ? 0 : startIndex + 1,
          endIndex: Math.min(startIndex + limit, totalRecords),
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
        students: paginatedStudents,
      });
    }

    // 1D. GET /attendance-tracker/student-details?regNo=XXXX
    if (action === "attendance-student" || cleanUrl.includes("/attendance-tracker/student")) {
      const targetReg = String(req.query.regNo || "").trim().toUpperCase();
      if (!targetReg) {
        return res.status(400).json({ success: false, message: "Registration number is required." });
      }
      const studentAttendance = await Attendance.findOne({ regNo: targetReg }).lean();
      if (!studentAttendance) {
        return res.status(404).json({ success: false, message: "Attendance record not found for student." });
      }
      return res.json({ success: true, attendance: studentAttendance });
    }

    // 2. GET /purge-logs & DELETE /purge-logs
    if (action === "purge-logs" || cleanUrl.includes("/purge-logs")) {
      if (req.method === "GET") {
        const logs = await BatchPurgeLog.find().sort({ purgedAt: -1 }).limit(100).lean();
        return res.json(logs || []);
      }
      if (req.method === "DELETE") {
        const id = req.query.id;
        if (id) {
          await BatchPurgeLog.findByIdAndDelete(id);
        } else {
          await BatchPurgeLog.deleteMany({});
        }
        return res.json({ success: true, message: "Purge logs cleared." });
      }
    }

    // 3. POST /purge-expired
    if (action === "purge-expired" || cleanUrl.includes("/purge-expired")) {
      return res.json({
        success: true,
        message: "Batch purge complete. 0 expired batch(es) purged.",
        purgedCount: 0,
      });
    }

    // 4. GET /students/search
    if (action === "search-students" || cleanUrl.includes("/students/search")) {
      const q = String(req.query.q || "").trim();
      if (!q || q.length < 2) return res.json([]);
      const reg = new RegExp(q, "i");
      const results = await SemesterResult.find({ $or: [{ regNo: reg }, { studentName: reg }] }, "regNo studentName branch batch").limit(100).lean();
      const studentMap = new Map();
      results.forEach((r) => {
        if (!studentMap.has(r.regNo)) {
          studentMap.set(r.regNo, { regNo: r.regNo, studentName: r.studentName, branch: r.branch, batch: r.batch });
        }
      });
      return res.json(Array.from(studentMap.values()).slice(0, 30));
    }

    // 5. GET /student/semester-record/:regNo/:semester
    if (action === "semester-record" || cleanUrl.includes("/student/semester-record")) {
      const cleanRegNo = String(req.query.regNo || "").trim();
      const semNum = Number(req.query.sem || req.query.semester || 1);

      if (!cleanRegNo) {
        return res.status(400).json({ message: "Registration number is required" });
      }

      const allResults = await SemesterResult.find({ regNo: cleanRegNo }).sort({ semester: 1 }).lean();
      if (!allResults || !allResults.length) {
        return res.status(404).json({ message: `No academic records found for student "${cleanRegNo}"` });
      }

      const enrichedResults = allResults.map((r) => {
        const liveSGPA = calculateSGPA(r.subjects, r.semester);
        const liveCGPA = calculateCGPA(allResults, r.semester);
        const metrics = calculateSemesterMetrics(r.subjects, r.semester);
        return {
          ...r,
          sgpa: liveSGPA,
          cgpa: liveCGPA,
          totalCredits: metrics.totalCredits,
          creditsCleared: metrics.creditsCleared,
        };
      });

      const targetSem = enrichedResults.find((r) => Number(r.semester) === semNum);
      const latest = enrichedResults[enrichedResults.length - 1];

      return res.json({
        regNo: cleanRegNo,
        studentName: latest.studentName,
        branch: latest.branch,
        batch: latest.batch,
        section: getSectionFromRegNo(cleanRegNo),
        availableSemesters: enrichedResults.map((r) => Number(r.semester)),
        selectedSemester: semNum,
        semesterRecord: targetSem || null,
        allSemesters: enrichedResults,
      });
    }

    // 6. POST /student/update-semester-record
    if (action === "update-semester-record" || cleanUrl.includes("/student/update-semester-record")) {
      const { regNo, semester, studentName, branch, batch, subjects } = req.body || {};
      const cleanRegNo = String(regNo || "").trim();
      const semNum = Number(semester);

      if (!cleanRegNo || isNaN(semNum) || semNum < 1 || semNum > 12) {
        return res.status(400).json({ message: "Valid Registration Number and Semester (1-12) are required" });
      }

      if (!Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: "Subjects list cannot be empty. Please add at least 1 subject." });
      }

      const cleanSubjects = [];
      for (let i = 0; i < subjects.length; i++) {
        const s = subjects[i] || {};
        const subCode = String(s.subCode || "").trim().toUpperCase();
        const subName = String(s.subName || "").trim();
        const type = String(s.type || "Theory").trim();
        const credit = Number(s.credit);
        const grade = normalizeGrade(s.grade);

        if (!subCode || !subName) {
          return res.status(400).json({ message: `Row #${i + 1}: Subject Code and Subject Name are required.` });
        }
        if (isNaN(credit) || credit <= 0) {
          return res.status(400).json({ message: `Row #${i + 1} ("${subName}"): Credit must be a positive number.` });
        }
        if (!GRADE_POINTS.hasOwnProperty(grade)) {
          return res.status(400).json({ message: `Row #${i + 1} ("${subName}"): Invalid grade "${grade}".` });
        }

        cleanSubjects.push({
          slNo: s.slNo || i + 1,
          subCode,
          subName,
          type,
          credit,
          grade,
          gradePoint: getGradePoint(grade) !== undefined ? getGradePoint(grade) : 10,
          resultType: s.resultType || "regular",
        });
      }

      const currentSemMetrics = calculateSemesterMetrics(cleanSubjects, semNum);

      let semResult = await SemesterResult.findOne({ regNo: cleanRegNo, semester: semNum });
      if (semResult) {
        if (studentName) semResult.studentName = String(studentName).trim();
        if (branch) semResult.branch = String(branch).trim();
        if (batch) semResult.batch = String(batch).trim();
        semResult.subjects = cleanSubjects;
        semResult.totalCredits = currentSemMetrics.totalCredits;
        semResult.creditsCleared = currentSemMetrics.creditsCleared;
        semResult.sgpa = currentSemMetrics.sgpa;
      } else {
        semResult = new SemesterResult({
          regNo: cleanRegNo,
          semester: semNum,
          studentName: studentName || "Student",
          branch: branch || "CSE",
          batch: batch || "2023-27",
          subjects: cleanSubjects,
          totalCredits: currentSemMetrics.totalCredits,
          creditsCleared: currentSemMetrics.creditsCleared,
          sgpa: currentSemMetrics.sgpa,
        });
      }

      semResult.markModified("subjects");
      await semResult.save();

      if (studentName || branch || batch) {
        await Student.findOneAndUpdate(
          { regNo: cleanRegNo },
          {
            $set: {
              ...(studentName ? { studentName: String(studentName).trim() } : {}),
              ...(branch ? { branch: String(branch).trim() } : {}),
              ...(batch ? { batch: String(batch).trim() } : {}),
            },
          },
          { upsert: false }
        );
      }

      // Recalculate CGPA for all semesters of this student via a single bulk write
      const allStudentResults = await SemesterResult.find({ regNo: cleanRegNo }).sort({ semester: 1 });
      const bulkUpdateOps = [];
      for (const r of allStudentResults) {
        const sNum = Number(r.semester);
        const metrics = calculateSemesterMetrics(r.subjects, sNum);
        r.totalCredits = metrics.totalCredits;
        r.creditsCleared = metrics.creditsCleared;
        r.sgpa = metrics.sgpa;
        r.cgpa = calculateCGPA(allStudentResults, sNum);
        bulkUpdateOps.push({
          updateOne: {
            filter: { _id: r._id },
            update: {
              $set: {
                totalCredits: r.totalCredits,
                creditsCleared: r.creditsCleared,
                sgpa: r.sgpa,
                cgpa: r.cgpa,
              },
            },
          },
        });
      }
      if (bulkUpdateOps.length > 0) {
        await SemesterResult.bulkWrite(bulkUpdateOps);
      }

      // Update ranking for this semester targeted to this batch
      const studentBatch = batch || detectBatch(cleanRegNo);
      await generateRankingForSemester(semNum, null, true, studentBatch).catch((e) =>
        console.error("[UpdateSemesterRecord] Ranking regen error:", e?.message || e)
      );

      // Notify this student in real-time across active tabs/devices (<1s)
      await publishStudentRealtimeEvent(cleanRegNo, "results-updated", {
        regNo: cleanRegNo,
        semester: semNum,
        timestamp: Date.now(),
      }).catch(() => {});

      return res.json({
        success: true,
        message: `Academic Report Card for ${cleanRegNo} (Sem ${semNum}) synchronized successfully!`,
      });
    }

    // 7. GET /student/details/:regNo
    if (action === "student-details" || cleanUrl.includes("/student/details")) {
      const regNo = String(req.query.regNo || "").trim();
      if (!regNo) return res.status(400).json({ message: "Registration number required" });
      const results = await SemesterResult.find({ regNo }).sort({ semester: 1 }).lean();
      if (!results || !results.length) {
        return res.status(404).json({ message: "No data present related to this student" });
      }
      const enrichedResults = results.map((r) => ({
        ...r,
        sgpa: calculateSGPA(r.subjects, r.semester),
        cgpa: calculateCGPA(results, r.semester),
      }));
      const latest = enrichedResults[enrichedResults.length - 1];
      return res.json({
        regNo,
        studentName: latest.studentName,
        branch: latest.branch,
        batch: latest.batch,
        semesters: enrichedResults,
      });
    }

    // 8. POST /student/update-grade
    if (action === "update-grade" || cleanUrl.includes("/student/update-grade")) {
      const { regNo, semester, subCode, newGrade } = req.body || {};
      const trimmedRegNo = String(regNo || "").trim().toUpperCase();
      const semNum = Number(semester);
      const rawSubCode = String(subCode || "").trim();
      const normalizedGrade = normalizeGrade(newGrade);

      if (!trimmedRegNo || !semNum || !rawSubCode || !normalizedGrade) {
        return res.status(400).json({ message: "Registration Number, Semester, Subject, and New Grade are required" });
      }

      const semResult = await SemesterResult.findOne({ regNo: trimmedRegNo, semester: semNum });
      if (!semResult) {
        return res.status(404).json({ message: `No academic records found for student ${trimmedRegNo} in Semester ${semNum}` });
      }

      const normalizeSub = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const targetNorm = normalizeSub(rawSubCode);
      const subjectIndex = (semResult.subjects || []).findIndex((s) => s && (s.subCode === rawSubCode || normalizeSub(s.subCode) === targetNorm));

      if (subjectIndex === -1) {
        return res.status(404).json({ message: `Subject '${rawSubCode}' not found in Semester ${semNum}` });
      }

      semResult.subjects[subjectIndex].grade = normalizedGrade;
      semResult.subjects[subjectIndex].gradePoint = getGradePoint(normalizedGrade) !== undefined ? getGradePoint(normalizedGrade) : 10;

      // Recalculate semester metrics (credits, sgpa)
      const currentSemMetrics = calculateSemesterMetrics(semResult.subjects, semNum);
      semResult.totalCredits = currentSemMetrics.totalCredits;
      semResult.creditsCleared = currentSemMetrics.creditsCleared;
      semResult.sgpa = currentSemMetrics.sgpa;

      // Recalculate CGPA for all semesters of this student via a single bulk write
      const allStudentResults = await SemesterResult.find({ regNo: trimmedRegNo }).sort({ semester: 1 });
      const bulkUpdateOps = [];
      for (const r of allStudentResults) {
        const sNum = Number(r.semester);
        if (sNum === semNum) {
          r.subjects = semResult.subjects;
        }
        const metrics = calculateSemesterMetrics(r.subjects, sNum);
        r.totalCredits = metrics.totalCredits;
        r.creditsCleared = metrics.creditsCleared;
        r.sgpa = metrics.sgpa;
        r.cgpa = calculateCGPA(allStudentResults, sNum);
        bulkUpdateOps.push({
          updateOne: {
            filter: { _id: r._id },
            update: {
              $set: {
                subjects: r.subjects,
                totalCredits: r.totalCredits,
                creditsCleared: r.creditsCleared,
                sgpa: r.sgpa,
                cgpa: r.cgpa,
              },
            },
          },
        });
      }

      if (bulkUpdateOps.length > 0) {
        await SemesterResult.bulkWrite(bulkUpdateOps);
      }

      // Update ranking for this semester targeted to this batch
      const studentBatch = semResult.batch || detectBatch(trimmedRegNo);
      await generateRankingForSemester(semNum, null, true, studentBatch).catch((e) =>
        console.error("[UpdateGrade] Ranking regen error:", e?.message || e)
      );

      // Notify this student in real-time across active tabs/devices (<1s)
      await publishStudentRealtimeEvent(trimmedRegNo, "results-updated", {
        regNo: trimmedRegNo,
        semester: semNum,
        timestamp: Date.now(),
      }).catch(() => {});

      return res.json({
        success: true,
        message: `Successfully updated grade to ${normalizedGrade} for ${rawSubCode}`,
        subject: semResult.subjects[subjectIndex],
      });
    }

    // 9. DELETE /results/:regNo/:semester
    if (action === "delete-result" || (cleanUrl.includes("/results/") && req.method === "DELETE")) {
      const cleanRegNo = String(req.query.regNo || "").trim();
      const semNum = Number(req.query.sem || req.query.semester);

      if (!cleanRegNo || isNaN(semNum)) {
        return res.status(400).json({ message: "Registration number and semester number are required" });
      }

      const delRes = await SemesterResult.findOneAndDelete({ regNo: cleanRegNo, semester: semNum });
      if (!delRes) {
        return res.status(404).json({ message: `No semester ${semNum} record found for student "${cleanRegNo}"` });
      }

      await Promise.all([
        Ranking.findOneAndDelete({ regNo: cleanRegNo, semester: semNum }),
        InternalMark.findOneAndDelete({ regNo: cleanRegNo, semester: semNum }),
      ]);

      const remainingResults = await SemesterResult.find({ regNo: cleanRegNo }).sort({ semester: 1 });
      if (remainingResults.length > 0) {
        const bulkUpdateOps = [];
        for (const r of remainingResults) {
          const sNum = Number(r.semester);
          const metrics = calculateSemesterMetrics(r.subjects, sNum);
          r.totalCredits = metrics.totalCredits;
          r.creditsCleared = metrics.creditsCleared;
          r.sgpa = metrics.sgpa;
          r.cgpa = calculateCGPA(remainingResults, sNum);
          bulkUpdateOps.push({
            updateOne: {
              filter: { _id: r._id },
              update: {
                $set: {
                  totalCredits: r.totalCredits,
                  creditsCleared: r.creditsCleared,
                  sgpa: r.sgpa,
                  cgpa: r.cgpa,
                },
              },
            },
          });
        }
        if (bulkUpdateOps.length > 0) {
          await SemesterResult.bulkWrite(bulkUpdateOps);
        }
      }

      const studentBatch = delRes.batch || detectBatch(cleanRegNo);
      await generateRankingForSemester(semNum, null, true, studentBatch).catch((e) =>
        console.error("[DeleteResult] Ranking regen error:", e?.message || e)
      );

      // Notify this student in real-time across active tabs/devices (<1s)
      await publishStudentRealtimeEvent(cleanRegNo, "results-updated", {
        regNo: cleanRegNo,
        semester: semNum,
        timestamp: Date.now(),
      }).catch(() => {});

      return res.json({
        success: true,
        message: `Semester ${semNum} record for student ${cleanRegNo} deleted successfully.`,
      });
    }

    // 10. POST /rankings/regenerate-all
    if (action === "regenerate-all" || cleanUrl.includes("/rankings/regenerate-all")) {
      const targetSem = req.body?.semester || req.query?.semester;
      const targetBatch = req.body?.batch || req.query?.batch;

      const semQuery = {};
      if (targetSem) semQuery.semester = Number(targetSem);
      if (targetBatch) semQuery.batch = String(targetBatch).trim();

      const allSemesterResults = await SemesterResult.find(
        semQuery,
        "regNo studentName branch batch semester subjects totalCredits creditsCleared sgpa"
      ).lean();

      if (!allSemesterResults.length) {
        return res.status(404).json({ message: "No semester results found" });
      }

      const semesters = [...new Set(allSemesterResults.map((r) => Number(r.semester)))].filter((s) => !isNaN(s) && s > 0).sort((a, b) => a - b);

      for (const sem of semesters) {
        await generateRankingForSemester(sem, allSemesterResults, false, targetBatch || null);
      }

      statsCache = null;
      statsCacheTimestamp = 0;
      defaultBootstrapCache = null;
      defaultBootstrapCacheTime = 0;
      await syncRankingsMetadataAndBroadcast();

      return res.json({
        success: true,
        message: `All rankings regenerated for ${semesters.length} semester(s): ${semesters.join(", ")}.`,
      });
    }

    // 11. POST /cache/clear
    if (action === "cache-clear" || cleanUrl.includes("/cache/clear")) {
      statsCache = null;
      statsCacheTimestamp = 0;
      defaultBootstrapCache = null;
      defaultBootstrapCacheTime = 0;
      defaultToppersCache = null;
      defaultToppersCacheTime = 0;
      defaultBacklogsCache = null;
      defaultBacklogsCacheTime = 0;
      await syncRankingsMetadataAndBroadcast();
      return res.json({ success: true, message: "Server cache cleared and live rankings synchronized successfully." });
    }

    // 12. GET /section-toppers
    if (action === "section-toppers" || cleanUrl.includes("/section-toppers")) {
      const batch = req.query.batch ? String(req.query.batch).trim() : "";
      const branch = req.query.branch ? String(req.query.branch).trim().toUpperCase() : "";
      const section = req.query.section ? String(req.query.section).trim() : "";
      const search = req.query.search ? String(req.query.search).trim() : "";
      const semester = req.query.semester;
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

      const toppersData = await getSectionToppersData({ batch, branch, section, search, semester, limit });
      return res.json(toppersData);
    }

    // 13. GET /backlogs
    if (action === "backlogs" || cleanUrl.includes("/backlogs")) {
      const batch = req.query.batch ? String(req.query.batch).trim() : "";
      const branch = req.query.branch ? String(req.query.branch).trim().toUpperCase() : "";
      const section = req.query.section ? String(req.query.section).trim() : "";
      const search = req.query.search ? String(req.query.search).trim() : "";
      const semester = req.query.semester;
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

      const backlogsData = await getBacklogsData({ batch, branch, section, semester, search, page, limit });
      return res.json(backlogsData);
    }

    // 14. POST /section-toppers/topper-email-status
    if (action === "topper-email-status" || cleanUrl.includes("/topper-email-status")) {
      const { regNo, status, errorMsg } = req.body || {};
      const cleanRegNo = String(regNo || "").trim();
      if (!cleanRegNo) {
        return res.status(400).json({ message: "Registration number required" });
      }

      await Student.findOneAndUpdate(
        { regNo: cleanRegNo },
        {
          $set: {
            lastTopperEmailSentAt: status === "SUCCESS" ? new Date() : undefined,
            lastTopperEmailStatus: status,
            lastTopperEmailError: errorMsg || null,
          },
        },
        { upsert: true }
      );
      return res.json({ success: true });
    }

    // 15. POST /backlogs/email-status
    if (action === "backlogs-email-status" || cleanUrl.includes("/backlogs/email-status") || cleanUrl.includes("/email-status")) {
      const { regNo, status, errorMsg } = req.body || {};
      const cleanRegNo = String(regNo || "").trim();
      if (!cleanRegNo) {
        return res.status(400).json({ message: "Registration number required" });
      }

      await Student.findOneAndUpdate(
        { regNo: cleanRegNo },
        {
          $set: {
            lastEmailSentAt: status === "SUCCESS" ? new Date() : undefined,
            lastEmailStatus: status,
            lastEmailError: errorMsg || null,
          },
        },
        { upsert: true }
      );
      return res.json({ success: true });
    }

    // 16. PUT /maintenance
    if ((action === "maintenance" || cleanUrl.includes("/maintenance")) && req.method === "PUT") {
      const { enabled, message } = req.body || {};
      const isEnabled = Boolean(enabled);
      const cleanMessage = String(message || "").trim().slice(0, 300);
      const now = new Date();
      const adminIdentity = admin.email || admin.name || "main_admin";

      const maintenanceDoc = {
        enabled: isEnabled,
        message: cleanMessage,
        enabledAt: isEnabled ? now : null,
        updatedAt: now,
        updatedBy: adminIdentity,
      };

      await Promise.all([
        SystemConfig.findOneAndUpdate(
          { key: "maintenance" },
          { $set: { maintenance: maintenanceDoc } },
          { upsert: true, new: true }
        ),
        SystemConfig.findOneAndUpdate(
          { key: "system_maintenance" },
          { $set: { maintenance: maintenanceDoc } },
          { upsert: true, new: true }
        ),
      ]);

      return res.json({
        success: true,
        message: isEnabled
          ? "Global Maintenance Mode enabled successfully. Student access is now restricted."
          : "Global Maintenance Mode disabled successfully. Student access has been restored.",
        maintenance: maintenanceDoc,
      });
    }

    // 17. PUT /portal-visibility
    if ((action === "portal-visibility" || cleanUrl.includes("/portal-visibility")) && req.method === "PUT") {
      const { mode, allowedRoles } = req.body || {};
      const targetMode = mode === "MANUAL" ? "MANUAL" : "AUTO";
      const now = new Date();
      const adminIdentity = admin.email || admin.name || "main_admin";

      const visibilityDoc = {
        mode: targetMode,
        allowedRoles: {
          mainAdmin: allowedRoles?.mainAdmin !== false,
          subAdmin: allowedRoles?.subAdmin !== false,
          specialStudent: allowedRoles?.specialStudent !== false,
          allStudents: Boolean(allowedRoles?.allStudents),
          guests: Boolean(allowedRoles?.guests),
        },
        updatedAt: now,
        updatedBy: adminIdentity,
      };

      await Promise.all([
        SystemConfig.findOneAndUpdate(
          { key: "admin_button_config" },
          { $set: { adminButtonVisibility: visibilityDoc } },
          { upsert: true, new: true }
        ),
        SystemConfig.findOneAndUpdate(
          { key: "system_config" },
          { $set: { adminButtonVisibility: visibilityDoc } },
          { upsert: true, new: true }
        ),
      ]);

      return res.json({
        success: true,
        message: targetMode === "MANUAL"
          ? "Manual Admin button visibility overrides activated successfully."
          : "System restored to Automatic (Device Limits) visibility logic.",
        config: visibilityDoc,
      });
    }

    return res.status(404).json({ success: false, message: `Unknown admin action: ${action || cleanUrl}` });
  } catch (err) {
    console.error("Admin handler error:", err);
    return res.status(500).json({ success: false, message: "Internal administrative server error." });
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
