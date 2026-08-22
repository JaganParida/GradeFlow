const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const AdminSession = require("../models/AdminSession");
const AdminOtpVerification = require("../models/AdminOtpVerification");
const SemesterResult = require("../models/SemesterResult");
const Student = require("../models/Student");
const OtpVerification = require("../models/OtpVerification");
const StudentSession = require("../models/StudentSession");
const StudentDailyLimit = require("../models/StudentDailyLimit");
const { protect, protectStudent } = require("../middleware/auth");
const { validateLoginInput } = require("../middleware/validation");
const { otpLimiter } = require("../middleware/rateLimiters");
const { sendOtpEmail, sendAdminOtpEmail } = require("../utils/emailService");
const {
  SEVEN_DAYS_MS,
  MAX_ADMIN_DEVICES,
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getActiveSessions,
  touchSession,
  cleanExpiredAdminSessions,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
} = require("../utils/sessionManager");

const router = express.Router();

// Helper to format IST Date string YYYY-MM-DD
function getIstDateKey() {
  const now = new Date();
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
   STUDENT AUTHENTICATION (EMAIL OTP & MULTI/SINGLE DEVICE POLICY)
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

    const maxAllowedDevices = getMaxAllowedDevices(rawReg);
    const activeSessions = await getActiveSessions(StudentSession, rawReg);

    let incomingToken = req.headers["x-student-token"];
    if (!incomingToken && req.cookies?.student_jwt) {
      incomingToken = req.cookies.student_jwt;
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    let currentSessionId = null;
    if (incomingToken && incomingToken !== "none") {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.regNo === rawReg && activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
          isCurrentDevice = true;
          currentSessionId = decoded.sessionId;
        }
      } catch {}
    }

    const isBlocked = activeSessions.length >= maxAllowedDevices && !isCurrentDevice;

    const sessionDetails = activeSessions.map((s, idx) => ({
      deviceIndex: idx + 1,
      sessionId: s.sessionId,
      isCurrentDevice: s.sessionId === currentSessionId,
      platform: s.deviceInfo?.platform || "Unknown",
      userAgent: s.deviceInfo?.userAgent || "Unknown",
      ip: s.deviceInfo?.ip || "",
      loggedInAt: s.loggedInAt,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      status: "ACTIVE",
    }));

    return res.json({
      success: true,
      exists: true,
      studentName: studentRecord.studentName || "Student",
      isCurrentDevice,
      activeDeviceCount: activeSessions.length,
      maxAllowedDevices,
      isBlocked,
      loginAllowed: !isBlocked,
      otpAllowed: !isBlocked,
      verificationAllowed: !isBlocked,
      blockReason: isBlocked ? "DEVICE_LIMIT_REACHED" : null,
      blockMessage: isBlocked
        ? rawReg === "230301120327"
          ? `Account 230301120327 is already actively logged in on 2 devices (maximum 2 allowed). Please log out from one device before signing in on a new device.`
          : `Registration number ${rawReg} is already logged in on an active device. Single-device security policy is active. Please log out from that device first.`
        : null,
      sessions: sessionDetails,
    });
  } catch (err) {
    console.error("Student check-status error:", err);
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

    // Verify student exists in university records
    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    if (!studentRecord) {
      return res.status(404).json({
        message: "No student records found for this registration number. Please check and try again.",
      });
    }

    const studentName = studentRecord.studentName || "Student";
    const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;

    // ── Active Multi-Device Security Guard ──
    const maxAllowedDevices = getMaxAllowedDevices(rawReg);
    const isUnlimited = rawReg === "230301120327";

    const activeSessions = await getActiveSessions(StudentSession, rawReg);

    // Check if current requesting device already has an active session
    let incomingToken = req.headers["x-student-token"];
    if (!incomingToken && req.cookies?.student_jwt) {
      incomingToken = req.cookies.student_jwt;
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    if (incomingToken && incomingToken !== "none") {
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

    // CRITICAL: Block OTP Generation if device limit is already reached!
    if (activeSessions.length >= maxAllowedDevices) {
      return res.status(403).json({
        success: false,
        code: "DEVICE_LIMIT_REACHED",
        message: rawReg === "230301120327"
          ? `Account 230301120327 is already active on ${activeSessions.length} devices (maximum limit: 2). Please log out from one device before logging in on a new device.`
          : `Registration number ${rawReg} is already logged in on an active device (maximum limit: 1). Single-device security policy is active. Please log out from your other device before signing in here.`,
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices,
        isBlocked: true,
      });
    }

    // ── Daily Limit Check: Max 2 OTP requests per day (bypassed for 230301120327) ──
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
      const { hours, mins, totalSeconds } = getTimeUntilIstMidnight();
      return res.status(429).json({
        message: `Daily OTP limit reached (maximum 2 requests per calendar day). Login for ${rawReg} is locked for today. It will automatically reset at 12:00 AM midnight (in ${hours}h ${mins}m).`,
        code: "DAILY_LIMIT_EXCEEDED",
        remainingSeconds: totalSeconds,
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

// 2. Verify OTP & Issue Device Session Token
router.post("/student/verify-otp", otpLimiter, async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    const rawOtp = String(req.body.otp || "").trim();

    if (!rawReg || !rawOtp) {
      return res.status(400).json({ message: "Registration number and OTP code are required." });
    }

    // Find active OTP record
    const otpRecord = await OtpVerification.findOne({ regNo: rawReg });
    if (!otpRecord) {
      // Check if already authenticated on this request
      const activeSessions = await getActiveSessions(StudentSession, rawReg);
      if (activeSessions.length > 0) {
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

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        message: "The OTP code has expired. Please request a new code.",
        code: "OTP_EXPIRED",
      });
    }

    if (otpRecord.attempts >= 5) {
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
      const remainingAttempts = Math.max(0, 5 - otpRecord.attempts);
      return res.status(400).json({
        message: `Incorrect OTP code. ${remainingAttempts} attempt(s) remaining.`,
        code: "INVALID_OTP",
        remainingAttempts,
      });
    }

    // OTP Verified! Clear used OTP
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // Atomic Device Limit Check before creating session (Protects against concurrent logins)
    const maxAllowedDevices = getMaxAllowedDevices(rawReg);
    const activeSessions = await getActiveSessions(StudentSession, rawReg);

    if (activeSessions.length >= maxAllowedDevices) {
      return res.status(403).json({
        success: false,
        code: "DEVICE_LIMIT_REACHED",
        message: rawReg === "230301120327"
          ? `Account 230301120327 is already active on ${activeSessions.length} devices (maximum limit: 2). Please log out from one device before logging in on a new device.`
          : `Registration number ${rawReg} is already logged in on an active device (maximum limit: 1). Single-device security policy is active. Please log out from your other device first.`,
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices,
        isBlocked: true,
      });
    }

    // Fetch student profile info
    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    const studentName = studentRecord?.studentName || "Student";

    // Generate New Unique Session for this Device
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = new Date(now + SEVEN_DAYS_MS);

    // Create session record in MongoDB (WITHOUT deleting/evicting existing valid sessions)
    await StudentSession.create({
      regNo: rawReg,
      sessionId,
      deviceInfo: {
        userAgent: req.headers["user-agent"] || "",
        ip: req.ip || req.connection?.remoteAddress || "",
        platform: req.headers["sec-ch-ua-platform"] || "",
      },
      loggedInAt: new Date(now),
      lastActiveAt: new Date(now),
      expiresAt,
      isActive: true,
    });

    // Issue JWT with 7-day expiration matching inactivity policy
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

    return res.json({
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
    console.error("Student /me error:", err);
    res.status(500).json({ message: "Server error fetching session." });
  }
});

// 4. Student Logout (/api/auth/student/logout) - ONLY AFFECTS CURRENT DEVICE
router.post("/student/logout", async (req, res) => {
  try {
    let studentToken = req.cookies?.student_jwt;
    if (!studentToken && req.headers["x-student-token"]) {
      studentToken = req.headers["x-student-token"];
    }
    if (!studentToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      studentToken = req.headers.authorization.split(" ")[1];
    }

    if (studentToken && studentToken !== "none") {
      try {
        const decoded = jwt.verify(studentToken, process.env.JWT_SECRET);
        if (decoded?.sessionId) {
          // REVOKE ONLY THE CALLING DEVICE'S SESSION! PRESERVE ALL OTHER VALID SESSIONS!
          await StudentSession.deleteOne({ sessionId: decoded.sessionId });
        }
      } catch (tokenErr) {
        console.warn("Logout token decode warning:", tokenErr.message);
      }
    }

    const clearOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    };

    res.clearCookie("student_jwt", clearOptions);
    return res.json({ success: true, message: "Logged out successfully from this device." });
  } catch (err) {
    console.error("Student logout error:", err);
    res.status(500).json({ message: "Server error during logout." });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   ADMIN AUTHENTICATION (ENVIRONMENT-BASED, OTP & 2-DEVICE LIMIT)
═══════════════════════════════════════════════════════════════════ */

// 0. Admin Status Check (/api/auth/admin/check-status)
router.get("/admin/check-status", async (req, res) => {
  try {
    const activeSessions = await getActiveAdminSessions(AdminSession);

    let incomingToken = req.headers["x-admin-token"];
    if (!incomingToken && req.cookies?.jwt) {
      incomingToken = req.cookies.jwt;
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    let currentSessionId = null;
    if (incomingToken && incomingToken !== "none") {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.role === "admin" && decoded.sessionId) {
          if (activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
            isCurrentDevice = true;
            currentSessionId = decoded.sessionId;
          }
        }
      } catch {}
    }

    const isBlocked = activeSessions.length >= MAX_ADMIN_DEVICES && !isCurrentDevice;

    return res.json({
      success: true,
      isCurrentDevice,
      activeDeviceCount: activeSessions.length,
      maxAllowedDevices: MAX_ADMIN_DEVICES,
      isBlocked,
      otpAllowed: !isBlocked,
      loginAllowed: !isBlocked,
      blockReason: isBlocked ? "ADMIN_DEVICE_LIMIT_REACHED" : null,
    });
  } catch (err) {
    console.error("Admin status check error:", err);
    return res.status(500).json({ message: "Server error checking admin status." });
  }
});

// 1. Admin Password Login -> Trigger OTP (/api/auth/admin/login-password or /api/auth/login)
const handleAdminPasswordLogin = async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("Admin authentication configuration error: ADMIN_EMAIL or ADMIN_PASSWORD missing from server environment.");
      return res.status(500).json({
        message: "Admin authentication is temporarily unavailable due to server configuration.",
        code: "ADMIN_CONFIG_MISSING",
      });
    }

    const candidatePassword = String(req.body.password || "");
    if (!candidatePassword) {
      return res.status(400).json({
        message: "Please enter your administrative password.",
        code: "PASSWORD_REQUIRED",
      });
    }

    // Secure timing-safe string comparison between submitted password and environment ADMIN_PASSWORD
    const candidateBuf = Buffer.from(candidatePassword, "utf8");
    const adminPassBuf = Buffer.from(adminPassword, "utf8");

    let isPasswordCorrect = false;
    if (candidateBuf.length === adminPassBuf.length) {
      isPasswordCorrect = crypto.timingSafeEqual(candidateBuf, adminPassBuf);
    }

    // Secondary fallback to Admin database record comparison if synced
    if (!isPasswordCorrect) {
      const adminDoc = await Admin.findOne({ email: adminEmail });
      if (adminDoc && typeof adminDoc.comparePassword === "function") {
        isPasswordCorrect = await adminDoc.comparePassword(candidatePassword);
      }
    }

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid password. Access denied.",
        code: "INVALID_PASSWORD",
      });
    }

    // Password verified! Now inspect active admin device sessions
    const activeSessions = await getActiveAdminSessions(AdminSession);

    // Check if incoming device already has a valid admin session
    let incomingToken = req.headers["x-admin-token"];
    if (!incomingToken && req.cookies?.jwt) {
      incomingToken = req.cookies.jwt;
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    if (incomingToken && incomingToken !== "none") {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.role === "admin" && decoded.sessionId) {
          const matching = activeSessions.find((s) => s.sessionId === decoded.sessionId);
          if (matching && isAdminSessionValid(matching)) {
            await touchAdminSession(matching);
            isCurrentDevice = true;
            return res.json({
              success: true,
              alreadyLoggedIn: true,
              token: incomingToken,
              message: "Admin is already actively authenticated on this device.",
            });
          }
        }
      } catch {}
    }

    // CRITICAL GUARD: Strict 2-Device Limit Check BEFORE generating or sending OTP
    if (activeSessions.length >= MAX_ADMIN_DEVICES && !isCurrentDevice) {
      return res.status(403).json({
        message: `Admin portal is currently active on ${activeSessions.length} authorized devices (maximum limit: ${MAX_ADMIN_DEVICES}). Please log out from another device before logging in here.`,
        code: "ADMIN_DEVICE_LIMIT_REACHED",
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices: MAX_ADMIN_DEVICES,
      });
    }

    // Generate secure 6-digit OTP code
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // Store in AdminOtpVerification (replace any existing pending OTPs)
    await AdminOtpVerification.deleteMany({});
    await AdminOtpVerification.create({
      otpHash,
      expiresAt,
      attempts: 0,
    });

    // Dispatch OTP email to ADMIN_EMAIL securely on server-side
    await sendAdminOtpEmail({
      to: adminEmail,
      otp,
      expiresInMinutes: 5,
    });

    return res.json({
      success: true,
      step: "OTP_REQUIRED",
      expiresInSeconds: 300,
      message: "A 6-digit verification code has been dispatched to the authorized institutional administrator email.",
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ message: "An internal authentication error occurred." });
  }
};

router.post("/admin/login-password", handleAdminPasswordLogin);
router.post("/login", handleAdminPasswordLogin);

// 2. Admin Verify OTP (/api/auth/admin/verify-otp)
router.post("/admin/verify-otp", async (req, res) => {
  try {
    const rawOtp = String(req.body.otp || "").trim();
    if (!rawOtp || rawOtp.length !== 6) {
      return res.status(400).json({
        message: "Please enter a valid 6-digit verification code.",
        code: "INVALID_FORMAT",
      });
    }

    const otpRecord = await AdminOtpVerification.findOne({
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Verification code has expired or is invalid. Please request a new code.",
        code: "OTP_EXPIRED",
      });
    }

    if (otpRecord.attempts >= 5) {
      await AdminOtpVerification.deleteMany({});
      return res.status(429).json({
        message: "Maximum verification attempts exceeded. Please enter your password to request a new code.",
        code: "MAX_ATTEMPTS_EXCEEDED",
      });
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remaining} attempt${remaining > 1 ? "s" : ""} remaining.`,
        code: "INVALID_OTP",
        remainingAttempts: remaining,
      });
    }

    // OTP is valid! Delete used OTP record
    await AdminOtpVerification.deleteMany({});

    // Atomic concurrency check on device slots
    const activeSessions = await getActiveAdminSessions(AdminSession);
    if (activeSessions.length >= MAX_ADMIN_DEVICES) {
      return res.status(403).json({
        message: `Admin device limit reached (${MAX_ADMIN_DEVICES} devices active). Please log out from another device.`,
        code: "ADMIN_DEVICE_LIMIT_REACHED",
      });
    }

    // Create new Admin Session
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS);

    const userAgent = req.headers["user-agent"] || "Unknown";
    const ip = req.ip || req.connection?.remoteAddress || "";
    const platform = req.headers["sec-ch-ua-platform"] || "Web";

    await AdminSession.create({
      sessionId,
      deviceInfo: { userAgent, ip, platform },
      loggedInAt: now,
      lastActiveAt: now,
      expiresAt,
      isActive: true,
    });

    const token = jwt.sign(
      { role: "admin", sessionId, loggedInAt: now },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const options = {
      expires: expiresAt,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };

    res.cookie("jwt", token, options);

    return res.json({
      success: true,
      token,
      message: "Admin authenticated successfully.",
    });
  } catch (err) {
    console.error("Admin OTP verify error:", err);
    return res.status(500).json({ message: "Server error during OTP verification." });
  }
});

// 3. Admin Current Session Check (/api/auth/me or /api/auth/admin/me)
const handleAdminMe = async (req, res) => {
  try {
    let token = req.headers["x-admin-token"];
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token || token === "none" || token === "") {
      return res.json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "student") {
      return res.status(403).json({ message: "Forbidden: Admin privileges required" });
    }

    if (decoded.sessionId) {
      const session = await AdminSession.findOne({
        sessionId: decoded.sessionId,
        isActive: true,
      });

      if (!session) {
        return res.json({
          success: false,
          code: "ADMIN_SESSION_TERMINATED",
          message: "Admin session ended because this device was logged out.",
        });
      }

      if (!isAdminSessionValid(session)) {
        await AdminSession.deleteOne({ _id: session._id });
        return res.json({
          success: false,
          code: "INACTIVITY_LOGOUT",
          message: "Admin session expired due to 7 continuous days of inactivity.",
        });
      }

      // Rolling activity update
      await touchAdminSession(session);

      return res.json({
        success: true,
        role: "admin",
        sessionId: session.sessionId,
        token,
      });
    }

    return res.json({ success: true, role: "admin", token });
  } catch (err) {
    return res.json({ success: false, message: "Token invalid or expired" });
  }
};

router.get("/me", handleAdminMe);
router.get("/admin/me", handleAdminMe);

// 4. Admin Single-Device Logout (/api/auth/logout or /api/auth/admin/logout)
const handleAdminLogout = async (req, res) => {
  try {
    let token = req.headers["x-admin-token"];
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token && token !== "none") {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.sessionId) {
          // REVOKE ONLY THE CALLING DEVICE'S SESSION! OTHER ADMIN DEVICES REMAIN ACTIVE!
          await AdminSession.deleteOne({ sessionId: decoded.sessionId });
        }
      } catch (tokenErr) {
        console.warn("Admin logout token decode warning:", tokenErr.message);
      }
    }

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };
    res.clearCookie("jwt", options);
    return res.status(200).json({ success: true, message: "Admin logged out successfully from this device." });
  } catch (err) {
    console.error("Admin logout error:", err);
    return res.status(500).json({ message: "Server error during logout." });
  }
};

router.post("/logout", handleAdminLogout);
router.post("/admin/logout", handleAdminLogout);

module.exports = router;
