const connectToDatabase = require("./_lib/db");
const Admin = require("./_lib/models/Admin");
const AdminSession = require("./_lib/models/AdminSession");
const AdminOtpVerification = require("./_lib/models/AdminOtpVerification");
const SubAdmin = require("./_lib/models/SubAdmin");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const SubAdminOtpVerification = require("./_lib/models/SubAdminOtpVerification");
const SemesterResult = require("./_lib/models/SemesterResult");
const OtpVerification = require("./_lib/models/OtpVerification");
const Student = require("./_lib/models/Student");
const StudentSession = require("./_lib/models/StudentSession");
const StudentDailyLimit = require("./_lib/models/StudentDailyLimit");
const OtpRequestLog = require("./_lib/models/OtpRequestLog");
const DeviceApprovalRequest = require("./_lib/models/DeviceApprovalRequest");
const StudentNotification = require("./_lib/models/StudentNotification");
const SystemConfig = require("./_lib/models/SystemConfig");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { sendStudentOtpEmail, sendAdminOtpEmail, sendSubAdminOtpEmail } = require("./_lib/emailProviderManager");
const { globalDbQueue } = require("./_lib/dbProtection");
const {
  PERMANENT_SESSION_MS,
  MAX_ADMIN_DEVICES,
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getActiveSessions,
  isSessionValid,
  touchSession,
  replaceStudentSession,
  createDeviceApprovalRequest,
  respondDeviceApproval,
  getDeviceApprovalStatus,
  cleanExpiredAdminSessions,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
  MAX_SUBADMIN_DEVICES,
  cleanExpiredSubAdminSessions,
  getActiveSubAdminSessions,
} = require("./_lib/sessionManager");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-student-token, x-admin-token",
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    if (name) cookies[name] = decodeURIComponent(val);
  });
  return cookies;
}

function setStudentCookie(res, token, customMaxAge = null) {
  const maxAge = customMaxAge !== null ? customMaxAge : 100 * 365 * 24 * 60 * 60;
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const secureFlag = isProd ? " Secure;" : "";
  res.setHeader(
    "Set-Cookie",
    `student_jwt=${token}; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearStudentCookie(res) {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const secureFlag = isProd ? " Secure;" : "";
  res.setHeader(
    "Set-Cookie",
    `student_jwt=; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

function setAdminCookie(res, token) {
  const maxAge = 100 * 365 * 24 * 60 * 60;
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const secureFlag = isProd ? " Secure;" : "";
  res.setHeader(
    "Set-Cookie",
    `jwt=${token}; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=${maxAge}`
  );
}

function clearAdminCookie(res) {
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const secureFlag = isProd ? " Secure;" : "";
  res.setHeader(
    "Set-Cookie",
    `jwt=; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

function extractRequestDeviceInfo(req) {
  const userAgent = String(req.headers["user-agent"] || "");
  const ip = String(
    req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      ""
  )
    .split(",")[0]
    .trim();

  let deviceType = "Desktop";
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(userAgent)) {
    deviceType = "Mobile";
  } else if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) {
    deviceType = "Tablet";
  }

  let os = "Desktop";
  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone/i.test(userAgent)) os = "iOS (iPhone)";
  else if (/ipad/i.test(userAgent)) os = "iPadOS";
  else if (/linux/i.test(userAgent)) os = "Linux";

  let browser = "Web Browser";
  if (/edg/i.test(userAgent)) browser = "Edge";
  else if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browser = "Safari";
  else if (/opera|opr/i.test(userAgent)) browser = "Opera";

  const platform = `${os} / ${browser}`;

  return {
    deviceType,
    os,
    browser,
    platform,
    ip,
    userAgent: userAgent.slice(0, 150),
  };
}

function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS environment variables are missing.");
  }

  const host = process.env.EMAIL_HOST || (process.env.EMAIL_SERVICE ? null : "smtp-relay.brevo.com");
  const port = Number(process.env.EMAIL_PORT) || 587;
  const secure = port === 465;
  const service = host ? null : process.env.EMAIL_SERVICE || "gmail";

  const config = service
    ? { service, auth: { user: emailUser, pass: emailPass } }
    : {
        host,
        port,
        secure,
        auth: { user: emailUser, pass: emailPass },
        tls: { rejectUnauthorized: false },
      };

  return nodemailer.createTransport({
    ...config,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

function getIstDateKey() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istDate = new Date(utcTime + istOffset);
  return istDate.toISOString().slice(0, 10);
}

function getTimeUntilIstMidnight() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istDate = new Date(utcTime + istOffset);

  const midnight = new Date(istDate);
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - istDate.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  return { hours, mins, totalSeconds };
}

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectToDatabase();
    let action = req.query?.action;
    if (!action && req.url) {
      const cleanUrl = req.url.split("?")[0];
      if (cleanUrl.includes("student/send-otp")) action = "student-send-otp";
      else if (cleanUrl.includes("student/verify-otp")) action = "student-verify-otp";
      else if (cleanUrl.includes("student/check-status")) action = "student-check-status";
      else if (cleanUrl.includes("student/create-password")) action = "student-create-password";
      else if (cleanUrl.includes("student/login-password")) action = "student-login-password";
      else if (cleanUrl.includes("student/transfer-session")) action = "student-transfer-session";
      else if (cleanUrl.includes("student/approval-status")) action = "student-approval-status";
      else if (cleanUrl.includes("student/cancel-approval")) action = "student-cancel-approval";
      else if (cleanUrl.includes("student/me")) action = "student-me";
      else if (cleanUrl.includes("student/logout")) action = "student-logout";
      else if (cleanUrl.includes("subadmin/verify-otp")) action = "subadmin-verify-otp";
      else if (cleanUrl.includes("subadmin/login")) action = "subadmin-login";
      else if (cleanUrl.includes("admin/login-password") || cleanUrl.endsWith("/login")) action = "admin-login-password";
      else if (cleanUrl.includes("admin/verify-otp")) action = "admin-verify-otp";
      else if (cleanUrl.includes("admin/check-status")) action = "admin-check-status";
      else if (cleanUrl.includes("admin/me") || cleanUrl.endsWith("/me")) action = "admin-me";
      else if (cleanUrl.includes("admin/logout") || cleanUrl.endsWith("/logout")) action = "admin-logout";
    }
    const cookies = parseCookies(req.headers.cookie);

    /* ═══════════════════════════════════════════════════════════════════
       0. STUDENT LIVE STATUS & DEVICE LIMIT PRE-CHECK
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-check-status" || action === "check-status") && req.method === "GET") {
      const rawReg = String(req.query.regNo || "").trim().toUpperCase();
      if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
        return res.status(400).json({ success: false, message: "Valid registration number required (5-20 alphanumeric characters)." });
      }

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      if (!studentRecord) {
        return res.json({ success: true, exists: false });
      }

      const studentAccount = await Student.findOne({ regNo: rawReg });
      const hasPassword = Boolean(studentAccount && studentAccount.passwordHash);
      const failedPasswordAttempts = studentAccount ? studentAccount.failedPasswordAttempts || 0 : 0;
      const isLocked = Boolean(studentAccount?.lockedUntil && new Date() < new Date(studentAccount.lockedUntil));

      const maxAllowedDevices = getMaxAllowedDevices(rawReg);
      const activeSessions = await getActiveSessions(StudentSession, rawReg);

      let incomingToken = req.headers["x-student-token"];
      if (!incomingToken && cookies.student_jwt && cookies.student_jwt !== "none") {
        incomingToken = cookies.student_jwt;
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

      const dateKey = getIstDateKey();
      const dailyLimit = await StudentDailyLimit.findOne({ regNo: rawReg, dateKey });
      const isUnlimited = rawReg === "230301120327";
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

      let isBlocked = false;
      let blockReason = null;
      let blockMessage = null;
      let otpFallbackAllowed = failedPasswordAttempts >= 2 || isLocked;

      if (hasPassword) {
        if (failedPasswordAttempts >= 2) {
          if (maxAllowedDevices === 1 && activeSessions.length >= 1 && !isCurrentDevice) {
            // Another device is active and user failed 2 password attempts -> OTP bypass blocked to prevent takeover
            isBlocked = true;
            blockReason = "PASSWORD_FAILED_DEVICE_ACTIVE";
            blockMessage = `Maximum password attempts exceeded (2/2). Registration number ${rawReg} is currently logged in on another device. Single-device security policy: OTP recovery is blocked while your authorized device slot is occupied.`;
          } else if (maxAllowedDevices > 1 && activeSessions.length >= maxAllowedDevices && !isCurrentDevice) {
            isBlocked = true;
            blockReason = "DEVICE_LIMIT_REACHED";
            blockMessage = `Account ${rawReg} has reached the maximum allowed active devices (${maxAllowedDevices}). Please log out from another device.`;
          } else {
            // 0 devices active -> allow OTP recovery
            otpFallbackAllowed = true;
          }
        } else {
          // Normal password login flow:
          // For Normal Students (maxAllowedDevices === 1): Having 1 active device is NOT blocked on check-status!
          // They proceed to enter password, and correct password creates in-app DeviceApprovalRequest.
          // For Multi-Device (230301120327, maxAllowedDevices === 2): Block ONLY when activeSessions >= 2 and not current device.
          if (maxAllowedDevices > 1 && activeSessions.length >= maxAllowedDevices && !isCurrentDevice) {
            isBlocked = true;
            blockReason = "DEVICE_LIMIT_REACHED";
            blockMessage = `Account ${rawReg} is already actively logged in on ${maxAllowedDevices} devices (maximum ${maxAllowedDevices} allowed). Please log out from one device before signing in on a new device.`;
          }
        }
      } else {
        // Brand new student (no password created yet) -> Needs OTP verification to create password
        if (activeSessions.length >= maxAllowedDevices && !isCurrentDevice) {
          isBlocked = true;
          blockReason = "DEVICE_LIMIT_REACHED";
          blockMessage = `Registration number ${rawReg} is already logged in on an active device. Please log out from that device first.`;
        } else if (isDailyLimitReached) {
          isBlocked = true;
          blockReason = "DAILY_LIMIT_EXCEEDED";
          blockMessage = `Daily OTP limit reached (${currentDailyCount}/${maxDailyLimit} attempts used). Login for ${rawReg} is locked for today. It will automatically reset at midnight.`;
        } else if (isCooldownActive) {
          blockReason = "OTP_COOLDOWN_ACTIVE";
          blockMessage = `Please wait ${cooldownRemainingSeconds} seconds before requesting another verification code.`;
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
        expiresAt: s.expiresAt,
        status: "ACTIVE",
      }));

      return res.json({
        success: true,
        exists: true,
        studentName: studentRecord.studentName || "Student",
        hasPassword,
        failedPasswordAttempts,
        isCurrentDevice,
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices,
        isBlocked,
        blockReason,
        blockMessage,
        otpFallbackAllowed,
        isDailyLimitReached,
        isCooldownActive,
        cooldownRemainingSeconds,
        remainingDailyAttempts,
        attemptsUsedToday: currentDailyCount,
        maxDailyAttempts: maxDailyLimit,
        sessions: sessionDetails,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       1. STUDENT SEND OTP
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-send-otp" || action === "send-otp") && req.method === "POST") {
      const rawReg = String(req.body.regNo || "").trim().toUpperCase();
      if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
        return res.status(400).json({ success: false, message: "Invalid registration number format. Must be 5-20 alphanumeric characters." });
      }

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      if (!studentRecord) {
        return res.status(404).json({
          message: "No student records found for this registration number. Please check and try again.",
        });
      }

      const studentName = studentRecord.studentName || "Student";
      const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;

      let studentAccount = await Student.findOne({ regNo: rawReg });
      const hasPassword = Boolean(studentAccount && studentAccount.passwordHash);
      const failedPasswordAttempts = studentAccount ? studentAccount.failedPasswordAttempts || 0 : 0;
      const isLocked = Boolean(studentAccount?.lockedUntil && new Date() < new Date(studentAccount.lockedUntil));

      const maxAllowedDevices = getMaxAllowedDevices(rawReg);
      const isUnlimited = rawReg === "230301120327";
      const activeSessions = await getActiveSessions(StudentSession, rawReg);

      // Check alreadyLoggedIn ONLY if student already has a password
      let incomingToken = req.headers["x-student-token"];
      if (!incomingToken && cookies.student_jwt && cookies.student_jwt !== "none") {
        incomingToken = cookies.student_jwt;
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

      // Existing student password enforcement
      if (hasPassword && failedPasswordAttempts < 2 && !isLocked && !req.body.forceOtp && !req.body.isForgotPassword) {
        return res.status(400).json({
          success: false,
          code: "PASSWORD_LOGIN_REQUIRED",
          message: "This account is protected by a password. Please sign in with your password.",
          hasPassword: true,
        });
      }

      // Device Limit Check
      if (activeSessions.length >= maxAllowedDevices) {
        const sanitizedDevices = activeSessions.map((s, idx) => ({
          deviceIndex: idx + 1,
          platform: s.deviceInfo?.platform || "Unknown",
          userAgent: s.deviceInfo?.userAgent || "Unknown",
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          status: "ACTIVE",
        }));

        await OtpRequestLog.create({
          regNo: rawReg,
          studentName,
          dateKey: getIstDateKey(),
          status: "BLOCKED",
          deliveryStatus: "NOT_SENT",
          provider: "NONE",
          reason: rawReg === "230301120327" ? `Blocked: Maximum 2 devices already active` : `Blocked: Single active device limit reached`,
          deviceInfo: extractRequestDeviceInfo(req),
        }).catch(() => {});

        return res.status(403).json({
          success: false,
          code: "DEVICE_LIMIT_REACHED",
          message: rawReg === "230301120327"
            ? `Account 230301120327 is already active on ${activeSessions.length} devices (maximum limit: 2). Please log out from one device before logging in on a new device.`
            : `Registration number ${rawReg} is already logged in on an active device (maximum limit: 1). Single-device security policy is active. Please log out from your other device before signing in here.`,
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices,
          isBlocked: true,
          activeDevices: sanitizedDevices,
        });
      }

      // Daily Limit & Cooldown Check
      const dateKey = getIstDateKey();
      let dailyLimit = await globalDbQueue.run(() => StudentDailyLimit.findOne({ regNo: rawReg, dateKey }));
      if (!dailyLimit) {
        dailyLimit = new StudentDailyLimit({ regNo: rawReg, dateKey, otpSendCount: 0, lastOtpSentAt: null });
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

      const maxDailyLimit = isUnlimited ? 999 : 3;
      if (!isUnlimited && dailyLimit.otpSendCount >= maxDailyLimit) {
        const { hours, mins, totalSeconds } = getTimeUntilIstMidnight();
        return res.status(429).json({
          message: `Daily OTP limit reached (maximum ${maxDailyLimit} requests per calendar day). Login for ${rawReg} is locked for today. It will automatically reset at 12:00 AM midnight (in ${hours}h ${mins}m).`,
          code: "DAILY_LIMIT_EXCEEDED",
          remainingSeconds: totalSeconds,
        });
      }

      // Generate 6-Digit Cryptographically Secure OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpSalt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otpCode, otpSalt);

      await globalDbQueue.run(() => OtpVerification.deleteMany({ regNo: rawReg }));
      const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

      await globalDbQueue.run(() =>
        OtpVerification.create({
          regNo: rawReg,
          email: studentEmail,
          otpHash,
          expiresAt,
          attempts: 0,
        })
      );

      try {
        const emailResult = await sendStudentOtpEmail({
          to: studentEmail,
          studentName,
          regNo: rawReg,
          otp: otpCode,
          expiresInMinutes: 3,
        });

        dailyLimit.otpSendCount += 1;
        dailyLimit.lastOtpSentAt = new Date();
        await globalDbQueue.run(() => dailyLimit.save());

        const isFallback = emailResult.provider === "gmail_fallback";
        await OtpRequestLog.create({
          regNo: rawReg,
          studentName,
          dateKey,
          status: "DELIVERED",
          deliveryStatus: "DELIVERED",
          provider: isFallback ? "GMAIL" : "BREVO",
          failoverOccurred: isFallback,
          deviceInfo: extractRequestDeviceInfo(req),
        }).catch(() => {});
      } catch (emailErr) {
        await globalDbQueue.run(() => OtpVerification.deleteMany({ regNo: rawReg })).catch(() => {});
        return res.status(503).json({
          message: "OTP delivery is temporarily unavailable. Please try again in a few moments.",
          code: "OTP_DELIVERY_UNAVAILABLE",
        });
      }

      const maskedEmail = `${studentEmail.slice(0, 4)}***@${studentEmail.split("@")[1]}`;
      return res.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${studentEmail}.`,
        maskedEmail,
        studentName,
        regNo: rawReg,
        hasPassword,
        expiresInSeconds: 180,
        cooldownSeconds: 180,
        attemptsUsedToday: dailyLimit.otpSendCount,
        maxDailyAttempts: maxDailyLimit,
        remainingDailyAttempts: isUnlimited ? 99 : Math.max(0, maxDailyLimit - dailyLimit.otpSendCount),
        isUnlimited,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       2. STUDENT VERIFY OTP — MANDATORY CREATE_PASSWORD FOR NEW STUDENTS
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-verify-otp" || action === "verify-otp") && req.method === "POST") {
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
          message: "No active verification code found or code has expired. Please request a new code.",
          code: "OTP_EXPIRED",
        });
      }

      if (new Date() > new Date(otpRecord.expiresAt)) {
        await OtpVerification.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({
          message: "The verification code has expired (validity is 3 minutes). Please request a new code.",
          code: "OTP_EXPIRED",
        });
      }

      if (otpRecord.attempts >= 5) {
        await OtpVerification.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({
          message: "Too many failed attempts. This code has been invalidated for security. Please request a new code.",
          code: "MAX_ATTEMPTS_EXCEEDED",
        });
      }

      const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
      if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remainingAttempts = Math.max(0, 5 - otpRecord.attempts);
        return res.status(400).json({
          message: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
          code: "INVALID_OTP",
          remainingAttempts,
        });
      }

      // Valid OTP: delete OTP record immediately
      await OtpVerification.deleteOne({ _id: otpRecord._id });

      let studentAccount = await Student.findOne({ regNo: rawReg });
      if (!studentAccount) {
        studentAccount = await Student.create({ regNo: rawReg });
      }

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      const studentName = studentRecord?.studentName || "Student";

      // ── CRITICAL MANDATORY RULE: If account has NO password, return CREATE_PASSWORD token ──
      // OTP verification MUST NEVER directly create a session or issue an authenticated cookie!
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

      // ── EXISTING STUDENT OTP RECOVERY LOGIN ──
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

        setStudentCookie(res, studentToken);

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

        setStudentCookie(res, studentToken);

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
    }

    /* ═══════════════════════════════════════════════════════════════════
       3. STUDENT CREATE PASSWORD
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-create-password" || action === "create-password") && req.method === "POST") {
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

      setStudentCookie(res, studentToken);

      return res.json({
        success: true,
        message: "Password created successfully. You are now securely logged in.",
        student: {
          regNo: rawReg,
          studentName,
          sessionId: newSession.sessionId,
        },
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       4. STUDENT PASSWORD LOGIN (WITH IN-APP DEVICE APPROVAL FLOW)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-login-password" || action === "login-password") && req.method === "POST") {
      const rawReg = String(req.body.regNo || "").trim().toUpperCase();
      const candidatePassword = String(req.body.password || "");

      if (!rawReg || !/^[a-zA-Z0-9]{5,20}$/.test(rawReg)) {
        return res.status(400).json({ success: false, message: "Invalid registration number format.", code: "INVALID_REGNO" });
      }

      if (!candidatePassword) {
        return res.status(400).json({ success: false, message: "Password is required.", code: "PASSWORD_REQUIRED" });
      }

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      if (!studentRecord) {
        return res.status(404).json({ success: false, message: "No student records found.", code: "STUDENT_NOT_FOUND" });
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

      const isPasswordCorrect = await studentAccount.comparePassword(candidatePassword);

      if (isPasswordCorrect) {
        studentAccount.failedPasswordAttempts = 0;
        studentAccount.lastFailedPasswordAt = null;
        studentAccount.lockedUntil = null;
        await studentAccount.save();

        let incomingToken = req.headers["x-student-token"] || cookies.student_jwt;
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
              if (matchedSession) isCurrentDevice = true;
            }
          } catch {}
        }

        if (isCurrentDevice && matchedSession) {
          await touchSession(matchedSession);
          return res.json({
            success: true,
            message: "Login successful.",
            alreadyLoggedIn: true,
            student: { regNo: rawReg, studentName, sessionId: matchedSession.sessionId },
          });
        }

        // New Device Login Logic:
        if (maxAllowedDevices === 1) {
          if (activeSessions.length === 0) {
            const { newSession } = await replaceStudentSession(StudentSession, rawReg, {
              deviceInfo: extractRequestDeviceInfo(req),
            });
            const studentToken = jwt.sign(
              { regNo: rawReg, sessionId: newSession.sessionId, role: "student" },
              process.env.JWT_SECRET,
              { expiresIn: "36500d" }
            );
            setStudentCookie(res, studentToken);
            return res.json({
              success: true,
              message: "Login successful.",
              student: { regNo: rawReg, studentName, sessionId: newSession.sessionId },
            });
          }

          // Single device student with 1 active device -> IN-APP APPROVAL FLOW!
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
            student: { regNo: rawReg, studentName },
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
          // 2-Device Account (230301120327)
          if (activeSessions.length >= maxAllowedDevices) {
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
              code: "DEVICE_LIMIT_REACHED",
              message: `Account ${rawReg} is currently active on ${activeSessions.length} devices (maximum limit: ${maxAllowedDevices}). Please log out from another device before logging in on a new device.`,
              activeDeviceCount: activeSessions.length,
              maxAllowedDevices,
              activeDevices: sanitizedDevices,
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

          setStudentCookie(res, studentToken);

          return res.json({
            success: true,
            message: "Login successful.",
            student: { regNo: rawReg, studentName, sessionId },
          });
        }
      }

      // IF PASSWORD INCORRECT:
      studentAccount.failedPasswordAttempts = (studentAccount.failedPasswordAttempts || 0) + 1;
      studentAccount.lastFailedPasswordAt = new Date();
      await studentAccount.save();

      const remainingAttempts = Math.max(0, 2 - studentAccount.failedPasswordAttempts);

      if (studentAccount.failedPasswordAttempts >= 2) {
        return res.status(401).json({
          success: false,
          code: "PASSWORD_ATTEMPTS_EXCEEDED",
          message: "Incorrect password. 2 consecutive attempts failed. You can sign in using OTP verification.",
          failedAttempts: studentAccount.failedPasswordAttempts,
          otpFallbackAllowed: true,
        });
      }

      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: `Incorrect password. ${remainingAttempts} attempt remaining before OTP verification is required.`,
        failedAttempts: studentAccount.failedPasswordAttempts,
        remainingAttempts,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       5. STUDENT EXPLICIT SESSION TRANSFER
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-transfer-session" || action === "transfer-session") && req.method === "POST") {
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
        return res.status(401).json({ success: false, message: "Invalid credentials.", code: "INVALID_CREDENTIALS" });
      }

      const isMatch = await studentAccount.comparePassword(candidatePassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password.", code: "INVALID_PASSWORD" });
      }

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

      setStudentCookie(res, studentToken);

      return res.json({
        success: true,
        message: wasReplaced ? "Session successfully transferred to this device." : "Logged in successfully.",
        student: { regNo: rawReg, studentName, sessionId: newSession.sessionId },
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       6. STUDENT APPROVAL STATUS POLLING
    ══════════════════════════════════════════════════════════════════ */
    if ((action === "student-approval-status" || action === "approval-status") && req.method === "GET") {
      const requestId = req.query.requestId || req.query.id;
      if (!requestId) {
        return res.status(400).json({ success: false, message: "Request ID is required." });
      }

      const statusData = await getDeviceApprovalStatus(requestId);
      if (!statusData || !statusData.success) {
        return res.status(404).json(statusData || { success: false, message: "Approval request not found." });
      }

      if (statusData.status === "APPROVED" && statusData.approvedToken) {
        setStudentCookie(res, statusData.approvedToken);
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

      return res.json({
        success: true,
        status: statusData.status,
        requestId: statusData.requestId,
        expiresAt: statusData.expiresAt,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       7. STUDENT CANCEL APPROVAL REQUEST
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-cancel-approval" || action === "cancel-approval") && req.method === "POST") {
      const { requestId } = req.body || {};
      if (!requestId) {
        return res.status(400).json({ success: false, message: "Request ID is required." });
      }

      await DeviceApprovalRequest.updateOne({ requestId }, { $set: { status: "EXPIRED" } });
      await StudentNotification.updateMany({ approvalRequestId: requestId }, { $set: { status: "EXPIRED" } });

      return res.json({ success: true, message: "Approval request canceled." });
    }

    /* ═══════════════════════════════════════════════════════════════════
       7b. UNIFIED AUTHENTICATION BOOTSTRAP (/auth/bootstrap)
    ═══════════════════════════════════════════════════════════════════ */
    if (action === "bootstrap" && req.method === "GET") {
      let studentToken = req.headers["x-student-token"];
      if (!studentToken && cookies.student_jwt && cookies.student_jwt !== "none") {
        studentToken = cookies.student_jwt;
      }
      if (!studentToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        studentToken = req.headers.authorization.split(" ")[1];
      }

      let adminToken = cookies.jwt || req.headers["x-admin-token"];

      let studentAuth = null;
      let adminAuth = null;

      // 1. Passive / Read-only Student Session Validation
      if (studentToken && studentToken !== "none") {
        try {
          const decoded = jwt.verify(studentToken, process.env.JWT_SECRET);
          if (decoded?.regNo && decoded?.sessionId) {
            const session = await StudentSession.findOne({
              regNo: decoded.regNo,
              sessionId: decoded.sessionId,
              isActive: true,
            });
            if (session && (!session.expiresAt || new Date(session.expiresAt) > new Date())) {
              await touchSession(session);
              const studentRecord = await SemesterResult.findOne({ regNo: decoded.regNo }).sort({ semester: -1 });
              studentAuth = {
                regNo: decoded.regNo,
                studentName: studentRecord?.studentName || "Student",
                sessionId: decoded.sessionId,
              };
            }
          }
        } catch {}
      }

      // 2. Passive / Read-only Admin & Sub-Admin Session Validation
      if (adminToken && adminToken !== "none") {
        try {
          const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
          if (decoded?.role === "admin") {
            if (decoded.adminType === "subadmin" && decoded.subAdminId) {
              const session = await SubAdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
              if (session && (!session.expiresAt || new Date(session.expiresAt) > new Date())) {
                session.lastActiveAt = new Date();
                await session.save();
                const subAdmin = await SubAdmin.findById(decoded.subAdminId);
                if (subAdmin && subAdmin.status === "active") {
                  adminAuth = {
                    authenticated: true,
                    role: "admin",
                    adminType: "subadmin",
                    name: subAdmin.name || decoded.name,
                    email: subAdmin.email || decoded.email,
                    permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
                  };
                }
              }
            } else if (decoded.sessionId) {
              const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
              if (session && (!session.expiresAt || new Date(session.expiresAt) > new Date())) {
                await touchAdminSession(session);
                adminAuth = {
                  authenticated: true,
                  role: "admin",
                  adminType: "main",
                  name: "Main Administrator",
                  email: decoded.email || process.env.ADMIN_EMAIL,
                  permissions: { routes: ["*"], sections: ["*"], actions: ["*"] },
                };
              }
            }
          }
        } catch {}
      }

      // 3. Admin Device Occupancy & Maintenance status
      let activeAdminCount = 0;
      let maintenanceState = { enabled: false, message: "", enabledAt: null };

      try {
        const [activeAdminSessions, config] = await Promise.all([
          AdminSession.find({ isActive: true, expiresAt: { $gt: new Date() } }).lean(),
          SystemConfig.findOne({ key: "maintenance" }).lean(),
        ]);
        activeAdminCount = activeAdminSessions?.length || 0;
        if (config?.maintenance) {
          maintenanceState = {
            enabled: Boolean(config.maintenance.enabled),
            message: config.maintenance.message || "",
            enabledAt: config.maintenance.enabledAt || null,
          };
        }
      } catch {}

      return res.json({
        success: true,
        authStatus: "RESOLVED",
        student: studentAuth,
        admin: adminAuth,
        adminDeviceCount: activeAdminCount,
        isAdminButtonVisible: activeAdminCount < 2,
        maintenance: maintenanceState,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       8. STUDENT AUTHENTICATED SESSION CHECK (/student/me)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-me" || action === "me-student") && req.method === "GET") {
      let token = req.headers["x-student-token"];
      if (!token && cookies.student_jwt && cookies.student_jwt !== "none") {
        token = cookies.student_jwt;
      }
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token || token === "none") {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: "Token invalid or expired" });
      }

      if (!decoded.regNo || !decoded.sessionId) {
        return res.status(401).json({ success: false, message: "Invalid session token" });
      }

      const session = await StudentSession.findOne({
        regNo: decoded.regNo,
        sessionId: decoded.sessionId,
        isActive: true,
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          code: "SESSION_TERMINATED",
          message: "Session terminated or logged out from this device.",
        });
      }

      await touchSession(session);

      const studentRecord = await SemesterResult.findOne({ regNo: decoded.regNo }).sort({ semester: -1 });

      return res.json({
        success: true,
        student: {
          regNo: decoded.regNo,
          studentName: studentRecord?.studentName || "Student",
          sessionId: decoded.sessionId,
        },
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       9. STUDENT LOGOUT (/student/logout)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-logout" || action === "logout-student") && req.method === "POST") {
      let token = cookies.student_jwt || req.headers["x-student-token"];
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (token && token !== "none") {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.sessionId) {
            await StudentSession.deleteOne({ sessionId: decoded.sessionId });
          }
        } catch {}
      }

      clearStudentCookie(res);
      return res.json({ success: true, message: "Logged out successfully from this device." });
    }

    /* ═══════════════════════════════════════════════════════════════════
       10. ADMIN STATUS CHECK (/admin/check-status)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "admin-check-status" || action === "check-admin-status") && req.method === "GET") {
      const activeSessions = await getActiveAdminSessions(AdminSession);

      let incomingToken = cookies.jwt || req.headers["x-admin-token"];
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
    }

    /* ═══════════════════════════════════════════════════════════════════
       11. ADMIN PASSWORD LOGIN -> SEND OTP
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "admin-login-password" || action === "login") && req.method === "POST") {
      let adminEmail = process.env.ADMIN_EMAIL;
      let adminPassword = process.env.ADMIN_PASSWORD;

      let adminDoc = null;
      if (!adminEmail || !adminPassword) {
        adminDoc = await Admin.findOne().sort({ createdAt: -1 });
        if (adminDoc && !adminEmail) adminEmail = adminDoc.email;
      } else {
        adminDoc = await Admin.findOne({ email: adminEmail });
      }

      if (!adminEmail && !adminDoc) {
        return res.status(500).json({
          message: "Admin authentication is temporarily unavailable. Missing ADMIN_EMAIL/ADMIN_PASSWORD.",
          code: "ADMIN_CONFIG_MISSING",
        });
      }

      const candidatePassword = String(req.body.password || "");
      if (!candidatePassword) {
        return res.status(400).json({ message: "Please enter your administrative password.", code: "PASSWORD_REQUIRED" });
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
        return res.status(401).json({ message: "Invalid password. Access denied.", code: "INVALID_PASSWORD" });
      }

      const activeSessions = await getActiveAdminSessions(AdminSession);

      let incomingToken = cookies.jwt || req.headers["x-admin-token"];
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
              return res.json({
                success: true,
                alreadyLoggedIn: true,
                authenticated: true,
                role: "admin",
                adminType: "main",
                message: "Admin is already actively authenticated on this device.",
              });
            }
          }
        } catch {}
      }

      if (activeSessions.length >= MAX_ADMIN_DEVICES && !isCurrentDevice) {
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
        return res.status(403).json({
          message: `Admin portal is active on ${activeSessions.length} devices (maximum limit: ${MAX_ADMIN_DEVICES}). Please log out from another device first.`,
          code: "ADMIN_DEVICE_LIMIT_REACHED",
          activeDeviceCount: activeSessions.length,
          maxAllowedDevices: MAX_ADMIN_DEVICES,
          activeDevices: sanitizedDevices,
        });
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await AdminOtpVerification.deleteMany({});
      await AdminOtpVerification.create({ otpHash, expiresAt, attempts: 0 });

      const recipientEmail = adminEmail || adminDoc?.email;
      await sendAdminOtpEmail({ to: recipientEmail, otp, expiresInMinutes: 5 });

      return res.json({
        success: true,
        step: "OTP_REQUIRED",
        expiresInSeconds: 300,
        message: "A 6-digit verification code has been dispatched to the authorized administrator email.",
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       12. ADMIN VERIFY OTP
    ═══════════════════════════════════════════════════════════════════ */
    if (action === "admin-verify-otp" && req.method === "POST") {
      const rawOtp = String(req.body.otp || "").trim();
      if (!rawOtp || rawOtp.length !== 6) {
        return res.status(400).json({ message: "Please enter a valid 6-digit verification code.", code: "INVALID_FORMAT" });
      }

      const otpRecord = await AdminOtpVerification.findOne({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
      if (!otpRecord) {
        return res.status(400).json({ message: "Verification code has expired or is invalid.", code: "OTP_EXPIRED" });
      }

      if (otpRecord.attempts >= 5) {
        await AdminOtpVerification.deleteMany({});
        return res.status(429).json({ message: "Maximum verification attempts exceeded.", code: "MAX_ATTEMPTS_EXCEEDED" });
      }

      const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
      if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return res.status(400).json({ message: `Invalid code. ${5 - otpRecord.attempts} attempts remaining.`, code: "INVALID_OTP" });
      }

      await AdminOtpVerification.deleteMany({});

      const activeSessions = await getActiveAdminSessions(AdminSession);
      if (activeSessions.length >= MAX_ADMIN_DEVICES) {
        return res.status(403).json({
          message: `Admin device limit reached (${MAX_ADMIN_DEVICES} devices active). Please log out from another device.`,
          code: "ADMIN_DEVICE_LIMIT_REACHED",
        });
      }

      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);

      await AdminSession.create({
        sessionId,
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

      setAdminCookie(res, token);

      return res.json({
        success: true,
        authenticated: true,
        role: "admin",
        adminType: "main",
        message: "Admin authenticated successfully.",
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       13. SUB-ADMIN LOGIN & VERIFY
    ═══════════════════════════════════════════════════════════════════ */
    if (action === "subadmin-login" && req.method === "POST") {
      const { email, password } = req.body || {};
      const cleanEmail = String(email || "").trim().toLowerCase();
      const candidatePassword = String(password || "");

      if (!candidatePassword) {
        return res.status(400).json({ success: false, message: "Password is required.", code: "CREDENTIALS_REQUIRED" });
      }

      let subAdmin = cleanEmail ? await SubAdmin.findOne({ email: cleanEmail }) : null;
      if (!subAdmin && !cleanEmail) {
        const activeSubAdmins = await SubAdmin.find({ status: "active" });
        for (const sa of activeSubAdmins) {
          if (await sa.comparePassword(candidatePassword)) {
            subAdmin = sa;
            break;
          }
        }
      }

      if (!subAdmin) {
        return res.status(401).json({ success: false, message: "Invalid Sub-Admin credentials.", code: "INVALID_CREDENTIALS" });
      }

      if (cleanEmail && !(await subAdmin.comparePassword(candidatePassword))) {
        return res.status(401).json({ success: false, message: "Invalid Sub-Admin password.", code: "INVALID_CREDENTIALS" });
      }

      if (subAdmin.status !== "active") {
        return res.status(403).json({ success: false, message: `Account is ${subAdmin.status}.`, code: `SUBADMIN_${subAdmin.status.toUpperCase()}` });
      }

      const activeSessions = await getActiveSubAdminSessions(SubAdminSession, subAdmin._id);

      let incomingToken = cookies.jwt || req.headers["x-admin-token"];
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

      if (activeSessions.length >= (MAX_SUBADMIN_DEVICES || 2) && !isCurrentDevice) {
        return res.status(403).json({
          success: false,
          code: "SUBADMIN_DEVICE_LIMIT_REACHED",
          message: `Sub-Admin portal is currently active on ${activeSessions.length} devices (maximum limit: ${MAX_SUBADMIN_DEVICES || 2}). Please log out from another device before logging in here.`,
        });
      }

      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await SubAdminOtpVerification.deleteMany({ email: subAdmin.email });
      await SubAdminOtpVerification.create({ email: subAdmin.email, otpHash, expiresAt, attempts: 0 });

      await sendSubAdminOtpEmail({ to: subAdmin.email, name: subAdmin.name, otp, expiresInMinutes: 5 });

      return res.json({
        success: true,
        step: "OTP_REQUIRED",
        email: subAdmin.email,
        name: subAdmin.name,
        expiresInSeconds: 300,
        message: `Verification code sent to ${subAdmin.email}.`,
      });
    }

    if (action === "subadmin-verify-otp" && req.method === "POST") {
      const cleanEmail = String(req.body?.email || "").trim().toLowerCase();
      const rawOtp = String(req.body?.otp || "").trim();

      if (!cleanEmail || !rawOtp || rawOtp.length !== 6) {
        return res.status(400).json({ success: false, message: "Email and 6-digit OTP required." });
      }

      const subAdmin = await SubAdmin.findOne({ email: cleanEmail });
      if (!subAdmin || subAdmin.status !== "active") {
        return res.status(403).json({ success: false, message: "Sub-Admin account inactive or not found." });
      }

      const otpRecord = await SubAdminOtpVerification.findOne({ email: cleanEmail, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
      if (!otpRecord) {
        return res.status(400).json({ success: false, message: "Code expired or invalid." });
      }

      const isMatch = await bcrypt.compare(rawOtp, otpRecord.otpHash);
      if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return res.status(400).json({ success: false, message: `Invalid code. ${5 - otpRecord.attempts} attempts remaining.` });
      }

      await SubAdminOtpVerification.deleteMany({ email: cleanEmail });

      const activeSessions = await getActiveSubAdminSessions(SubAdminSession, subAdmin._id);
      if (activeSessions.length >= (MAX_SUBADMIN_DEVICES || 2)) {
        return res.status(403).json({
          success: false,
          code: "SUBADMIN_DEVICE_LIMIT_REACHED",
          message: `Sub-Admin device limit reached (${MAX_SUBADMIN_DEVICES || 2} active devices). Please log out from another device.`,
        });
      }

      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);

      await SubAdminSession.create({
        subAdminId: subAdmin._id,
        sessionId,
        deviceInfo: extractRequestDeviceInfo(req),
        loggedInAt: now,
        lastActiveAt: now,
        expiresAt,
        isActive: true,
      });

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

      setAdminCookie(res, token);

      return res.json({
        success: true,
        authenticated: true,
        role: "admin",
        adminType: "subadmin",
        name: subAdmin.name,
        email: subAdmin.email,
        permissions: subAdmin.permissions || { routes: [], sections: [], actions: [] },
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       14. ADMIN CURRENT SESSION CHECK (/admin/me)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "me" || action === "admin-me") && req.method === "GET") {
      let token = cookies.jwt || req.headers["x-admin-token"];
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token || token === "none") {
        return res.json({ success: false, message: "Not logged in" });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === "student") {
          return res.status(403).json({ message: "Forbidden: Admin privileges required" });
        }

        if (decoded.adminType === "subadmin") {
          const session = await SubAdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
          if (!session) return res.status(401).json({ success: false, message: "Session ended." });
          session.lastActiveAt = new Date();
          await session.save();

          const subAdmin = await SubAdmin.findById(decoded.subAdminId);
          return res.json({
            success: true,
            authenticated: true,
            role: "admin",
            adminType: "subadmin",
            name: subAdmin?.name || decoded.name,
            email: subAdmin?.email || decoded.email,
            permissions: subAdmin?.permissions || { routes: [], sections: [], actions: [] },
          });
        }

        const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
        if (!session) return res.status(401).json({ success: false, message: "Admin session ended." });

        await touchAdminSession(session);

        return res.json({
          success: true,
          authenticated: true,
          role: "admin",
          adminType: "main",
          name: "Main Administrator",
          email: decoded.email || process.env.ADMIN_EMAIL,
          permissions: { routes: ["*"], sections: ["*"], actions: ["*"] },
        });
      } catch {
        return res.status(401).json({ success: false, message: "Token invalid or expired" });
      }
    }

    /* ═══════════════════════════════════════════════════════════════════
       15. ADMIN LOGOUT (/admin/logout)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "logout" || action === "admin-logout") && req.method === "POST") {
      let token = cookies.jwt || req.headers["x-admin-token"];
      if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (token && token !== "none") {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded?.sessionId) {
            if (decoded.adminType === "subadmin") {
              await SubAdminSession.deleteOne({ sessionId: decoded.sessionId });
            } else {
              await AdminSession.deleteOne({ sessionId: decoded.sessionId });
            }
          }
        } catch {}
      }

      clearAdminCookie(res);
      return res.status(200).json({ success: true, message: "Logged out successfully." });
    }

    return res.status(404).json({ message: `Unknown auth action: ${action}` });
  } catch (error) {
    console.error("Auth handler error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
