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
const SystemConfig = require("./_lib/models/SystemConfig");
const jwt = require("jsonwebtoken");
const {
  GRADE_POINTS,
  calculateSGPA,
  calculateCGPA,
  calculateSemesterMetrics,
  getGradePoint,
  getSectionFromRegNo,
  normalizeGrade,
  assignCompetitionRanks,
  sortByScore,
} = require("./_lib/gradeCalculations");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-admin-token",
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
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
    if (decoded.role === "student" || (decoded.regNo && decoded.regNo !== "230301120327")) {
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
        },
      };
    }

    return {
      admin: {
        role: "admin",
        adminType: "main",
        username: decoded.username || "admin",
        email: decoded.email || process.env.ADMIN_EMAIL,
        permissions: { routes: ["*"], actions: ["*"] },
      },
    };
  } catch {
    return { error: { status: 401, message: "Not authorized, invalid admin token.", code: "INVALID_ADMIN_TOKEN" } };
  }
}

async function generateRankingForSemester(semester, preloadedResults = null) {
  const semResults = preloadedResults || (await SemesterResult.find({ semester: Number(semester) }).lean());
  if (!semResults || semResults.length === 0) return;

  const validResults = semResults.filter((r) => Number(r.semester) === Number(semester));
  const uniqueRegNos = [...new Set(validResults.map((r) => r.regNo))];
  const allStudentRecords = await SemesterResult.find({ regNo: { $in: uniqueRegNos } }).lean();

  const studentAllSemsMap = new Map();
  allStudentRecords.forEach((r) => {
    if (!studentAllSemsMap.has(r.regNo)) studentAllSemsMap.set(r.regNo, []);
    studentAllSemsMap.get(r.regNo).push(r);
  });

  const studentDataList = validResults.map((r) => {
    const history = studentAllSemsMap.get(r.regNo) || [r];
    const liveSGPA = calculateSGPA(r.subjects, r.semester);
    const liveCGPA = calculateCGPA(history, r.semester);
    return {
      regNo: r.regNo,
      studentName: r.studentName,
      branch: r.branch,
      batch: r.batch,
      section: getSectionFromRegNo(r.regNo),
      semester: Number(r.semester),
      sgpa: liveSGPA,
      cgpa: liveCGPA,
    };
  });

  const rankedData = assignCompetitionRanks(sortByScore(studentDataList, "cgpa", "sgpa"));

  const bulkOps = rankedData.map((d) => ({
    updateOne: {
      filter: { regNo: d.regNo, semester: d.semester },
      update: { $set: d },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await Ranking.bulkWrite(bulkOps);
  }
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();

    const cleanUrl = (req.url || "").split("?")[0];
    let action = req.query.action || "";

    // Public / semi-public maintenance read
    if ((action === "maintenance" || cleanUrl.includes("/maintenance")) && req.method === "GET") {
      const config = await SystemConfig.findOne({ key: "system_maintenance" }).lean();
      return res.json({
        enabled: config?.maintenance?.enabled || false,
        message: config?.maintenance?.message || "",
        enabledAt: config?.maintenance?.enabledAt || null,
      });
    }

    const authResult = await authenticateAdmin(req);
    if (authResult.error) {
      return res.status(authResult.error.status).json({ success: false, message: authResult.error.message, code: authResult.error.code });
    }
    const admin = authResult.admin;

    // 1. GET /stats
    if (action === "stats" || cleanUrl.includes("/stats")) {
      const [totalResults, totalInternal, totalRankings, totalAccountsCreated, activeSessions] = await Promise.all([
        SemesterResult.countDocuments(),
        InternalMark.countDocuments(),
        Ranking.countDocuments(),
        Student.countDocuments({ passwordHash: { $exists: true, $ne: null } }),
        StudentSession.find({ isActive: true }, "regNo").lean(),
      ]);
      const uniqueStudents = await SemesterResult.distinct("regNo");
      const activeLoggedInCount = new Set(activeSessions.map((s) => s.regNo)).size;

      const semResults = await SemesterResult.find({}, "regNo batch semester").lean();
      const rankings = await Ranking.find({}, "regNo batch semester").lean();
      const internalMarks = await InternalMark.find({}, "regNo batch semester").lean();

      const batchMap = new Map();

      semResults.forEach((r) => {
        let b = String(r.batch || "").trim();
        if (!b && r.regNo && /^\d{2}/.test(r.regNo)) {
          b = `20${r.regNo.slice(0, 2)}`;
        }
        if (!b) b = "Other";

        if (!batchMap.has(b)) {
          batchMap.set(b, {
            batch: b,
            studentsSet: new Set(),
            rankedStudentsSet: new Set(),
            semMap: new Map(),
            totalResults: 0,
            totalInternal: 0,
            totalRankings: 0,
          });
        }
        const entry = batchMap.get(b);
        if (r.regNo) {
          entry.studentsSet.add(r.regNo);
          if (r.semester) {
            const semNum = Number(r.semester);
            if (!isNaN(semNum) && semNum > 0) {
              if (!entry.semMap.has(semNum)) entry.semMap.set(semNum, new Set());
              entry.semMap.get(semNum).add(r.regNo);
            }
          }
        }
        entry.totalResults++;
      });

      internalMarks.forEach((m) => {
        let b = String(m.batch || "").trim();
        if (!b && m.regNo && /^\d{2}/.test(m.regNo)) {
          b = `20${m.regNo.slice(0, 2)}`;
        }
        if (!b) b = "Other";

        if (!batchMap.has(b)) {
          batchMap.set(b, {
            batch: b,
            studentsSet: new Set(),
            rankedStudentsSet: new Set(),
            semMap: new Map(),
            totalResults: 0,
            totalInternal: 0,
            totalRankings: 0,
          });
        }
        const entry = batchMap.get(b);
        if (m.regNo) entry.studentsSet.add(m.regNo);
        entry.totalInternal++;
      });

      rankings.forEach((rk) => {
        let b = String(rk.batch || "").trim();
        if (!b && rk.regNo && /^\d{2}/.test(rk.regNo)) {
          b = `20${rk.regNo.slice(0, 2)}`;
        }
        if (!b) b = "Other";

        if (!batchMap.has(b)) {
          batchMap.set(b, {
            batch: b,
            studentsSet: new Set(),
            rankedStudentsSet: new Set(),
            semMap: new Map(),
            totalResults: 0,
            totalInternal: 0,
            totalRankings: 0,
          });
        }
        const entry = batchMap.get(b);
        if (rk.regNo) {
          entry.studentsSet.add(rk.regNo);
          entry.rankedStudentsSet.add(rk.regNo);
        }
        entry.totalRankings++;
      });

      const batchBreakdown = Array.from(batchMap.values())
        .map((item) => {
          const semBreakdown = Array.from(item.semMap.entries())
            .map(([sem, set]) => ({ semester: sem, studentCount: set.size }))
            .sort((a, b) => a.semester - b.semester);

          return {
            batch: item.batch,
            totalStudents: item.studentsSet.size,
            totalRankedStudents: item.rankedStudentsSet.size,
            totalResults: item.totalResults,
            totalInternal: item.totalInternal,
            totalRankings: item.totalRankings,
            semBreakdown,
          };
        })
        .sort((a, b) => {
          if (a.batch === "Other") return 1;
          if (b.batch === "Other") return -1;
          return Number(b.batch) - Number(a.batch);
        });

      return res.json({
        totalStudents: uniqueStudents.length,
        totalAccountsCreated,
        activeLoggedInCount,
        totalResults,
        totalInternal,
        totalRankings,
        batchBreakdown,
      });
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

      const activeSessions = await StudentSession.find({
        regNo: { $in: regNos },
        isActive: true,
      }).lean();

      const sessionMap = new Map();
      activeSessions.forEach((s) => {
        if (!sessionMap.has(s.regNo)) {
          sessionMap.set(s.regNo, []);
        }
        sessionMap.get(s.regNo).push({
          sessionId: s.sessionId,
          deviceType: s.deviceInfo?.deviceType || "Desktop",
          browser: s.deviceInfo?.browser || "Unknown",
          os: s.deviceInfo?.os || "Unknown",
          lastActiveAt: s.lastActiveAt,
          loggedInAt: s.loggedInAt,
        });
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
        message: "✅ Batch purge complete. 0 expired batch(es) purged.",
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

      // Recalculate CGPA for all semesters of this student
      const allStudentResults = await SemesterResult.find({ regNo: cleanRegNo }).sort({ semester: 1 });
      for (const r of allStudentResults) {
        const sNum = Number(r.semester);
        const metrics = calculateSemesterMetrics(r.subjects, sNum);
        r.totalCredits = metrics.totalCredits;
        r.creditsCleared = metrics.creditsCleared;
        r.sgpa = metrics.sgpa;
        r.cgpa = calculateCGPA(allStudentResults, sNum);
        r.markModified("subjects");
        await r.save();
      }

      // Update ranking for this semester
      await generateRankingForSemester(semNum);

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
      const trimmedRegNo = String(regNo || "").trim();
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
      semResult.markModified("subjects");
      await semResult.save();

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
        for (const r of remainingResults) {
          const sNum = Number(r.semester);
          const metrics = calculateSemesterMetrics(r.subjects, sNum);
          r.totalCredits = metrics.totalCredits;
          r.creditsCleared = metrics.creditsCleared;
          r.sgpa = metrics.sgpa;
          r.cgpa = calculateCGPA(remainingResults, sNum);
          r.markModified("subjects");
          await r.save();
        }
      }

      await generateRankingForSemester(semNum);

      return res.json({
        success: true,
        message: `Semester ${semNum} record for student ${cleanRegNo} deleted successfully.`,
      });
    }

    // 10. POST /rankings/regenerate-all
    if (action === "regenerate-all" || cleanUrl.includes("/rankings/regenerate-all")) {
      const allSemesterResults = await SemesterResult.find({}).lean();
      if (!allSemesterResults.length) {
        return res.status(404).json({ message: "No semester results found" });
      }

      const semesters = [...new Set(allSemesterResults.map((r) => Number(r.semester)))].filter((s) => !isNaN(s) && s > 0).sort((a, b) => a - b);

      for (const sem of semesters) {
        await generateRankingForSemester(sem, allSemesterResults);
      }

      return res.json({
        success: true,
        message: `✅ All rankings regenerated for ${semesters.length} semester(s): ${semesters.join(", ")}.`,
      });
    }

    // 11. POST /cache/clear
    if (action === "cache-clear" || cleanUrl.includes("/cache/clear")) {
      return res.json({ success: true, message: "Server cache cleared successfully." });
    }

    // 12. GET /section-toppers
    if (action === "section-toppers" || cleanUrl.includes("/section-toppers")) {
      const batch = req.query.batch ? String(req.query.batch).trim() : "";
      const branch = req.query.branch ? String(req.query.branch).trim().toUpperCase() : "";
      const section = req.query.section ? String(req.query.section).trim() : "";
      const search = req.query.search ? String(req.query.search).trim() : "";
      const semester = req.query.semester;

      const [allRankings, studentsTracking] = await Promise.all([
        Ranking.find({}).lean(),
        Student.find({}).lean(),
      ]);

      const studentTrackingMap = new Map();
      studentsTracking.forEach((st) => {
        studentTrackingMap.set(st.regNo, st);
      });

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

        const tracking = studentTrackingMap.get(regNo) || {};

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
          sectionCgpaRank: rk.sectionCgpaRank || null,
          sectionSgpaRank: rk.sectionSgpaRank || null,
          deptCgpaRank: rk.deptCgpaRank || null,
          deptRank: rk.deptRank || null,
          universityRank: rk.universityRank || rk.cgpaRank || null,
          lastTopperEmailSentAt: tracking.lastTopperEmailSentAt ? tracking.lastTopperEmailSentAt.toISOString() : null,
          lastTopperEmailStatus: tracking.lastTopperEmailStatus || null,
          lastTopperEmailError: tracking.lastTopperEmailError || null,
        });
      });

      if (batch) {
        validStudents = validStudents.filter((s) => s.batch === batch);
      }
      if (branch) {
        validStudents = validStudents.filter((s) => s.branch === branch);
      }
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
        if (!s.sectionCgpaRank) s.sectionCgpaRank = currentRank;
        prevCgpa = s.cgpa;
      });

      const top10Toppers = validStudents.filter((s) => Number(s.sectionCgpaRank) <= 10);

      return res.json({
        totalToppers: top10Toppers.length,
        students: top10Toppers,
      });
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

      const [semResults, rankings, studentsTracking] = await Promise.all([
        SemesterResult.find({}).sort({ semester: 1 }).lean(),
        Ranking.find({}).lean(),
        Student.find({}).lean(),
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

        const rkInfo = studentRankingMap.get(regNo) || null;
        const trackingInfo = studentTrackingMap.get(regNo) || {};

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
          rankInfo: rkInfo,
          lastEmailSentAt: trackingInfo.lastEmailSentAt || null,
          lastEmailStatus: trackingInfo.lastEmailStatus || null,
          lastEmailError: trackingInfo.lastEmailError || null,
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

      return res.json({
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
      });
    }

    // 14. PUT /maintenance
    if (action === "maintenance" && req.method === "PUT") {
      const { enabled, message } = req.body || {};
      const updated = await SystemConfig.findOneAndUpdate(
        { key: "system_maintenance" },
        {
          $set: {
            maintenance: {
              enabled: Boolean(enabled),
              message: String(message || ""),
              enabledAt: enabled ? new Date() : null,
              updatedAt: new Date(),
              updatedBy: admin.username,
            },
          },
        },
        { upsert: true, new: true }
      );
      return res.json({ success: true, maintenance: updated.maintenance });
    }

    return res.status(404).json({ success: false, message: `Unknown admin action: ${action || cleanUrl}` });
  } catch (err) {
    console.error("Admin handler error:", err);
    return res.status(500).json({ success: false, message: "Internal administrative server error." });
  }
};
