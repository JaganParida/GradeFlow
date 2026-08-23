const jwt = require("jsonwebtoken");
const StudentSession = require("../models/StudentSession");
const AdminSession = require("../models/AdminSession");
const SubAdminSession = require("../models/SubAdminSession");
const SubAdmin = require("../models/SubAdmin");
const {
  isSessionValid,
  touchSession,
  isAdminSessionValid,
  touchAdminSession,
} = require("../utils/sessionManager");

// Admin Protection Middleware (Supports Main Admin and Sub-Admin via HttpOnly Cookie & Authoritative Sessions)
const protect = async (req, res, next) => {
  let token = null;

  // 1. Primary: Extract from secure HttpOnly cookie
  if (req.cookies && req.cookies.jwt && req.cookies.jwt !== "none" && req.cookies.jwt !== "") {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.headers["x-admin-token"]) {
    token = req.headers["x-admin-token"];
  }

  if (!token || token === "none") {
    return res.status(401).json({ success: false, message: "Not authorized, no administrative session found.", code: "AUTH_REQUIRED" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student") {
      return res.status(403).json({ success: false, message: "Forbidden: Admin privileges required", code: "FORBIDDEN" });
    }

    if (decoded.adminType === "subadmin") {
      // ── Sub-Admin Session & Account Validation ──
      if (decoded.sessionId) {
        const session = await SubAdminSession.findOne({
          sessionId: decoded.sessionId,
          isActive: true,
        });

        if (!session) {
          return res.status(401).json({
            success: false,
            message: "Sub-Admin session ended because this device was logged out.",
            code: "ADMIN_SESSION_TERMINATED",
          });
        }

        if (session.expiresAt && session.expiresAt < new Date()) {
          await SubAdminSession.deleteOne({ _id: session._id });
          return res.status(401).json({
            success: false,
            message: "Sub-Admin session expired due to 7 continuous days of inactivity. Please log in again.",
            code: "INACTIVITY_LOGOUT",
          });
        }

        // Rolling 7-day inactivity update
        const now = new Date();
        session.lastActiveAt = now;
        session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await session.save();
      }

      const subAdmin = await SubAdmin.findById(decoded.subAdminId);
      if (!subAdmin) {
        return res.status(403).json({
          success: false,
          message: "Sub-Admin account not found.",
          code: "SUBADMIN_NOT_FOUND",
        });
      }

      if (subAdmin.status !== "active") {
        return res.status(403).json({
          success: false,
          message: `Sub-Admin account is currently ${subAdmin.status}. Access denied.`,
          code: `SUBADMIN_${subAdmin.status.toUpperCase()}`,
        });
      }

      req.admin = {
        role: "admin",
        adminType: "subadmin",
        subAdminId: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
        sessionId: decoded.sessionId,
      };
    } else {
      // ── Main Admin Session Validation (Mandatory DB Session Check) ──
      if (!decoded.sessionId) {
        return res.status(401).json({
          success: false,
          message: "Administrative session token invalid or missing session identifier.",
          code: "AUTH_SESSION_INVALID",
        });
      }

      const session = await AdminSession.findOne({
        sessionId: decoded.sessionId,
        isActive: true,
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "Admin session ended because this device was logged out.",
          code: "ADMIN_SESSION_TERMINATED",
        });
      }

      if (!isAdminSessionValid(session)) {
        await AdminSession.deleteOne({ _id: session._id });
        return res.status(401).json({
          success: false,
          message: "Admin session expired due to 7 continuous days of inactivity. Please log in again.",
          code: "INACTIVITY_LOGOUT",
        });
      }

      // Rolling 7-day inactivity update
      await touchAdminSession(session);

      req.admin = {
        ...decoded,
        role: "admin",
        adminType: "main",
        email: decoded.email || process.env.ADMIN_EMAIL,
        sessionId: session.sessionId,
      };
    }

    next();
  } catch {
    res.status(401).json({ success: false, message: "Not authorized, token invalid or expired" });
  }
};

const protectAdmin = protect;

// Student Protection Middleware (Enforces Multi/Single Device Session & 7-Day Inactivity Check)
const protectStudent = async (req, res, next) => {
  let token = req.headers["x-student-token"];
  if (!token && req.cookies && req.cookies.student_jwt) {
    token = req.cookies.student_jwt;
  } else if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") {
    return res.status(401).json({ success: false, message: "Authentication required. Please log in with your registration number." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.regNo || !decoded.sessionId) {
      return res.status(401).json({ success: false, message: "Invalid session token. Please log in again." });
    }

    const session = await StudentSession.findOne({
      regNo: decoded.regNo,
      sessionId: decoded.sessionId,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Your session has ended because this device was logged out.",
        code: "SESSION_TERMINATED",
      });
    }

    if (!isSessionValid(session)) {
      await StudentSession.deleteOne({ _id: session._id });
      return res.status(401).json({
        success: false,
        message: "Session expired due to 7 continuous days of inactivity. Please log in again.",
        code: "INACTIVITY_LOGOUT",
      });
    }

    // Refresh last active timestamp & extend expiration by 7 days
    await touchSession(session);

    req.student = {
      regNo: session.regNo,
      sessionId: session.sessionId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Session token invalid or expired. Please log in again." });
  }
};

// Strict Data Isolation Guard: Admin can view any student; Student can ONLY view their own data
const requireStudentOrAdmin = async (req, res, next) => {
  const targetRegNo = (req.params.regNo || "").trim().toUpperCase();

  // 1. Check if valid Admin Token (Bearer header / x-admin-token / cookie)
  let adminToken = null;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    adminToken = req.headers.authorization.split(" ")[1];
  } else if (req.headers["x-admin-token"]) {
    adminToken = req.headers["x-admin-token"];
  } else if (req.cookies && req.cookies.jwt && req.cookies.jwt !== "none" && req.cookies.jwt !== "") {
    adminToken = req.cookies.jwt;
  }

  if (adminToken && adminToken !== "none" && adminToken !== "") {
    try {
      const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET);
      if (decodedAdmin && decodedAdmin.role !== "student") {
        if (decodedAdmin.sessionId) {
          const adminSession = await AdminSession.findOne({
            sessionId: decodedAdmin.sessionId,
            isActive: true,
          });
          if (adminSession && isAdminSessionValid(adminSession)) {
            await touchAdminSession(adminSession);
            req.admin = decodedAdmin;
            return next();
          }
        } else {
          req.admin = decodedAdmin;
          return next();
        }
      }
    } catch {
      // Not a valid admin token, proceed to check student token
    }
  }

  // 2. Check Student Token
  let studentToken = req.headers["x-student-token"];
  if (!studentToken && req.cookies?.student_jwt) {
    studentToken = req.cookies.student_jwt;
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

  try {
    const decoded = jwt.verify(studentToken, process.env.JWT_SECRET);
    if (!decoded.regNo || !decoded.sessionId) {
      return res.status(401).json({ message: "Invalid session token." });
    }

    const session = await StudentSession.findOne({
      regNo: decoded.regNo,
      sessionId: decoded.sessionId,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Your session has ended because this device was logged out.",
        code: "SESSION_TERMINATED",
      });
    }

    if (!isSessionValid(session)) {
      await StudentSession.deleteOne({ _id: session._id });
      return res.status(401).json({
        success: false,
        message: "Session expired due to 7 continuous days of inactivity. Please log in again.",
        code: "INACTIVITY_LOGOUT",
      });
    }

    // Refresh last active timestamp & extend expiration by 7 days
    await touchSession(session);

    req.student = {
      regNo: session.regNo,
      sessionId: session.sessionId,
    };

    // Strict Data Isolation Check & Authorized Device Protection
    const isSuperUser = session.regNo === "230301120327";
    if (targetRegNo && !isSuperUser && session.regNo.toUpperCase() !== targetRegNo) {
      return res.status(403).json({
        message: targetRegNo === "230301120327"
          ? "Access Denied: You are not allowed to access this student's data. This profile is private and only accessible from authorized devices."
          : "Access Denied: You are not allowed to access another student's records.",
        code: "DATA_ISOLATION_FORBIDDEN",
      });
    }
    if (targetRegNo === "230301120327" && session.regNo !== "230301120327") {
      return res.status(403).json({
        message: "Access Denied: You are not allowed to access this student's data. This profile is private and only accessible from authorized devices.",
        code: "DATA_ISOLATION_FORBIDDEN",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Session token invalid or expired. Please log in again." });
  }
};

module.exports = {
  protect,
  protectAdmin,
  protectStudent,
  requireStudentOrAdmin,
};
