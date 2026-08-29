const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const AdminSession = require("../models/AdminSession");
const AdminOtpVerification = require("../models/AdminOtpVerification");
const SubAdmin = require("../models/SubAdmin");
const SubAdminSession = require("../models/SubAdminSession");
const SubAdminOtpVerification = require("../models/SubAdminOtpVerification");
const AdminAuditLog = require("../models/AdminAuditLog");
const SemesterResult = require("../models/SemesterResult");
const Student = require("../models/Student");
const OtpVerification = require("../models/OtpVerification");
const StudentSession = require("../models/StudentSession");
const StudentDailyLimit = require("../models/StudentDailyLimit");
const OtpRequestLog = require("../models/OtpRequestLog");
const { protect, protectStudent } = require("../middleware/auth");
const { otpLimiter, otpSendLimiter, authLimiter } = require("../middleware/rateLimiters");
const { sendOtpEmail, sendAdminOtpEmail, sendSubAdminOtpEmail } = require("../utils/emailService");
const { sendStudentOtpEmail } = require("../utils/emailProviderManager");
const { globalDbQueue } = require("../utils/dbProtection");
const {
  PERMANENT_SESSION_MS,
  MAX_ADMIN_DEVICES,
  MAX_SUBADMIN_DEVICES,
  getMaxAllowedDevices,
  getActiveSessions,
  replaceStudentSession,
  createDeviceApprovalRequest,
  getDeviceApprovalStatus,
  touchSession,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
  getActiveSubAdminSessions,
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

const { extractRequestDeviceInfo } = require("../utils/deviceDetector");

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

function getCookieOptions(req, customExpires = null) {
  const isProd = process.env.NODE_ENV === "production";
  const expires = customExpires || new Date(Date.now() + PERMANENT_SESSION_MS);
  return {
    maxAge: PERMANENT_SESSION_MS,
    expires,
    httpOnly: true,
    secure: isProd || req.secure || req.headers["x-forwarded-proto"] === "https",
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const maskedLocal = local[0] + "*".repeat(Math.max(1, local.length - 2)) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

/* ═══════════════════════════════════════════════════════════════════
   STUDENT AUTHENTICATION — COMPLETE SERVER-DRIVEN PRODUCTION REBUILD
═══════════════════════════════════════════════════════════════════ */

// 0. Student Live Status & Device Pre-Check (/api/auth/student/check-status)
router.get("/student/check-status", async (req, res) => {
  try {
    const rawReg = String(req.query.regNo || "").trim().toUpperCase();
    if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
      return res.status(400).json({
        success: false,
        message: "Valid registration number required (5-20 alphanumeric characters).",
      });
    }

    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    if (!studentRecord) {
      return res.json({ success: true, exists: false });
    }

    const studentName = studentRecord.studentName || "Student";
    const studentAccount = await Student.findOne({ regNo: rawReg });
    const hasPassword = Boolean(studentAccount && studentAccount.passwordHash);
    const failedPasswordAttempts = studentAccount ? studentAccount.failedPasswordAttempts || 0 : 0;

    const maxAllowedDevices = getMaxAllowedDevices(rawReg);
    const activeSessions = await getActiveSessions(StudentSession, rawReg);

    let incomingToken = req.cookies?.student_jwt;
    if (!incomingToken && req.headers["x-student-token"]) {
      incomingToken = req.headers["x-student-token"];
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    let currentSessionId = null;
    if (hasPassword && incomingToken && incomingToken !== "none") {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.regNo === rawReg && activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
          isCurrentDevice = true;
          currentSessionId = decoded.sessionId;
        }
      } catch {}
    }

    // Determine device limits and OTP eligibility
    const isCapacityFull = activeSessions.length >= maxAllowedDevices && !isCurrentDevice;
    const isUnlimited = rawReg === "230301120327";

    const dateKey = getIstDateKey();
    const dailyLimit = await StudentDailyLimit.findOne({ regNo: rawReg, dateKey });
    const maxDailyLimit = isUnlimited ? 99 : 2;

    let isCooldownActive = false;
    let cooldownRemainingSeconds = 0;
    if (!isUnlimited && dailyLimit && dailyLimit.lastOtpSentAt && dailyLimit.otpSendCount > 0) {
      const timeSinceLastSend = Date.now() - new Date(dailyLimit.lastOtpSentAt).getTime();
      if (timeSinceLastSend < 180 * 1000) {
        isCooldownActive = true;
        cooldownRemainingSeconds = Math.ceil((180 * 1000 - timeSinceLastSend) / 1000);
      }
    }

    const currentDailyCount = dailyLimit ? dailyLimit.otpSendCount : 0;
    const isDailyLimitReached = !isUnlimited && currentDailyCount >= maxDailyLimit;
    const remainingDailyAttempts = isUnlimited ? 99 : Math.max(0, maxDailyLimit - currentDailyCount);

    // Rule 13: If failed password attempts >= 2
    // If another device is active for normal student: OTP is strictly blocked.
    // If 0 devices active: OTP fallback is allowed.
    let otpAllowed = true;
    let otpFallbackAllowed = false;
    let isBlocked = false;
    let blockReason = null;
    let blockMessage = null;

    if (hasPassword) {
      if (failedPasswordAttempts >= 2) {
        if (maxAllowedDevices === 1 && activeSessions.length >= 1 && !isCurrentDevice) {
          // Another device active -> NO OTP! BLOCK NEW DEVICE!
          otpAllowed = false;
          isBlocked = true;
          blockReason = "PASSWORD_FAILED_DEVICE_ACTIVE";
          blockMessage = `Maximum password attempts exceeded (2/2). Registration number ${rawReg} is currently logged in on another device. Single-device security policy: OTP recovery is blocked while your authorized device slot is occupied.`;
        } else if (maxAllowedDevices > 1 && activeSessions.length >= maxAllowedDevices && !isCurrentDevice) {
          otpAllowed = false;
          isBlocked = true;
          blockReason = "DEVICE_LIMIT_REACHED";
          blockMessage = `Account ${rawReg} has reached the maximum allowed active devices (${maxAllowedDevices}). Please log out from another device.`;
        } else {
          // No active device or slot available -> OTP recovery allowed
          otpFallbackAllowed = true;
          otpAllowed = !isDailyLimitReached && !isCooldownActive;
        }
      } else {
        // Password login is the normal entry method
        if (maxAllowedDevices > 1 && activeSessions.length >= maxAllowedDevices && !isCurrentDevice) {
          isBlocked = true;
          blockReason = "DEVICE_LIMIT_REACHED";
          blockMessage = `Account ${rawReg} is already actively logged in on ${maxAllowedDevices} devices (maximum ${maxAllowedDevices} allowed). Please log out from one device before signing in on a new device.`;
        }
        otpAllowed = false;
      }
    } else {
      // New student (no password) -> OTP is mandatory
      if (isCapacityFull) {
        isBlocked = true;
        otpAllowed = false;
        blockReason = "DEVICE_LIMIT_REACHED";
        blockMessage = `Registration number ${rawReg} is already logged in on an active device. Please log out from that device first.`;
      } else if (isDailyLimitReached) {
        isBlocked = true;
        otpAllowed = false;
        blockReason = "DAILY_LIMIT_EXCEEDED";
        blockMessage = `Daily OTP limit reached (${currentDailyCount}/${maxDailyLimit} attempts used). Login for ${rawReg} is locked for today. It will reset at midnight.`;
      } else if (isCooldownActive) {
        otpAllowed = false;
        blockReason = "OTP_COOLDOWN_ACTIVE";
        blockMessage = `Please wait ${cooldownRemainingSeconds} seconds before requesting another code.`;
      }
    }

    const sessionDetails = activeSessions.map((s, idx) => ({
      deviceIndex: idx + 1,
      sessionId: s.sessionId,
      isCurrentDevice: s.sessionId === currentSessionId,
      platform: s.deviceInfo?.platform || "Unknown",
      userAgent: s.deviceInfo?.userAgent || "Unknown",
      ip: s.deviceInfo?.ip || "",
      loggedInAt: s.loggedInAt,
      lastActiveAt: s.lastActiveAt,
      status: "ACTIVE",
    }));

    return res.json({
      success: true,
      exists: true,
      studentName,
      hasPassword,
      failedPasswordAttempts,
      isCurrentDevice,
      activeDeviceCount: activeSessions.length,
      maxAllowedDevices,
      isBlocked,
      otpAllowed,
      otpFallbackAllowed,
      loginAllowed: !isBlocked && (!hasPassword || failedPasswordAttempts < 2 || otpFallbackAllowed),
      attemptsUsedToday: currentDailyCount,
      maxDailyAttempts: maxDailyLimit,
      remainingDailyAttempts,
      isCooldownActive,
      cooldownRemainingSeconds,
      isDailyLimitReached,
      blockReason,
      blockMessage,
      sessions: sessionDetails,
    });
  } catch (err) {
    console.error("Student check-status error:", err);
    return res.status(500).json({ message: "Server error checking student status." });
  }
});

// 1. Student Password Login (/api/auth/student/login-password)
router.post("/student/login-password", authLimiter, async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    const candidatePassword = String(req.body.password || "");

    if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration number format.",
        code: "INVALID_REGNO",
      });
    }

    if (!candidatePassword) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
        code: "PASSWORD_REQUIRED",
      });
    }

    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    if (!studentRecord) {
      return res.status(404).json({
        success: false,
        message: "No student records found for this registration number.",
        code: "STUDENT_NOT_FOUND",
      });
    }

    const studentName = studentRecord.studentName || "Student";
    let studentAccount = await Student.findOne({ regNo: rawReg });

    if (!studentAccount || !studentAccount.passwordHash) {
      return res.status(400).json({
        success: false,
        message: "This student account does not have a password. Please verify your identity via email OTP to create a password.",
        code: "NO_PASSWORD_SET",
        hasPassword: false,
      });
    }

    const maxAllowedDevices = getMaxAllowedDevices(rawReg);
    const activeSessions = await getActiveSessions(StudentSession, rawReg);

    // Verify Password
    const isPasswordCorrect = await studentAccount.comparePassword(candidatePassword);

    if (isPasswordCorrect) {
      // Reset failed password attempts on successful login
      studentAccount.failedPasswordAttempts = 0;
      studentAccount.lastFailedPasswordAt = null;
      studentAccount.lockedUntil = null;
      await studentAccount.save();

      // Check if current requesting device already has an active session
      let incomingToken = req.cookies?.student_jwt;
      if (!incomingToken && req.headers["x-student-token"]) {
        incomingToken = req.headers["x-student-token"];
      }
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      let isCurrentDevice = false;
      let matchedSession = null;
      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.regNo === rawReg) {
            matchedSession = activeSessions.find((s) => s.sessionId === decoded.sessionId);
            if (matchedSession) {
              isCurrentDevice = true;
            }
          }
        } catch {}
      }

      if (isCurrentDevice && matchedSession) {
        await touchSession(matchedSession);
        return res.json({
          success: true,
          message: "Login successful.",
          alreadyLoggedIn: true,
          student: {
            regNo: rawReg,
            studentName,
            sessionId: matchedSession.sessionId,
          },
        });
      }

      // CASE B: New Device
      if (maxAllowedDevices === 1) {
        if (activeSessions.length === 0) {
          // Normal student with 0 active devices -> Direct Login!
          const { newSession } = await replaceStudentSession(StudentSession, rawReg, {
            deviceInfo: extractRequestDeviceInfo(req),
          });

          const studentToken = jwt.sign(
            { regNo: rawReg, sessionId: newSession.sessionId, role: "student" },
            process.env.JWT_SECRET,
            { expiresIn: "36500d" }
          );

          res.cookie("student_jwt", studentToken, getCookieOptions(req));

          return res.json({
            success: true,
            message: "Login successful.",
            student: {
              regNo: rawReg,
              studentName,
              sessionId: newSession.sessionId,
            },
          });
        }

        // Normal student with 1 active device -> IN-WEBSITE DEVICE APPROVAL FLOW (Prompt Sections 11-14)
        const activeDev = activeSessions[0];
        const { approvalRequest } = await createDeviceApprovalRequest(
          rawReg,
          extractRequestDeviceInfo(req),
          activeDev.sessionId
        );

        return res.json({
          success: true,
          step: "APPROVAL_PENDING",
          requestId: approvalRequest.requestId,
          expiresInSeconds: 180,
          message: "Approval required from your currently active device.",
          student: {
            regNo: rawReg,
            studentName,
          },
          activeDevice: {
            platform: activeDev.deviceInfo?.platform || "Authorized Device",
            deviceType: activeDev.deviceInfo?.deviceType || "Mobile",
            os: activeDev.deviceInfo?.os || "Unknown",
            browser: activeDev.deviceInfo?.browser || "Unknown",
            ip: activeDev.deviceInfo?.ip || "",
            loggedInAt: activeDev.loggedInAt,
          },
        });
      } else {
        // 2-Device Account (Special Student 230301120327): Max = 2 active devices
        if (activeSessions.length >= maxAllowedDevices) {
          const sessionsToRevoke = activeSessions.slice(maxAllowedDevices - 1);
          const revokeIds = sessionsToRevoke.map((s) => s.sessionId);
          await StudentSession.deleteMany({ sessionId: { $in: revokeIds } });
        }

        const sessionId = crypto.randomUUID();
        const now = Date.now();
        const expiresAt = new Date(now + PERMANENT_SESSION_MS);

        const newSession = await StudentSession.create({
          regNo: rawReg,
          sessionId,
          deviceId: crypto.randomUUID(),
          deviceInfo: extractRequestDeviceInfo(req),
          loggedInAt: new Date(now),
          lastActiveAt: new Date(now),
          expiresAt,
          isActive: true,
        });

        const studentToken = jwt.sign(
          { regNo: rawReg, sessionId, role: "student" },
          process.env.JWT_SECRET,
          { expiresIn: "36500d" }
        );

        res.cookie("student_jwt", studentToken, getCookieOptions(req, expiresAt));

        return res.json({
          success: true,
          message: "Login successful.",
          student: {
            regNo: rawReg,
            studentName,
            sessionId,
          },
        });
      }
    }

    // IF PASSWORD WRONG:
    studentAccount.failedPasswordAttempts = (studentAccount.failedPasswordAttempts || 0) + 1;
    studentAccount.lastFailedPasswordAt = new Date();
    await studentAccount.save();

    const currentAttempts = studentAccount.failedPasswordAttempts;

    if (currentAttempts === 1) {
      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: "Incorrect password. 1 attempt remaining before OTP recovery is evaluated.",
        remainingAttempts: 1,
        failedAttempts: 1,
      });
    }

    // FINAL RULE: 2 Failed Attempts reached
    // Evaluate active sessions server-side
    if (maxAllowedDevices === 1) {
      if (activeSessions.length >= 1) {
        // CASE A: Another device is logged in -> STRICTLY BLOCK OTP & BLOCK NEW DEVICE!
        const sanitizedDevices = activeSessions.map((s, idx) => ({
          deviceIndex: idx + 1,
          platform: s.deviceInfo?.platform || "Unknown",
          userAgent: s.deviceInfo?.userAgent || "Unknown",
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          status: "ACTIVE",
        }));

        return res.status(403).json({
          success: false,
          code: "BLOCKED_DEVICE_ACTIVE",
          message: `Maximum password attempts reached (2/2). Registration number ${rawReg} is currently active on another device. Single-device security policy: OTP recovery is blocked while your account is logged in on another device.`,
          isBlocked: true,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices: 1,
          activeDevices: sanitizedDevices,
        });
      } else {
        // CASE B: 0 devices active -> OTP fallback is allowed
        return res.status(401).json({
          success: false,
          code: "OTP_FALLBACK_ALLOWED",
          message: "Maximum password attempts reached (2/2). No active devices found on your account. You may now request an OTP to recover access.",
          otpFallbackAllowed: true,
          failedAttempts: currentAttempts,
        });
      }
    } else {
      // 2-Device Account
      if (activeSessions.length < maxAllowedDevices) {
        return res.status(401).json({
          success: false,
          code: "OTP_FALLBACK_ALLOWED",
          message: "Maximum password attempts reached (2/2). OTP verification is available to log in.",
          otpFallbackAllowed: true,
          failedAttempts: currentAttempts,
        });
      } else {
        return res.status(403).json({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          message: `Maximum password attempts reached (2/2). Account ${rawReg} already has 2 active devices. OTP recovery cannot create a third session.`,
          isBlocked: true,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices,
        });
      }
    }
  } catch (err) {
    console.error("Student login-password error:", err);
    return res.status(500).json({ success: false, message: "Server error during password login." });
  }
});

// 2. Student Send OTP (/api/auth/student/send-otp)
router.post("/student/send-otp", otpSendLimiter, async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration number format. Must be 5-20 alphanumeric characters.",
      });
    }

    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    if (!studentRecord) {
      return res.status(404).json({
        message: "No student records found for this registration number. Please check and try again.",
      });
    }

    const studentName = studentRecord.studentName || "Student";
    const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;
    const maxAllowedDevices = getMaxAllowedDevices(rawReg);
    const isUnlimited = rawReg === "230301120327";

    let studentAccount = await Student.findOne({ regNo: rawReg });
    const hasPassword = Boolean(studentAccount && studentAccount.passwordHash);
    const failedPasswordAttempts = studentAccount ? studentAccount.failedPasswordAttempts || 0 : 0;

    const activeSessions = await getActiveSessions(StudentSession, rawReg);

    // Check if requesting device already has an active session
    let incomingToken = req.cookies?.student_jwt;
    if (!incomingToken && req.headers["x-student-token"]) {
      incomingToken = req.headers["x-student-token"];
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    if (hasPassword && incomingToken && incomingToken !== "none") {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.regNo === rawReg && activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
          isCurrentDevice = true;
        }
      } catch {}
    }

    if (hasPassword && isCurrentDevice) {
      return res.json({
        success: true,
        alreadyLoggedIn: true,
        message: "You are already logged in on this device.",
        student: { regNo: rawReg, studentName },
      });
    }

    // RULE 16: OTP MUST NEVER BYPASS DEVICE LIMIT
    if (hasPassword) {
      if (failedPasswordAttempts < 2) {
        return res.status(400).json({
          success: false,
          code: "PASSWORD_REQUIRED",
          message: "Your account is secured with a password. Please log in with your password.",
        });
      }

      // If failed >= 2: check active devices
      if (maxAllowedDevices === 1 && activeSessions.length >= 1) {
        return res.status(403).json({
          success: false,
          code: "BLOCKED_DEVICE_ACTIVE",
          message: `Single-device security policy: OTP cannot be sent because another device is already active on account ${rawReg}.`,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices: 1,
        });
      }

      if (maxAllowedDevices > 1 && activeSessions.length >= maxAllowedDevices) {
        return res.status(403).json({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          message: `Account ${rawReg} is currently active on ${activeSessions.length} devices (maximum limit: ${maxAllowedDevices}). Please log out from another device.`,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices,
        });
      }
    } else {
      // New student (no password yet)
      if (activeSessions.length >= maxAllowedDevices) {
        return res.status(403).json({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          message: `Account ${rawReg} has reached maximum active device limit (${maxAllowedDevices}).`,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices,
        });
      }
    }

    // Enforce 180s Cooldown & Daily Limit Atomically
    const dateKey = getIstDateKey();
    let dailyLimit = await globalDbQueue.run(() =>
      StudentDailyLimit.findOne({ regNo: rawReg, dateKey })
    );

    if (!dailyLimit) {
      dailyLimit = new StudentDailyLimit({
        regNo: rawReg,
        dateKey,
        otpSendCount: 0,
        lastOtpSentAt: null,
      });
    }

    if (!isUnlimited && dailyLimit.lastOtpSentAt && dailyLimit.otpSendCount > 0) {
      const timeSinceLastSend = Date.now() - new Date(dailyLimit.lastOtpSentAt).getTime();
      if (timeSinceLastSend < 180 * 1000) {
        const waitSeconds = Math.ceil((180 * 1000 - timeSinceLastSend) / 1000);
        return res.status(429).json({
          success: false,
          code: "OTP_COOLDOWN_ACTIVE",
          message: `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
          remainingSeconds: waitSeconds,
        });
      }
    }

    const maxDailyLimit = isUnlimited ? 99 : 2;
    if (!isUnlimited && dailyLimit.otpSendCount >= maxDailyLimit) {
      const { hours, mins, totalSeconds } = getTimeUntilIstMidnight();
      return res.status(429).json({
        success: false,
        code: "DAILY_LIMIT_EXCEEDED",
        message: `Daily OTP limit reached (maximum ${maxDailyLimit} requests per calendar day). Login for ${rawReg} is locked for today. It will reset at midnight (in ${hours}h ${mins}m).`,
        remainingSeconds: totalSeconds,
      });
    }

    // Generate 6-Digit Secure OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, otpSalt);

    // Invalidate old unverified OTPs for this regNo
    await globalDbQueue.run(() => OtpVerification.deleteMany({ regNo: rawReg }));

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes TTL
    await globalDbQueue.run(() =>
      OtpVerification.create({
        regNo: rawReg,
        email: studentEmail,
        otpHash,
        expiresAt,
        attempts: 0,
      })
    );

    // Dispatch Email via Brevo with Gmail Fallback
    try {
      const emailResult = await sendStudentOtpEmail({
        to: studentEmail,
        studentName,
        regNo: rawReg,
        otp: otpCode,
        expiresInMinutes: 3,
      });

      const isFallback = emailResult.provider === "gmail_fallback";
      dailyLimit.otpSendCount += 1;
      dailyLimit.lastOtpSentAt = new Date();
      await globalDbQueue.run(() => dailyLimit.save());

      await OtpRequestLog.create({
        regNo: rawReg,
        studentName,
        dateKey,
        status: "DELIVERED",
        deliveryStatus: "DELIVERED",
        provider: isFallback ? "GMAIL" : "BREVO",
        failoverOccurred: isFallback,
        primaryFailureReason: emailResult.primaryFailureReason || null,
        reason: isFallback ? "OTP dispatched via Gmail Fallback" : "OTP dispatched via Brevo Primary",
        deviceInfo: extractRequestDeviceInfo(req),
      }).catch(() => {});
    } catch (emailErr) {
      console.error("[Auth] All email providers failed for student OTP:", emailErr.message);
      await globalDbQueue.run(() => OtpVerification.deleteMany({ regNo: rawReg })).catch(() => {});

      await OtpRequestLog.create({
        regNo: rawReg,
        studentName,
        dateKey,
        status: "FAILED",
        deliveryStatus: "FAILED",
        provider: "ALL_FAILED",
        reason: `Email delivery failed: ${emailErr.message || "Provider error"}`,
        deviceInfo: extractRequestDeviceInfo(req),
      }).catch(() => {});

      return res.status(503).json({
        success: false,
        message: "OTP delivery is temporarily unavailable. Please try again in a few moments.",
        code: "OTP_DELIVERY_UNAVAILABLE",
      });
    }

    const maskedEmail = maskEmail(studentEmail);

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${studentEmail}.`,
      maskedEmail,
      studentName,
      regNo: rawReg,
      expiresInSeconds: 180,
      cooldownSeconds: 180,
      attemptsUsedToday: dailyLimit.otpSendCount,
      maxDailyAttempts: maxDailyLimit,
      remainingDailyAttempts: isUnlimited ? 99 : Math.max(0, maxDailyLimit - dailyLimit.otpSendCount),
      isUnlimited,
    });
  } catch (err) {
    console.error("Student send-otp error:", err);
    res.status(500).json({ success: false, message: "An internal error occurred while sending OTP." });
  }
});

// 3. Student Verify OTP (/api/auth/student/verify-otp)
router.post("/student/verify-otp", otpLimiter, async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    const rawOtp = String(req.body.otp || "").trim();

    if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
      return res.status(400).json({ success: false, message: "Invalid registration number format." });
    }
    if (!rawOtp || !/^\d{6}$/.test(rawOtp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP format. Must be a 6-digit numeric code." });
    }

    const otpRecord = await OtpVerification.findOne({ regNo: rawReg });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "The verification code has expired or is invalid. Please request a new code.",
        code: "OTP_EXPIRED",
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "The verification code has expired. Please request a new code.",
        code: "OTP_EXPIRED",
      });
    }

    if (otpRecord.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "Maximum incorrect verification attempts exceeded. Please request a new code.",
        code: "MAX_ATTEMPTS_EXCEEDED",
      });
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = Math.max(0, 5 - otpRecord.attempts);
      return res.status(400).json({
        success: false,
        message: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
        code: "INVALID_OTP",
        remainingAttempts: remaining,
      });
    }

    // OTP is valid! Remove OTP record immediately
    await OtpVerification.deleteOne({ _id: otpRecord._id });

    // Fetch or create Student account
    let studentAccount = await Student.findOne({ regNo: rawReg });
    if (!studentAccount) {
      studentAccount = await Student.create({ regNo: rawReg });
    }

    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    const studentName = studentRecord?.studentName || "Student";

    // RULE 8: If password does NOT exist -> MANDATORY CREATE PASSWORD
    if (!studentAccount.passwordHash) {
      const setupPasswordToken = jwt.sign(
        { regNo: rawReg, purpose: "SETUP_PASSWORD" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );

      return res.json({
        success: true,
        verified: true,
        authenticated: false,
        passwordRequired: true,
        step: "CREATE_PASSWORD",
        setupPasswordToken,
        message: "Verification successful. You must now create a password for your account.",
        student: {
          regNo: rawReg,
          studentName,
        },
      });
    }

    // If student ALREADY has a password (OTP fallback login)
    studentAccount.failedPasswordAttempts = 0;
    studentAccount.lastFailedPasswordAt = null;
    studentAccount.lockedUntil = null;
    await studentAccount.save();

    const maxAllowedDevices = getMaxAllowedDevices(rawReg);
    const activeSessions = await getActiveSessions(StudentSession, rawReg);

    if (maxAllowedDevices === 1) {
      const { newSession } = await replaceStudentSession(StudentSession, rawReg, {
        deviceInfo: extractRequestDeviceInfo(req),
      });

      const studentToken = jwt.sign(
        { regNo: rawReg, sessionId: newSession.sessionId, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "36500d" }
      );

      res.cookie("student_jwt", studentToken, getCookieOptions(req));

      return res.json({
        success: true,
        message: "Authentication successful via OTP recovery.",
        student: {
          regNo: rawReg,
          studentName,
          sessionId: newSession.sessionId,
        },
      });
    } else {
      if (activeSessions.length >= maxAllowedDevices) {
        return res.status(403).json({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          message: `Account ${rawReg} has reached maximum active devices (${maxAllowedDevices}).`,
        });
      }

      const sessionId = crypto.randomUUID();
      const now = Date.now();
      const expiresAt = new Date(now + PERMANENT_SESSION_MS);

      await StudentSession.create({
        regNo: rawReg,
        sessionId,
        deviceId: crypto.randomUUID(),
        deviceInfo: extractRequestDeviceInfo(req),
        loggedInAt: new Date(now),
        lastActiveAt: new Date(now),
        expiresAt,
        isActive: true,
      });

      const studentToken = jwt.sign(
        { regNo: rawReg, sessionId, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "36500d" }
      );

      res.cookie("student_jwt", studentToken, getCookieOptions(req, expiresAt));

      return res.json({
        success: true,
        message: "Authentication successful via OTP recovery.",
        student: {
          regNo: rawReg,
          studentName,
          sessionId,
        },
      });
    }
  } catch (err) {
    console.error("Student verify-otp error:", err);
    res.status(500).json({ success: false, message: "An internal error occurred during OTP verification." });
  }
});

// 4. Student Mandatory Password Creation (/api/auth/student/create-password)
router.post("/student/create-password", authLimiter, async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    const newPassword = String(req.body.password || "");
    const setupToken = String(req.body.setupPasswordToken || req.body.token || "");

    if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
      return res.status(400).json({ success: false, message: "Invalid registration number format." });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
        code: "WEAK_PASSWORD",
      });
    }

    if (!setupToken) {
      return res.status(401).json({
        success: false,
        message: "Password creation authorization token missing. Please verify your OTP again.",
        code: "TOKEN_REQUIRED",
      });
    }

    let decoded = null;
    try {
      decoded = jwt.verify(setupToken, process.env.JWT_SECRET);
      if (decoded.regNo !== rawReg || decoded.purpose !== "SETUP_PASSWORD") {
        throw new Error("Invalid token payload");
      }
    } catch {
      return res.status(401).json({
        success: false,
        message: "Password setup session expired or invalid. Please verify OTP again.",
        code: "INVALID_SETUP_TOKEN",
      });
    }

    let studentAccount = await Student.findOne({ regNo: rawReg });
    if (!studentAccount) {
      studentAccount = new Student({ regNo: rawReg });
    }

    await studentAccount.setPassword(newPassword);
    await studentAccount.save();

    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    const studentName = studentRecord?.studentName || "Student";

    // Atomically create authorized session
    const { newSession } = await replaceStudentSession(StudentSession, rawReg, {
      deviceInfo: extractRequestDeviceInfo(req),
    });

    const studentToken = jwt.sign(
      { regNo: rawReg, sessionId: newSession.sessionId, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "36500d" }
    );

    res.cookie("student_jwt", studentToken, getCookieOptions(req));

    return res.json({
      success: true,
      message: "Password created successfully. You are now securely logged in.",
      student: {
        regNo: rawReg,
        studentName,
        sessionId: newSession.sessionId,
      },
    });
  } catch (err) {
    console.error("Student create-password error:", err);
    res.status(500).json({ success: false, message: "Failed to create password." });
  }
});

// 5. Student Explicit Session Transfer (/api/auth/student/transfer-session)
router.post("/student/transfer-session", authLimiter, async (req, res) => {
  try {
    const rawReg = String(req.body.regNo || "").trim().toUpperCase();
    const candidatePassword = String(req.body.password || "");

    if (!rawReg || !candidatePassword) {
      return res.status(400).json({
        success: false,
        message: "Registration number and password are required.",
        code: "CREDENTIALS_REQUIRED",
      });
    }

    const studentAccount = await Student.findOne({ regNo: rawReg });
    if (!studentAccount || !studentAccount.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
        code: "INVALID_CREDENTIALS",
      });
    }

    const isMatch = await studentAccount.comparePassword(candidatePassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
        code: "INVALID_PASSWORD",
      });
    }

    // Atomically replace all sessions for normal students
    const { newSession, wasReplaced } = await replaceStudentSession(StudentSession, rawReg, {
      deviceInfo: extractRequestDeviceInfo(req),
    });

    studentAccount.failedPasswordAttempts = 0;
    await studentAccount.save();

    const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
    const studentName = studentRecord?.studentName || "Student";

    const studentToken = jwt.sign(
      { regNo: rawReg, sessionId: newSession.sessionId, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "36500d" }
    );

    res.cookie("student_jwt", studentToken, getCookieOptions(req));

    return res.json({
      success: true,
      message: wasReplaced
        ? "Session successfully transferred to this device. Previous session was logged out."
        : "Logged in successfully on this device.",
      student: {
        regNo: rawReg,
        studentName,
        sessionId: newSession.sessionId,
      },
    });
  } catch (err) {
    console.error("Student transfer-session error:", err);
    res.status(500).json({ success: false, message: "Failed to transfer session." });
  }
});

// 6. Current Authenticated Student Session Check (/api/auth/student/me)
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

// 7. Student Logout (/api/auth/student/logout)
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
          await StudentSession.deleteOne({ sessionId: decoded.sessionId });
        }
      } catch {}
    }

    res.clearCookie("student_jwt", getCookieOptions(req, new Date(0)));
    return res.json({ success: true, message: "Logged out successfully from this device." });
  } catch (err) {
    console.error("Student logout error:", err);
    res.status(500).json({ message: "Server error during logout." });
  }
});

// 8. Student Device Approval Status Polling (/api/auth/student/approval-status/:requestId)
router.get("/student/approval-status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    if (!requestId) {
      return res.status(400).json({ success: false, message: "Request ID required." });
    }

    const statusData = await getDeviceApprovalStatus(requestId);
    if (!statusData || !statusData.success) {
      return res.status(404).json(statusData || { success: false, message: "Approval request not found." });
    }

    if (statusData.status === "APPROVED" && statusData.approvedToken) {
      res.cookie("student_jwt", statusData.approvedToken, getCookieOptions(req));
      const studentRecord = await SemesterResult.findOne({ regNo: statusData.regNo }).sort({ semester: -1 });
      return res.json({
        success: true,
        status: "APPROVED",
        message: "Login request approved! Logging you in...",
        student: {
          regNo: statusData.regNo,
          studentName: studentRecord?.studentName || "Student",
          sessionId: statusData.approvedSessionId,
        },
      });
    }

    if (statusData.status === "DENIED") {
      return res.json({
        success: false,
        status: "DENIED",
        message: "Login request was denied from your active device.",
      });
    }

    if (statusData.status === "EXPIRED") {
      return res.json({
        success: false,
        status: "EXPIRED",
        message: "Approval request timed out. Please try again.",
      });
    }

    const remainingSecs = Math.max(0, Math.ceil((new Date(statusData.expiresAt).getTime() - Date.now()) / 1000));
    return res.json({
      success: true,
      status: "PENDING",
      expiresInSeconds: remainingSecs,
    });
  } catch (err) {
    console.error("Approval status check error:", err);
    return res.status(500).json({ success: false, message: "Server error checking approval status." });
  }
});

// 9. Cancel Device Approval Request (/api/auth/student/cancel-approval)
router.post("/student/cancel-approval", async (req, res) => {
  try {
    const { requestId } = req.body || {};
    if (requestId) {
      const DeviceApprovalRequest = require("../models/DeviceApprovalRequest");
      const StudentNotification = require("../models/StudentNotification");
      await DeviceApprovalRequest.updateOne({ requestId, status: "PENDING" }, { $set: { status: "EXPIRED" } });
      await StudentNotification.updateMany({ approvalRequestId: requestId, status: "UNREAD" }, { $set: { status: "EXPIRED" } });
    }
    return res.json({ success: true, message: "Approval request cancelled." });
  } catch (err) {
    console.error("Cancel approval error:", err);
    return res.status(500).json({ success: false, message: "Server error cancelling approval." });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   ADMIN AUTHENTICATION (PASSWORD, OTP & 2-DEVICE LIMIT)
═══════════════════════════════════════════════════════════════════ */

// 0. Admin Status Check (/api/auth/admin/check-status)
router.get("/admin/check-status", async (req, res) => {
  try {
    const activeSessions = await getActiveAdminSessions(AdminSession);

    let incomingToken = req.cookies?.jwt;
    if (!incomingToken && req.headers["x-admin-token"]) {
      incomingToken = req.headers["x-admin-token"];
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    if (incomingToken && incomingToken !== "none") {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.role === "admin" && decoded.sessionId) {
          if (activeSessions.some((s) => s.sessionId === decoded.sessionId)) {
            isCurrentDevice = true;
          }
        }
      } catch {}
    }

    const isBlocked = activeSessions.length >= MAX_ADMIN_DEVICES && !isCurrentDevice;
    const sanitizedDevices = activeSessions.map((s, idx) => ({
      deviceIndex: idx + 1,
      deviceType: s.deviceInfo?.deviceType || "Desktop",
      os: s.deviceInfo?.os || "Windows",
      browser: s.deviceInfo?.browser || "Chrome",
      platform: s.deviceInfo?.platform || `${s.deviceInfo?.os || "Windows"} • ${s.deviceInfo?.browser || "Chrome"}`,
      userAgent: s.deviceInfo?.userAgent || "Standard Browser",
      loggedInAt: s.loggedInAt,
      lastActiveAt: s.lastActiveAt,
      status: "ACTIVE",
    }));

    return res.json({
      success: true,
      isCurrentDevice,
      activeDeviceCount: activeSessions.length,
      maxAllowedDevices: MAX_ADMIN_DEVICES,
      isBlocked,
      otpAllowed: !isBlocked,
      loginAllowed: !isBlocked,
      blockReason: isBlocked ? "ADMIN_DEVICE_LIMIT_REACHED" : null,
      activeDevices: sanitizedDevices,
    });
  } catch (err) {
    console.error("Admin status check error:", err);
    return res.status(500).json({ message: "Server error checking admin status." });
  }
});

// 1. Admin Password Login -> Trigger OTP
const handleAdminPasswordLogin = async (req, res) => {
  try {
    let adminEmail = process.env.ADMIN_EMAIL;
    let adminPassword = process.env.ADMIN_PASSWORD;

    let adminDoc = null;
    if (!adminEmail || !adminPassword) {
      adminDoc = await Admin.findOne().sort({ createdAt: -1 });
      if (adminDoc && !adminEmail) {
        adminEmail = adminDoc.email;
      }
    } else {
      adminDoc = await Admin.findOne({ email: adminEmail });
    }

    const candidatePassword = String(req.body.password || "");
    if (!candidatePassword) {
      return res.status(400).json({
        message: "Please enter your administrative password.",
        code: "PASSWORD_REQUIRED",
      });
    }

    let isPasswordCorrect = false;
    if (adminPassword) {
      const candidateBuf = Buffer.from(candidatePassword, "utf8");
      const adminPassBuf = Buffer.from(adminPassword, "utf8");
      if (candidateBuf.length === adminPassBuf.length) {
        isPasswordCorrect = crypto.timingSafeEqual(candidateBuf, adminPassBuf);
      }
    }

    if (!isPasswordCorrect && adminDoc && typeof adminDoc.comparePassword === "function") {
      isPasswordCorrect = await adminDoc.comparePassword(candidatePassword);
    }

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid password. Access denied.",
        code: "INVALID_PASSWORD",
      });
    }

    // Password verified! Check active admin devices (Max 2)
    const activeSessions = await getActiveAdminSessions(AdminSession);

    let incomingToken = req.cookies?.jwt;
    if (!incomingToken && req.headers["x-admin-token"]) {
      incomingToken = req.headers["x-admin-token"];
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
              authenticated: true,
              role: "admin",
              adminType: "main",
              message: "Admin is already authenticated on this device.",
            });
          }
        }
      } catch {}
    }

    // Generate secure 6-digit OTP code
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await AdminOtpVerification.deleteMany({});
    await AdminOtpVerification.create({
      otpHash,
      expiresAt,
      attempts: 0,
    });

    const recipientEmail = adminEmail || adminDoc?.email;
    try {
      await sendAdminOtpEmail({
        to: recipientEmail,
        otp,
        expiresInMinutes: 5,
      });
    } catch (emailErr) {
      console.error("Admin OTP email dispatch error:", emailErr.message);
      return res.status(500).json({
        message: "Failed to dispatch verification code to administrative email. Please try again.",
        code: "EMAIL_DISPATCH_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      step: "OTP_REQUIRED",
      expiresInSeconds: 300,
      message: "A 6-digit verification code has been dispatched to the authorized administrator email.",
    });
  } catch (err) {
    console.error("Admin login password error:", err);
    return res.status(500).json({ message: "Server error during administrative authentication." });
  }
};

router.post("/admin/login-password", handleAdminPasswordLogin);
router.post("/login", handleAdminPasswordLogin);

// 2. Admin Verify OTP & Establish Permanent Device Session (/api/auth/admin/verify-otp)
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
        message: "Maximum verification attempts exceeded. Please restart authentication.",
        code: "MAX_ATTEMPTS_EXCEEDED",
      });
    }

    const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        message: `Invalid verification code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        code: "INVALID_OTP",
        remainingAttempts: remaining,
      });
    }

    await AdminOtpVerification.deleteMany({});

    const activeSessions = await getActiveAdminSessions(AdminSession);
    if (activeSessions.length >= MAX_ADMIN_DEVICES) {
      return res.status(403).json({
        message: `Admin device limit reached (${MAX_ADMIN_DEVICES} devices active). Please log out from another device.`,
        code: "ADMIN_DEVICE_LIMIT_REACHED",
      });
    }

    const activeSessions = await getActiveAdminSessions(AdminSession);
    if (activeSessions.length >= MAX_ADMIN_DEVICES) {
      const sessionsToRevoke = activeSessions.slice(MAX_ADMIN_DEVICES - 1);
      const revokeIds = sessionsToRevoke.map((s) => s.sessionId);
      await AdminSession.deleteMany({ sessionId: { $in: revokeIds } });
    }

    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);

    await AdminSession.create({
      sessionId,
      deviceId: crypto.randomUUID(),
      deviceInfo: extractRequestDeviceInfo(req),
      loggedInAt: now,
      lastActiveAt: now,
      expiresAt,
      isActive: true,
    });

    const token = jwt.sign(
      { role: "admin", sessionId, loggedInAt: now },
      process.env.JWT_SECRET,
      { expiresIn: "36500d" }
    );

    res.cookie("jwt", token, getCookieOptions(req, expiresAt));

    return res.json({
      success: true,
      authenticated: true,
      role: "admin",
      adminType: "main",
      message: "Admin authenticated successfully.",
    });
  } catch (err) {
    console.error("Admin OTP verify error:", err);
    return res.status(500).json({ message: "Server error during OTP verification." });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   SUB-ADMIN AUTHENTICATION (2-DEVICE LIMIT)
═══════════════════════════════════════════════════════════════════ */

// 3. Sub-Admin Login Endpoint (/api/auth/subadmin/login)
router.post("/subadmin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const candidatePassword = String(password || "");

    if (!candidatePassword) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
        code: "CREDENTIALS_REQUIRED",
      });
    }

    let subAdmin = null;
    if (cleanEmail) {
      subAdmin = await SubAdmin.findOne({ email: cleanEmail });
      if (!subAdmin) {
        return res.status(401).json({
          success: false,
          message: "Invalid Sub-Admin credentials.",
          code: "INVALID_CREDENTIALS",
        });
      }
      const isMatch = await subAdmin.comparePassword(candidatePassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid Sub-Admin password.",
          code: "INVALID_CREDENTIALS",
        });
      }
    } else {
      const activeSubAdmins = await SubAdmin.find({ status: "active" });
      for (const sa of activeSubAdmins) {
        const isMatch = await sa.comparePassword(candidatePassword);
        if (isMatch) {
          subAdmin = sa;
          break;
        }
      }
      if (!subAdmin) {
        return res.status(401).json({
          success: false,
          message: "The Sub-Admin password entered does not match institutional records.",
          code: "INVALID_CREDENTIALS",
        });
      }
    }

    if (subAdmin.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Your Sub-Admin account is currently ${subAdmin.status}. Please contact the Main Administrator.`,
        code: `SUBADMIN_${subAdmin.status.toUpperCase()}`,
      });
    }

    // Sub-Admin 2-Device Limit Check (Prompt Section 7)
    const activeSessions = await getActiveSubAdminSessions(SubAdminSession, subAdmin._id);

    let incomingToken = req.cookies?.jwt;
    if (!incomingToken && req.headers["x-admin-token"]) {
      incomingToken = req.headers["x-admin-token"];
    }
    if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      incomingToken = req.headers.authorization.split(" ")[1];
    }

    let isCurrentDevice = false;
    if (incomingToken && incomingToken !== "none") {
      try {
        const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
        if (decoded.adminType === "subadmin" && decoded.sessionId) {
          const matching = activeSessions.find((s) => s.sessionId === decoded.sessionId);
          if (matching && matching.isActive) {
            isCurrentDevice = true;
            return res.json({
              success: true,
              alreadyLoggedIn: true,
              authenticated: true,
              adminType: "subadmin",
              name: subAdmin.name,
              email: subAdmin.email,
              permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
              message: "Sub-Admin is already authenticated on this device.",
            });
          }
        }
      } catch {}
    }

    if (activeSessions.length >= MAX_SUBADMIN_DEVICES && !isCurrentDevice) {
      const sanitizedDevices = activeSessions.map((s, idx) => ({
        deviceIndex: idx + 1,
        platform: s.deviceInfo?.platform || "Unknown",
        userAgent: s.deviceInfo?.userAgent || "Unknown",
        loggedInAt: s.loggedInAt,
        lastActiveAt: s.lastActiveAt,
        status: "ACTIVE",
      }));
      return res.status(403).json({
        success: false,
        message: `Sub-Admin portal is currently active on ${activeSessions.length} devices (maximum limit: ${MAX_SUBADMIN_DEVICES}). Please log out from another device before logging in here.`,
        code: "SUBADMIN_DEVICE_LIMIT_REACHED",
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices: MAX_SUBADMIN_DEVICES,
        activeDevices: sanitizedDevices,
      });
    }

    // Generate secure 6-digit OTP code
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await SubAdminOtpVerification.deleteMany({ email: subAdmin.email });
    await SubAdminOtpVerification.create({
      email: subAdmin.email,
      otpHash,
      expiresAt,
      attempts: 0,
    });

    try {
      await sendSubAdminOtpEmail({
        to: subAdmin.email,
        name: subAdmin.name,
        otp,
        expiresInMinutes: 5,
      });
    } catch (emailErr) {
      console.error("Sub-Admin OTP email dispatch error:", emailErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to dispatch verification code to Sub-Admin email.",
        code: "EMAIL_DISPATCH_FAILED",
      });
    }

    return res.json({
      success: true,
      step: "OTP_REQUIRED",
      email: subAdmin.email,
      maskedEmail: maskEmail(subAdmin.email),
      name: subAdmin.name,
      expiresInSeconds: 300,
      message: `A 6-digit verification code has been dispatched to ${maskEmail(subAdmin.email)}.`,
    });
  } catch (err) {
    console.error("SubAdmin login error:", err);
    return res.status(500).json({ success: false, message: "Server error during sub-admin login." });
  }
});

// 3B. Sub-Admin Verify OTP Endpoint (/api/auth/subadmin/verify-otp)
router.post("/subadmin/verify-otp", async (req, res) => {
  try {
    const cleanEmail = String(req.body.email || "").trim().toLowerCase();
    const rawOtp = String(req.body.otp || "").trim();

    if (!cleanEmail || !rawOtp || rawOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Please provide your registered Sub-Admin email and 6-digit verification code.",
        code: "INVALID_FORMAT",
      });
    }

    const subAdmin = await SubAdmin.findOne({ email: cleanEmail });
    if (!subAdmin || subAdmin.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Sub-Admin account not found or inactive.",
        code: "SUBADMIN_INACTIVE",
      });
    }

    const otpRecord = await SubAdminOtpVerification.findOne({
      email: cleanEmail,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or is invalid. Please request a new code.",
        code: "OTP_EXPIRED",
      });
    }

    if (otpRecord.attempts >= 5) {
      await SubAdminOtpVerification.deleteMany({ email: cleanEmail });
      return res.status(429).json({
        success: false,
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
        success: false,
        message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
        code: "INVALID_OTP",
        remainingAttempts: remaining,
      });
    }

    await SubAdminOtpVerification.deleteMany({ email: cleanEmail });

    const activeSessions = await getActiveSubAdminSessions(SubAdminSession, subAdmin._id);
    if (activeSessions.length >= MAX_SUBADMIN_DEVICES) {
      const sessionsToRevoke = activeSessions.slice(MAX_SUBADMIN_DEVICES - 1);
      const revokeIds = sessionsToRevoke.map((s) => s.sessionId);
      await SubAdminSession.deleteMany({ sessionId: { $in: revokeIds } });
    }

    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);

    await SubAdminSession.create({
      subAdminId: subAdmin._id,
      sessionId,
      deviceId: crypto.randomUUID(),
      deviceInfo: extractRequestDeviceInfo(req),
      loggedInAt: now,
      lastActiveAt: now,
      expiresAt,
      isActive: true,
    });

    subAdmin.lastLoginAt = now;
    subAdmin.lastActiveAt = now;
    await subAdmin.save();

    const token = jwt.sign(
      {
        role: "admin",
        adminType: "subadmin",
        subAdminId: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        sessionId,
        loggedInAt: now,
      },
      process.env.JWT_SECRET,
      { expiresIn: "36500d" }
    );

    res.cookie("jwt", token, getCookieOptions(req, expiresAt));

    return res.json({
      success: true,
      authenticated: true,
      role: "admin",
      adminType: "subadmin",
      name: subAdmin.name,
      email: subAdmin.email,
      permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
      message: "Sub-Admin authenticated successfully.",
    });
  } catch (err) {
    console.error("Sub-Admin OTP verify error:", err);
    return res.status(500).json({ message: "Server error during Sub-Admin OTP verification." });
  }
});

// 4. Admin Current Session Check (/api/auth/me or /api/auth/admin/me)
const handleAdminMe = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    let token = req.cookies?.jwt;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (!token && req.headers["x-admin-token"]) {
      token = req.headers["x-admin-token"];
    }

    if (!token || token === "none" || token === "") {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student") {
      return res.status(403).json({ message: "Forbidden: Admin privileges required" });
    }

    if (decoded.adminType === "subadmin") {
      if (decoded.sessionId) {
        const session = await SubAdminSession.findOne({
          sessionId: decoded.sessionId,
          isActive: true,
        });

        if (!session) {
          return res.status(401).json({
            success: false,
            code: "ADMIN_SESSION_TERMINATED",
            message: "Sub-Admin session ended because this device was logged out.",
          });
        }

        session.lastActiveAt = new Date();
        await session.save();
      }

      const subAdmin = await SubAdmin.findById(decoded.subAdminId);
      if (!subAdmin || subAdmin.status !== "active") {
        return res.status(403).json({
          success: false,
          code: "SUBADMIN_INACTIVE",
          message: "Sub-Admin account is inactive or revoked.",
        });
      }

      return res.json({
        success: true,
        authenticated: true,
        role: "admin",
        adminType: "subadmin",
        subAdminId: subAdmin._id,
        name: subAdmin.name,
        email: subAdmin.email,
        permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
      });
    }

    // Main Admin Validation
    if (decoded.sessionId) {
      const session = await AdminSession.findOne({
        sessionId: decoded.sessionId,
        isActive: true,
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          code: "ADMIN_SESSION_TERMINATED",
          message: "Admin session ended because this device was logged out.",
        });
      }

      await touchAdminSession(session);
    }

    return res.json({
      success: true,
      authenticated: true,
      role: "admin",
      adminType: "main",
      name: "Main Administrator",
      email: decoded.email || process.env.ADMIN_EMAIL,
      permissions: { routes: ["*"], sections: ["*"], actions: ["*"] },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

router.get("/me", handleAdminMe);
router.get("/admin/me", handleAdminMe);

// 5. Admin Logout (/api/auth/logout or /api/auth/admin/logout)
const handleAdminLogout = async (req, res) => {
  try {
    let token = req.cookies?.jwt;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (!token && req.headers["x-admin-token"]) {
      token = req.headers["x-admin-token"];
    }

    if (token && token !== "none") {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (decoded?.sessionId) {
          if (decoded.adminType === "subadmin") {
            await SubAdminSession.deleteOne({ sessionId: decoded.sessionId });
          } else {
            await AdminSession.deleteOne({ sessionId: decoded.sessionId });
          }
        }
      } catch {}
    }

    res.clearCookie("jwt", getCookieOptions(req, new Date(0)));
    return res.status(200).json({ success: true, message: "Logged out successfully from this device." });
  } catch (err) {
    console.error("Admin logout error:", err);
    return res.status(500).json({ message: "Server error during logout." });
  }
};

router.post("/logout", handleAdminLogout);
router.post("/admin/logout", handleAdminLogout);

module.exports = router;
