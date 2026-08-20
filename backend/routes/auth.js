const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const SemesterResult = require("../models/SemesterResult");
const Student = require("../models/Student");
const OtpVerification = require("../models/OtpVerification");
const StudentSession = require("../models/StudentSession");
const StudentDailyLimit = require("../models/StudentDailyLimit");
const { protect, protectStudent } = require("../middleware/auth");
const { validateLoginInput } = require("../middleware/validation");
const { otpLimiter } = require("../middleware/rateLimiters");
const { sendOtpEmail } = require("../utils/emailService");
const router = express.Router();

// Helper to format IST Date string YYYY-MM-DD
function getIstDateKey() {
  const now = new Date();
  // Format in Asia/Kolkata (IST = UTC+5:30)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Helper to calculate minutes/hours until midnight 12:00 AM IST
function getTimeUntilIstMidnight() {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const parts = istFormatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const second = Number(parts.find((p) => p.type === "second")?.value || 0);

  const totalSecondsInDay = 24 * 3600;
  const passedSeconds = hour * 3600 + minute * 60 + second;
  const remainingSeconds = Math.max(0, totalSecondsInDay - passedSeconds);

  const hours = Math.floor(remainingSeconds / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);
  return { hours, mins, totalSeconds: remainingSeconds };
}

/* ═══════════════════════════════════════════════════════════════════
   STUDENT AUTHENTICATION (EMAIL OTP & SINGLE-DEVICE LOCK)
═══════════════════════════════════════════════════════════════════ */

// 0. Student Live Device Status Check (/api/auth/student/check-status)
router.get("/student/check-status", async (req, res) => {
  try {
    const rawReg = String(req.query.regNo || "").trim().toUpperCase();
    if (!rawReg) {
      return res.status(400).json({ message: "Registration number required." });
    }

    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    if (!studentRecord) {
      return res.json({ success: true, exists: false });
    }

    const maxAllowedDevices = rawReg === "230301120327" ? 2 : 1;

    // Clean up stale expired sessions first
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
    await StudentSession.deleteMany({
      regNo: rawReg,
      $or: [
        { lastActiveAt: { $lt: sevenDaysAgo } },
        { expiresAt: { $lt: new Date() } },
        { isActive: false },
      ],
    });

    const activeSessions = await StudentSession.find({
      regNo: rawReg,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    let incomingToken = req.headers["x-student-token"];
    if (!incomingToken && req.cookies?.student_jwt) {
      incomingToken = req.cookies.student_jwt;
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    if (incomingToken) {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.regNo === rawReg && activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
          isCurrentDevice = true;
        }
      } catch {}
    }

    const isBlocked = activeSessions.length >= maxAllowedDevices && !isCurrentDevice;

    return res.json({
      success: true,
      exists: true,
      studentName: studentRecord.studentName || "Student",
      isCurrentDevice,
      activeDeviceCount: activeSessions.length,
      maxAllowedDevices,
      isBlocked,
      blockMessage: isBlocked
        ? rawReg === "230301120327"
          ? `Account 230301120327 is already actively logged in on 2 devices (maximum 2 allowed). Log out from one device to sign in here.`
          : `Registration number ${rawReg} is already logged in on an active device. Single-device security policy is active. Please log out from that device first.`
        : null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error checking status." });
  }
});

// 1. Send OTP to student university email
router.post("/student/send-otp", async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    if (!rawReg) {
      return res.status(400).json({ message: "Registration number is required." });
    }

    // Verify student exists in university database
    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    if (!studentRecord) {
      return res.status(404).json({
        message: "No student records found for this registration number. Please check and try again.",
      });
    }

    const studentName = studentRecord.studentName || "Student";
    const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;

    // ── Active Multi-Device Security Guard ──
    const maxAllowedDevices = rawReg === "230301120327" ? 2 : 1;
    const isUnlimited = rawReg === "230301120327";

    // Clean up stale expired sessions first
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
    await StudentSession.deleteMany({
      regNo: rawReg,
      $or: [
        { lastActiveAt: { $lt: sevenDaysAgo } },
        { expiresAt: { $lt: new Date() } },
        { isActive: false },
      ],
    });

    const activeSessions = await StudentSession.find({
      regNo: rawReg,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    // Check if current incoming request already has an active session cookie/token
    let incomingToken = req.headers["x-student-token"];
    if (!incomingToken && req.cookies?.student_jwt) {
      incomingToken = req.cookies.student_jwt;
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    if (incomingToken) {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.regNo === rawReg && activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
          isCurrentDevice = true;
        }
      } catch {}
    }

    if (isCurrentDevice) {
      return res.json({
        success: true,
        alreadyLoggedIn: true,
        message: "You are already logged in on this device.",
        student: {
          regNo: rawReg,
          studentName,
        },
      });
    }

    // If active sessions already reached the maximum allowed limit, DO NOT SEND OTP! BLOCK!
    if (activeSessions.length >= maxAllowedDevices) {
      if (rawReg === "230301120327") {
        return res.status(403).json({
          success: false,
          code: "MAX_DEVICES_ACTIVE",
          message: `Account 230301120327 is already actively logged in on ${activeSessions.length} devices (maximum 2 allowed). Please log out from one device before signing in on a new device.`,
          activeDeviceCount: activeSessions.length,
          maxDevices: 2,
        });
      } else {
        return res.status(403).json({
          success: false,
          code: "DEVICE_ALREADY_LOGGED_IN",
          message: `Registration number ${rawReg} is already logged in on an active device. Single-device security policy is active. Please log out from your other device before signing in here.`,
          activeDeviceCount: activeSessions.length,
          maxDevices: 1,
        });
      }
    }

    // ── Daily Limit Check: Max 2 OTP requests per day (bypassed for developer whitelisted regNo) ──
    const dateKey = getIstDateKey();
    let dailyLimit = await StudentDailyLimit.findOne({ regNo: rawReg, dateKey });

    if (!dailyLimit) {
      dailyLimit = new StudentDailyLimit({
        regNo: rawReg,
        dateKey,
        otpSendCount: 0,
      });
    }

    if (!isUnlimited && dailyLimit.otpSendCount >= 2) {
      const { hours, mins } = getTimeUntilIstMidnight();
      return res.status(429).json({
        message: `Daily OTP limit reached (maximum 2 requests per calendar day). Login for ${rawReg} is locked for today. It will automatically reset at 12:00 AM midnight (in ${hours}h ${mins}m).`,
        code: "DAILY_LIMIT_EXCEEDED",
        remainingSeconds: getTimeUntilIstMidnight().totalSeconds,
      });
    }

    // ── Generate 6-Digit OTP ──
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, otpSalt);

    // Delete any old unverified OTP for this regNo
    await OtpVerification.deleteMany({ regNo: rawReg });

    // Store new OTP valid for 5 minutes (300 seconds)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OtpVerification.create({
      regNo: rawReg,
      email: studentEmail,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    // Increment daily count
    dailyLimit.otpSendCount += 1;
    dailyLimit.lastOtpSentAt = new Date();
    await dailyLimit.save();

    // ── Dispatch Email via Transporter ──
    try {
      await sendOtpEmail({
        to: studentEmail,
        studentName,
        regNo: rawReg,
        otp: otpCode,
        expiresInMinutes: 5,
      });
    } catch (emailErr) {
      console.error("Email dispatch failed:", emailErr.message);
      // Even if external SMTP fails, we provide informative feedback
      return res.status(500).json({
        message: "Failed to deliver OTP email to your university address. Please try again later.",
      });
    }

    const maskedEmail = `${studentEmail.slice(0, 4)}***@${studentEmail.split("@")[1]}`;

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${studentEmail}.`,
      maskedEmail,
      studentName,
      regNo: rawReg,
      expiresInSeconds: 300,
      remainingDailyAttempts: isUnlimited ? 99 : Math.max(0, 2 - dailyLimit.otpSendCount),
      isUnlimited,
    });
  } catch (err) {
    console.error("Student send-otp error:", err);
    res.status(500).json({ message: "An internal error occurred while processing OTP." });
  }
});

// 2. Verify OTP & Issue Single-Device Session Token
router.post("/student/verify-otp", otpLimiter, async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    const rawOtp = String(req.body.otp || "").trim();

    if (!rawReg || !rawOtp) {
      return res.status(400).json({ message: "Registration number and OTP code are required." });
    }

    // Find active OTP record
    const otpRecord = await OtpVerification.findOne({ regNo: rawReg });
    if (!otpRecord || new Date() > new Date(otpRecord.expiresAt)) {
      if (otpRecord) await OtpVerification.deleteOne({ _id: otpRecord._id });
      // If session is already created and authenticated, return success
      const existingSession = await StudentSession.findOne({ regNo: rawReg, isActive: true });
      if (existingSession) {
        const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
        return res.json({
          success: true,
          message: "Student already verified and authenticated.",
          student: {
            regNo: rawReg,
            studentName: studentRecord?.studentName || "Student",
            section: studentRecord?.branch || "CSE-A",
          },
        });
      }
      return res.status(400).json({
        message: "The OTP code has expired or is invalid. Please request a new code.",
        code: "OTP_EXPIRED",
      });
    }

    if (otpRecord.attempts >= 3) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "Maximum incorrect OTP attempts exceeded. Please request a new code.",
        code: "MAX_ATTEMPTS_EXCEEDED",
      });
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        message: `Incorrect OTP code. ${3 - otpRecord.attempts} attempt(s) remaining.`,
        code: "INVALID_OTP",
      });
    }

    // OTP Verified! Clear used OTP
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // Fetch student info
    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    const studentName = studentRecord?.studentName || "Student";

    // ── Generate Active Session (Max 2 for 230301120327, Max 1 for others) ──
    const sessionId = crypto.randomUUID();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

    try {
      await StudentSession.collection.dropIndex("regNo_1");
    } catch {}

    if (rawReg === "230301120327") {
      const existing = await StudentSession.find({ regNo: rawReg }).sort({ lastActiveAt: 1 });
      if (existing.length >= 2) {
        const toDelete = existing.slice(0, existing.length - 1);
        await StudentSession.deleteMany({ _id: { $in: toDelete.map((s) => s._id) } });
      }
    } else {
      await StudentSession.deleteMany({ regNo: rawReg });
    }

    await StudentSession.create({
      regNo: rawReg,
      sessionId,
      deviceInfo: {
        userAgent: req.headers["user-agent"] || "",
        ip: req.ip || req.connection.remoteAddress || "",
        platform: req.headers["sec-ch-ua-platform"] || "",
      },
      loggedInAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt,
      isActive: true,
    });

    // ── Issue JWT with 7 Days Expiry ──
    const studentToken = jwt.sign(
      {
        regNo: rawReg,
        sessionId,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieOptions = {
      expires: expiresAt,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    };

    res.cookie("student_jwt", studentToken, cookieOptions);

    res.json({
      success: true,
      token: studentToken,
      message: "Authentication successful.",
      student: {
        regNo: rawReg,
        studentName,
        sessionId,
      },
    });
  } catch (err) {
    console.error("Student verify-otp error:", err);
    res.status(500).json({ message: "An internal error occurred during verification." });
  }
});

// 3. Current Authenticated Student Session Check (/api/auth/student/me)
router.get("/student/me", protectStudent, async (req, res) => {
  try {
    const studentRecord = await SemesterResult.findOne({ regNo: req.student.regNo }).sort({ semester: -1 });
    res.json({
      success: true,
      student: {
        regNo: req.student.regNo,
        studentName: studentRecord?.studentName || "Student",
        sessionId: req.student.sessionId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error fetching session." });
  }
});

// 4. Student Logout (/api/auth/student/logout)
router.post("/student/logout", async (req, res) => {
  try {
    let studentToken = req.cookies?.student_jwt;
    if (!studentToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      studentToken = req.headers.authorization.split(" ")[1];
    }

    if (studentToken && studentToken !== "none") {
      try {
        const decoded = jwt.verify(studentToken, process.env.JWT_SECRET);
        if (decoded?.regNo && decoded?.sessionId) {
          // Remove session from DB so student can immediately log in on another device
          await StudentSession.deleteOne({ regNo: decoded.regNo, sessionId: decoded.sessionId });
        }
      } catch {}
    }

    const clearOptions = {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    };

    res.cookie("student_jwt", "", clearOptions);
    res.clearCookie("student_jwt", clearOptions);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout error" });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   ADMIN AUTHENTICATION
═══════════════════════════════════════════════════════════════════ */

router.post("/login", validateLoginInput, async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    
    const options = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      httpOnly: true, // Prevents XSS attacks (JS cannot access cookie)
      secure: true, // HTTPS required for cross-origin cookies
      sameSite: "none", // Required for cross-site (Render to Vercel) cookie support
      path: "/",
    };
    
    res.cookie("jwt", token, options);
    res.json({ success: true, email: admin.email, token });
  } catch (err) {
    console.error("Auth login error:", err.message);
    res.status(500).json({ message: "An internal authentication error occurred." });
  }
});

router.post("/logout", (req, res) => {
  const options = {
    expires: new Date(0), // Instantly expire in 1970
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };
  res.cookie("jwt", "", options);
  res.clearCookie("jwt", options);
  res.status(200).json({ success: true, message: "User logged out" });
});

router.get("/me", async (req, res) => {
  try {
    let token;
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token || token === "none" || token === "") {
      return res.json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    
    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    
    res.json({ success: true, admin, token });
  } catch (err) {
    res.json({ success: false, message: "Token invalid or expired" });
  }
});

module.exports = router;

