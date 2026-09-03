const connectToDatabase = require("./_lib/db");
const SemesterResult = require("./_lib/models/SemesterResult");
const InternalMark = require("./_lib/models/InternalMark");
const Ranking = require("./_lib/models/Ranking");
const Student = require("./_lib/models/Student");
const Attendance = require("./_lib/models/Attendance");
const StudentSession = require("./_lib/models/StudentSession");
const AdminSession = require("./_lib/models/AdminSession");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const Feedback = require("./_lib/models/Feedback");
const { isSessionValid, touchSession, isAdminSessionValid } = require("./_lib/sessionManager");
const { globalDbQueue } = require("./_lib/dbProtection");
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

const { applyCors } = require("./_lib/cors");
const jwt = require("jsonwebtoken");

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
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  if (req.query.action === "health" || req.url?.includes("/api/health")) {
    return res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
  }

  try {
    await connectToDatabase();

    // ─── Unified Feedback Handler ──────────────────────────────────────────
    const urlObj = new URL(req.url, "http://localhost");
    const isFeedback = req.query.action?.startsWith("feedback") || urlObj.pathname.includes("/api/feedback");
    if (isFeedback) {
      const feedbackId = req.query.id;

      if (req.method === "GET" && !feedbackId) {
        const feedbacks = await Feedback.find()
          .select("name rating comment category likes createdAt")
          .sort({ createdAt: -1 });
        return res.json(feedbacks);
      }

      if (req.method === "POST" && !feedbackId && req.query.action !== "feedback-like") {
        const { name, regNo, rating, comment, category } = req.body || {};
        if (!name || typeof name !== "string" || name.trim().length < 1 || name.trim().length > 100) {
          return res.status(400).json({ message: "Name is required and must be between 1 and 100 characters." });
        }
        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
          return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
        }
        if (!regNo || typeof regNo !== "string" || !/^[a-zA-Z0-9]{5,20}$/.test(regNo.trim())) {
          return res.status(400).json({ message: "A valid student Registration Number is required to submit a review." });
        }
        const newFeedback = new Feedback({
          name: name.trim(),
          regNo: String(regNo).trim(),
          rating: numRating,
          comment: comment.trim(),
          category: typeof category === "string" && category.trim() ? category.trim() : "Overall Experience",
        });
        const savedFeedback = await newFeedback.save();
        return res.status(201).json(savedFeedback);
      }

      if (req.method === "POST" && feedbackId && (req.query.action === "feedback-like" || req.query.action === "like")) {
        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });
        feedback.likes = (feedback.likes || 0) + 1;
        await feedback.save();
        return res.json(feedback);
      }

      if (req.method === "PUT" && feedbackId) {
        const cookies = parseCookies(req.headers.cookie);
        let token = req.headers["x-admin-token"] || cookies.jwt;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
          token = req.headers.authorization.split(" ")[1];
        }
        try {
          jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          return res.status(401).json({ message: "Not authorized" });
        }
        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });
        const { name, regNo, rating, comment } = req.body || {};
        if (name) feedback.name = name;
        if (regNo) feedback.regNo = regNo;
        if (rating) feedback.rating = rating;
        if (comment) feedback.comment = comment;
        const updatedFeedback = await feedback.save();
        return res.json(updatedFeedback);
      }

      if (req.method === "DELETE" && feedbackId) {
        const cookies = parseCookies(req.headers.cookie);
        let token = req.headers["x-admin-token"] || cookies.jwt;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
          token = req.headers.authorization.split(" ")[1];
        }
        try {
          jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          return res.status(401).json({ message: "Not authorized" });
        }
        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) return res.status(404).json({ message: "Feedback not found" });
        await feedback.deleteOne();
        return res.json({ message: "Feedback deleted successfully" });
      }

      return res.status(404).json({ message: "Feedback route not found" });
    }

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
        if (decodedAdmin && (decodedAdmin.role === "admin" || decodedAdmin.id || decodedAdmin.email) && decodedAdmin.role !== "student" && !decodedAdmin.regNo) {
          if (decodedAdmin.adminType === "subadmin") {
            if (decodedAdmin.sessionId) {
              const saSess = await SubAdminSession.findOne({ sessionId: decodedAdmin.sessionId, isActive: true });
              if (saSess) isAdmin = true;
            }
          } else {
            if (decodedAdmin.sessionId) {
              const aSess = await AdminSession.findOne({ sessionId: decodedAdmin.sessionId, isActive: true });
              if (aSess && isAdminSessionValid(aSess)) isAdmin = true;
            }
          }
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
          message: "Your session has ended because this device was logged out.",
          code: "SESSION_TERMINATED",
        });
      }

      // Touch activity timestamp (sessions are permanent until manual logout)
      await touchSession(activeSession);

      // Strict Data Isolation: A student can ONLY access their own records
      if (decodedStudent.regNo.toUpperCase() !== cleanRegNo) {
        return res.status(403).json({
          message: "Access Denied: You are not allowed to access another student's records.",
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

        const cleanSavedSubjects = Array.isArray(savedSubjects)
          ? savedSubjects.map((s) => ({
              subjectName: String(s.subjectName || s.name || "").trim(),
              code: String(s.code || s.subCode || "").trim(),
              section: String(s.section || section || "").trim(),
              weeklyOccurrences: Array.isArray(s.weeklyOccurrences) ? s.weeklyOccurrences : [],
              components: Array.isArray(s.components)
                ? s.components.map((c) => ({
                    type: String(c.type || "PP").trim().toUpperCase(),
                    attended: Math.max(0, parseInt(c.attended, 10) || 0),
                    delivered: Math.max(0, parseInt(c.delivered, 10) || 0),
                  }))
                : [],
              lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : new Date(),
            }))
          : [];

        const cleanDailyLogs = {};
        if (dailyLogs && typeof dailyLogs === "object") {
          Object.keys(dailyLogs).forEach((dKey) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dKey) && typeof dailyLogs[dKey] === "object" && dailyLogs[dKey] !== null) {
              const slotMap = {};
              Object.keys(dailyLogs[dKey]).forEach((slotKey) => {
                const val = dailyLogs[dKey][slotKey];
                if (val === "present" || val === "absent") {
                  slotMap[slotKey] = val;
                }
              });
              if (Object.keys(slotMap).length > 0) {
                cleanDailyLogs[dKey] = slotMap;
              }
            }
          });
        }

        const updatedAttendance = await Attendance.findOneAndUpdate(
          { regNo: cleanRegNo },
          {
            $set: {
              regNo: cleanRegNo,
              section: section || "CSE-A",
              targetGoal: Math.max(1, Math.min(100, Number(targetGoal) || 75)),
              savedSubjects: cleanSavedSubjects,
              dailyLogs: cleanDailyLogs,
              lastSyncedAt: new Date(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.json({
          success: true,
          message: "Attendance data saved successfully to database.",
          attendance: {
            regNo: updatedAttendance.regNo,
            section: updatedAttendance.section,
            targetGoal: updatedAttendance.targetGoal,
            savedSubjects: updatedAttendance.savedSubjects,
            dailyLogs: updatedAttendance.dailyLogs
              ? (updatedAttendance.dailyLogs instanceof Map
                  ? Object.fromEntries(updatedAttendance.dailyLogs)
                  : updatedAttendance.dailyLogs)
              : {},
            lastSyncedAt: updatedAttendance.lastSyncedAt,
          },
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

    // Enforce strictly private cache-control headers on student academic records
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");

    // Full student profile
    const results = await globalDbQueue.run(() =>
      SemesterResult.find({ regNo: cleanRegNo }).sort({ semester: 1 })
    );
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
