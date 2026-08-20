const connectToDatabase = require("./_lib/db");
const SemesterResult = require("./_lib/models/SemesterResult");
const InternalMark = require("./_lib/models/InternalMark");
const Ranking = require("./_lib/models/Ranking");
const Student = require("./_lib/models/Student");
const Attendance = require("./_lib/models/Attendance");
const {
  calculateBacklogs,
  calculateCGPA,
  calculateSemesterMetrics,
  getSectionFromRegNo,
} = require("./_lib/gradeCalculations");

function calcAcademicHealth(cgpa, sgpa, backlogs, results) {
  let score = 0;
  score += Math.min(cgpa * 5, 50);
  score += Math.min(sgpa * 2, 20);
  score += backlogs === 0 ? 20 : Math.max(0, 20 - backlogs * 5);
  const totalSubjects = results.reduce((a, r) => a + (r.subjects || []).length, 0);
  score += Math.min(10, totalSubjects > 0 ? 10 : 0);
  return Math.round(Math.min(score, 100));
}

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-admin-token",
};

const jwt = require("jsonwebtoken");
const StudentSession = require("./_lib/models/StudentSession");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    let [name, ...rest] = cookie.trim().split("=");
    name = name?.trim();
    if (!name) return;
    cookies[name] = rest.join("=");
  });
  return cookies;
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();

    const queryRegNo = req.query.regNo || req.query.registrationNumber || req.query.id;
    const cleanRegNo = String(queryRegNo || "").trim().toUpperCase();

    if (!cleanRegNo || !/^[a-zA-Z0-9]{5,20}$/.test(cleanRegNo)) {
      return res.status(400).json({ message: "Invalid registration number format. Must be 5-20 alphanumeric characters." });
    }

    // ── Strict JWT Authentication & Data Isolation Guard ──
    const cookies = parseCookies(req.headers.cookie);

    // Check Bearer header FIRST (highest precedence), then x-admin-token, then cookie
    let adminToken = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      adminToken = req.headers.authorization.split(" ")[1];
    } else if (req.headers["x-admin-token"]) {
      adminToken = req.headers["x-admin-token"];
    } else if (cookies.jwt && cookies.jwt !== "none") {
      adminToken = cookies.jwt;
    }

    let isAdmin = false;
    if (adminToken && adminToken !== "none") {
      try {
        const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET);
        if (decodedAdmin && (decodedAdmin.role === "admin" || decodedAdmin.id || decodedAdmin.email) && decodedAdmin.role !== "student") {
          isAdmin = true;
        }
      } catch {}
    }

    if (!isAdmin) {
      let studentToken = req.headers["x-student-token"];
      if (!studentToken && cookies.student_jwt && cookies.student_jwt !== "none") {
        studentToken = cookies.student_jwt;
      }
      if (!studentToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        studentToken = req.headers.authorization.split(" ")[1];
      }

      if (!studentToken || studentToken === "none") {
        return res.status(401).json({
          message: "Authentication required. Please log in to view student records.",
          code: "AUTH_REQUIRED",
        });
      }

      let decodedStudent;
      try {
        decodedStudent = jwt.verify(studentToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Session token invalid or expired. Please log in again." });
      }

      if (!decodedStudent.regNo || !decodedStudent.sessionId) {
        return res.status(401).json({ message: "Invalid session token." });
      }

      const activeSession = await StudentSession.findOne({
        regNo: decodedStudent.regNo,
        sessionId: decodedStudent.sessionId,
        isActive: true,
      });

      if (!activeSession) {
        return res.status(401).json({
          message: "Your session has ended because this account was logged in on another device or logged out.",
          code: "SESSION_TERMINATED",
        });
      }

      // Check strict data isolation & device authorization
      const isSuperUser = decodedStudent.regNo === "230301120327";
      if (!isSuperUser && decodedStudent.regNo.toUpperCase() !== cleanRegNo) {
        return res.status(403).json({
          message: cleanRegNo === "230301120327"
            ? "Access Denied: You are not allowed to access this student's data. This profile is private and only accessible from authorized devices."
            : "Access Denied: You are not allowed to access another student's records.",
          code: "DATA_ISOLATION_FORBIDDEN",
        });
      }
      if (cleanRegNo === "230301120327" && decodedStudent.regNo !== "230301120327") {
        return res.status(403).json({
          message: "Access Denied: You are not allowed to access this student's data. This profile is private and only accessible from authorized devices.",
          code: "DATA_ISOLATION_FORBIDDEN",
        });
      }
    }

    const sem = req.query.sem;
    const action = req.query.action;

    // ── Attendance Tracker Persistence (GET & POST) ──
    if (action === "attendance") {
      if (req.method === "GET") {
        const attendance = await Attendance.findOne({ regNo: cleanRegNo });
        if (!attendance) {
          return res.json({
            success: true,
            attendance: null,
            message: "No custom attendance record saved yet.",
          });
        }
        return res.json({
          success: true,
          attendance: {
            regNo: attendance.regNo,
            section: attendance.section,
            targetGoal: attendance.targetGoal,
            savedSubjects: attendance.savedSubjects,
            dailyLogs: attendance.dailyLogs ? (attendance.dailyLogs instanceof Map ? Object.fromEntries(attendance.dailyLogs) : attendance.dailyLogs) : {},
            lastSyncedAt: attendance.lastSyncedAt,
          },
        });
      }

      if (req.method === "POST") {
        const { section, targetGoal, savedSubjects, dailyLogs } = req.body || {};
        const updatedAttendance = await Attendance.findOneAndUpdate(
          { regNo: cleanRegNo },
          {
            regNo: cleanRegNo,
            section: section || "CSE-A",
            targetGoal: Number(targetGoal) || 75,
            savedSubjects: Array.isArray(savedSubjects) ? savedSubjects : [],
            dailyLogs: dailyLogs && typeof dailyLogs === "object" ? dailyLogs : {},
            lastSyncedAt: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.json({
          success: true,
          message: "Attendance data saved successfully to database.",
          attendance: updatedAttendance,
        });
      }

      return res.status(405).json({ message: "Method not allowed for attendance" });
    }

    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Sub-resource: specific semester result
    if (action === "semester" && sem) {
      const result = await SemesterResult.findOne({ regNo: cleanRegNo, semester: Number(sem) });
      if (!result) return res.status(404).json({ message: "Result not found" });
      return res.json(result);
    }

    // Sub-resource: specific semester ranking
    if (action === "ranking" && sem) {
      const ranking = await Ranking.findOne({ regNo: cleanRegNo, semester: Number(sem) });
      if (!ranking) return res.status(404).json({ message: "Ranking not found" });
      return res.json(ranking);
    }

    // Sub-resource: internal marks
    if (action === "internal" && sem) {
      const marks = await InternalMark.findOne({ regNo: cleanRegNo, semester: Number(sem) });
      if (!marks) return res.status(404).json({ message: "Internal marks not found" });
      return res.json(marks);
    }

    // Full student profile
    const results = await SemesterResult.find({ regNo: cleanRegNo }).sort({ semester: 1 });
    if (!results || !results.length) {
      return res.status(404).json({ message: "Student not found" });
    }

    const cgpa = calculateCGPA(results);
    const backlogs = calculateBacklogs(results);
    const latestResult = results[results.length - 1];
    const latestMetrics = calculateSemesterMetrics(latestResult.subjects, latestResult.semester);
    const liveLatestSgpa =
      latestResult.subjects && latestResult.subjects.length > 0
        ? latestMetrics.sgpa
        : typeof latestResult.sgpa === "number"
        ? latestResult.sgpa
        : latestMetrics.sgpa;

    const healthScore = calcAcademicHealth(cgpa, liveLatestSgpa, backlogs.length, results);

    const ranking = await Ranking.findOne({
      regNo: cleanRegNo,
      semester: latestResult.semester,
    });

    const studentProfile = await Student.findOne({ regNo: cleanRegNo });

    const responseData = {
      regNo: cleanRegNo,
      studentName: latestResult.studentName,
      branch: studentProfile?.branch || latestResult.branch,
      batch: studentProfile?.batch || latestResult.batch,
      section: studentProfile?.section || getSectionFromRegNo(cleanRegNo),
      cgpa,
      latestSgpa: liveLatestSgpa,
      latestSemester: latestResult.semester,
      totalCredits: results.reduce(
        (sum, r) => sum + calculateSemesterMetrics(r.subjects, r.semester).totalCredits,
        0
      ),
      creditsCleared: results.reduce(
        (sum, r) => sum + calculateSemesterMetrics(r.subjects, r.semester).creditsCleared,
        0
      ),
      academicHealthScore: healthScore,
      backlogs,
      results,
      ranking: ranking || null,
    };

    return res.json(responseData);
  } catch (err) {
    console.error("Vercel Serverless Student Error:", err);
    return res.status(500).json({ message: err.message || "Server error fetching student profile", error: err.toString() });
  }
};
