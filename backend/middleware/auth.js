const jwt = require("jsonwebtoken");
const StudentSession = require("../models/StudentSession");

// Admin Protection Middleware
const protect = (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") {
    return res.status(401).json({ message: "Not authorized, no admin token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "student") {
      return res.status(403).json({ message: "Forbidden: Admin privileges required" });
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

const protectAdmin = protect;

// Student Protection Middleware (Enforces Single Device & 7-Day Inactivity Check)
const protectStudent = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.student_jwt) {
    token = req.cookies.student_jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "none") {
    return res.status(401).json({ message: "Authentication required. Please log in with your registration number." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.regNo || !decoded.sessionId) {
      return res.status(401).json({ message: "Invalid session token. Please log in again." });
    }

    // Check Single Device Active Session in MongoDB
    const session = await StudentSession.findOne({
      regNo: decoded.regNo,
      sessionId: decoded.sessionId,
      isActive: true,
    });

    if (!session) {
      return res.status(401).json({
        message: "Your session has ended because this account was logged in on another device or logged out.",
        code: "SESSION_TERMINATED",
      });
    }

    // Check 7 Days Continuous Inactivity (7 * 24 * 60 * 60 * 1000 = 604,800,000 ms)
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const lastActive = new Date(session.lastActiveAt).getTime();

    if (now - lastActive > SEVEN_DAYS_MS) {
      await StudentSession.deleteOne({ _id: session._id });
      return res.status(401).json({
        message: "Session expired due to 7 days of inactivity. Please log in again.",
        code: "INACTIVITY_LOGOUT",
      });
    }

    // Refresh last active timestamp & extend expiration
    session.lastActiveAt = new Date();
    session.expiresAt = new Date(now + SEVEN_DAYS_MS);
    await session.save();

    req.student = {
      regNo: session.regNo,
      sessionId: session.sessionId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session token invalid or expired. Please log in again." });
  }
};

// Strict Data Isolation Guard: Admin can view any student; Student can ONLY view their own data
const requireStudentOrAdmin = async (req, res, next) => {
  const targetRegNo = (req.params.regNo || "").trim().toUpperCase();

  // 1. Check if valid Admin Token
  let adminToken = req.cookies?.jwt;
  if (!adminToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    adminToken = req.headers.authorization.split(" ")[1];
  }

  if (adminToken && adminToken !== "none") {
    try {
      const decodedAdmin = jwt.verify(adminToken, process.env.JWT_SECRET);
      if (decodedAdmin && !decodedAdmin.role) {
        // Valid Admin — full unrestricted access across all students
        req.admin = decodedAdmin;
        return next();
      }
    } catch {
      // Not a valid admin token, proceed to check student token
    }
  }

  // 2. Check Student Token
  let studentToken = req.cookies?.student_jwt;
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
        message: "Your session has ended because this account was logged in on another device or logged out.",
        code: "SESSION_TERMINATED",
      });
    }

    // Check 7 days inactivity
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const lastActive = new Date(session.lastActiveAt).getTime();

    if (now - lastActive > SEVEN_DAYS_MS) {
      await StudentSession.deleteOne({ _id: session._id });
      return res.status(401).json({
        message: "Session expired due to 7 days of inactivity. Please log in again.",
        code: "INACTIVITY_LOGOUT",
      });
    }

    // Refresh last active
    session.lastActiveAt = new Date();
    session.expiresAt = new Date(now + SEVEN_DAYS_MS);
    await session.save();

    req.student = {
      regNo: session.regNo,
      sessionId: session.sessionId,
    };

    // Strict Data Isolation Check
    if (targetRegNo && session.regNo.toUpperCase() !== targetRegNo) {
      return res.status(403).json({
        message: "Access Denied: You are only authorized to view your own student records.",
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

