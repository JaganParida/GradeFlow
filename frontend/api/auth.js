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
  DEFAULT_SESSION_TTL_MS,
  MAX_ADMIN_DEVICES,
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getActiveSessions,
  isSessionValid,
  touchSession,
  replaceStudentSession,
  createDeviceApprovalRequest,
  respondDeviceApproval,
  completeDeviceApproval,
  getDeviceApprovalStatus,
  cleanExpiredAdminSessions,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
  MAX_SUBADMIN_DEVICES,
  cleanExpiredSubAdminSessions,
  getActiveSubAdminSessions,
} = require("./_lib/sessionManager");

const { broadcastRealtimeEvent } = require("./_lib/ablyService");
const { applyCors } = require("./_lib/cors");

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
  const maxAge = customMaxAge !== null ? customMaxAge : 60 * 24 * 60 * 60; // 60 days
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
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  // Safe body parsing guard for serverless runtimes
  if (typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch (_) {}
  } else if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
    } catch (_) {}
  }
  if (!req.body || typeof req.body !== "object") {
    req.body = {};
  }

  try {
    await connectToDatabase();
    let action = req.query?.action;
    if (!action && req.url) {
      const cleanUrl = req.url.split("?")[0];
      if (cleanUrl.includes("student/send-handover-otp")) action = "student-send-handover-otp";
      else if (cleanUrl.includes("student/send-otp")) action = "student-send-otp";
      else if (cleanUrl.includes("student/verify-otp")) action = "student-verify-otp";
      else if (cleanUrl.includes("student/check-status")) action = "student-check-status";
      else if (cleanUrl.includes("student/create-password")) action = "student-create-password";
      else if (cleanUrl.includes("student/login-password")) action = "student-login-password";
      else if (cleanUrl.includes("student/transfer-session")) action = "student-transfer-session";
      else if (cleanUrl.includes("student/complete-approval")) action = "student-complete-approval";
      else if (cleanUrl.includes("student/approval-status")) action = "student-approval-status";
      else if (cleanUrl.includes("student/cancel-approval")) action = "student-cancel-approval";
      else if (cleanUrl.includes("student/me")) action = "student-me";
      else if (cleanUrl.includes("student/logout")) action = "student-logout";
      else if (cleanUrl.includes("realtime-token")) action = "realtime-token";
      else if (cleanUrl.includes("subadmin/verify-otp")) action = "subadmin-verify-otp";
      else if (cleanUrl.includes("subadmin/login")) action = "subadmin-login";
      else if (cleanUrl.includes("bootstrap")) action = "bootstrap";
      else if (cleanUrl.includes("admin/release-session") || cleanUrl.includes("release-session")) action = "admin-release-session";
      else if (cleanUrl.includes("admin/heartbeat") || cleanUrl.includes("heartbeat")) action = "admin-heartbeat";
      else if (cleanUrl.includes("admin/login-password") || cleanUrl.endsWith("/login")) action = "admin-login-password";
      else if (cleanUrl.includes("admin/verify-otp")) action = "admin-verify-otp";
      else if (cleanUrl.includes("admin/check-status")) action = "admin-check-status";
      else if (cleanUrl.includes("admin/me") || cleanUrl.endsWith("/me")) action = "admin-me";
      else if (cleanUrl.includes("admin/logout") || cleanUrl.endsWith("/logout")) action = "admin-logout";
    }
    const cookies = parseCookies(req.headers.cookie);

    /* ═══════════════════════════════════════════════════════════════════
       REALTIME ABLY TOKEN GENERATION (TOKEN AUTHENTICATION)
    ═══════════════════════════════════════════════════════════════════ */
    if (action === "realtime-token") {
      let incomingToken = req.headers["x-student-token"] || cookies.student_jwt;
      let adminToken = req.headers["x-admin-token"] || cookies.jwt;
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        const bearer = req.headers.authorization.split(" ")[1];
        if (!incomingToken) incomingToken = bearer;
        if (!adminToken) adminToken = bearer;
      }

      // 1. Authenticated Student Token Request
      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.role === "student" && decoded.regNo && decoded.sessionId) {
            const cleanReg = String(decoded.regNo).trim().toUpperCase();
            const session = await StudentSession.findOne({
              regNo: cleanReg,
              sessionId: decoded.sessionId,
              isActive: true,
              expiresAt: { $gt: new Date() },
            });
            if (session) {
              const { createRealtimeTokenRequest } = require("./_lib/ablyService");
              const tokenRequest = await createRealtimeTokenRequest({
                clientId: cleanReg,
                regNo: cleanReg,
                capabilities: {
                  [`student-${cleanReg}`]: ["subscribe"],
                  "broadcasts-all": ["subscribe"],
                },
              });
              return res.json(tokenRequest);
            }
          }
        } catch {}
      }

      // 2. Authenticated Admin Token Request
      if (adminToken && adminToken !== "none") {
        try {
          const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
          if (decoded.role === "admin" && decoded.sessionId) {
            const session = await AdminSession.findOne({
              sessionId: decoded.sessionId,
              isActive: true,
              expiresAt: { $gt: new Date() },
            });
            if (session) {
              const { createRealtimeTokenRequest } = require("./_lib/ablyService");
              const tokenRequest = await createRealtimeTokenRequest({
                clientId: "admin",
                capabilities: {
                  "admin-control": ["subscribe", "publish"],
                  "broadcasts-all": ["subscribe", "publish"],
                  "*": ["subscribe"],
                },
              });
              return res.json(tokenRequest);
            }
          }
        } catch {}
      }

      // 3. Device Approval Waiting Client (Pending Request ID)
      const reqId = req.query?.requestId || req.body?.requestId || req.headers["x-approval-request-id"];
      if (reqId) {
        const cleanReqId = String(reqId).trim();
        const pendingApproval = await DeviceApprovalRequest.findOne({
          requestId: cleanReqId,
          status: { $in: ["PENDING", "APPROVED"] },
          expiresAt: { $gt: new Date() },
        });
        if (pendingApproval) {
          const { createRealtimeTokenRequest } = require("./_lib/ablyService");
          const tokenRequest = await createRealtimeTokenRequest({
            clientId: `approval-${cleanReqId}`,
            regNo: pendingApproval.regNo,
            capabilities: {
              [`approval-${cleanReqId}`]: ["subscribe"],
            },
          });
          return res.json(tokenRequest);
        }
      }

      // 4. Anonymous / Public Guest Client (Broadcast announcements & admin button status only)
      try {
        const { createRealtimeTokenRequest } = require("./_lib/ablyService");
        const tokenRequest = await createRealtimeTokenRequest({
          clientId: "guest-" + crypto.randomUUID().slice(0, 8),
          capabilities: {
            "broadcasts-all": ["subscribe"],
          },
        });
        return res.json(tokenRequest);
      } catch (err) {
        return res.status(500).json({ success: false, message: "Realtime token generation failed." });
      }
    }

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
      const maxDailyLimit = isUnlimited ? 99 : 3;

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
      let otpFallbackAllowed = true;

      if (!hasPassword) {
        // Brand new student (no password created yet) -> Needs OTP verification to create password
        if (isDailyLimitReached) {
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
        if (req.body.isForgotPassword) {
          return res.json({
            success: true,
            isForgotPassword: true,
            message: "If an account exists for this registration number, a verification code has been dispatched to the registered university email.",
          });
        }
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
      if (hasPassword && failedPasswordAttempts < 3 && !isLocked && !req.body.forceOtp && !req.body.isForgotPassword) {
        return res.status(400).json({
          success: false,
          code: "PASSWORD_LOGIN_REQUIRED",
          message: "This account is protected by a password. Please sign in with your password.",
          hasPassword: true,
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

      const isForgotPassword = Boolean(req.body.isForgotPassword || req.body.forceOtp);

      // If in forgot password recovery mode: check if an unexpired recovery OTP is already alive in DB
      if (isForgotPassword) {
        const existingOtp = await OtpVerification.findOne({ regNo: rawReg });
        if (existingOtp && new Date() < new Date(existingOtp.expiresAt)) {
          const remainingSecs = Math.max(1, Math.ceil((new Date(existingOtp.expiresAt).getTime() - Date.now()) / 1000));
          const maskedEmail = `${studentEmail.slice(0, 4)}***@${studentEmail.split("@")[1]}`;

          return res.json({
            success: true,
            message: `A single-use recovery code has already been dispatched to ${studentEmail}. It is valid for 10 minutes. Resend is disabled.`,
            maskedEmail,
            studentName,
            regNo: rawReg,
            hasPassword,
            expiresInSeconds: remainingSecs,
            isForgotPassword: true,
            resendAllowed: false,
          });
        }
      }

      // Generate 6-Digit Cryptographically Secure OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpSalt = await bcrypt.genSalt(10);
      const otpHash = await bcrypt.hash(otpCode, otpSalt);

      await globalDbQueue.run(() => OtpVerification.deleteMany({ regNo: rawReg }));
      const otpTtlMinutes = isForgotPassword ? 10 : 3;
      const expiresAt = new Date(Date.now() + otpTtlMinutes * 60 * 1000);

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
          expiresInMinutes: otpTtlMinutes,
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
        expiresInSeconds: otpTtlMinutes * 60,
        cooldownSeconds: 180,
        attemptsUsedToday: dailyLimit.otpSendCount,
        maxDailyAttempts: maxDailyLimit,
        remainingDailyAttempts: isUnlimited ? 99 : Math.max(0, maxDailyLimit - dailyLimit.otpSendCount),
        isUnlimited,
        isForgotPassword,
        resendAllowed: !isForgotPassword,
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

      // ── CRITICAL MANDATORY RULE: If account has NO password OR user is resetting password, return single-use CREATE_PASSWORD token ──
      const isResetFlow = Boolean(req.body.isForgotPassword || req.body.resetPassword || !studentAccount.passwordHash);
      if (isResetFlow) {
        const setupPasswordToken = crypto.randomUUID();
        const tokenHash = crypto.createHash("sha256").update(setupPasswordToken).digest("hex");
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        studentAccount.passwordResetTokenHash = tokenHash;
        studentAccount.passwordResetExpiresAt = expiresAt;
        await studentAccount.save();

        return res.json({
          success: true,
          verified: true,
          authenticated: false,
          passwordRequired: true,
          step: "CREATE_PASSWORD",
          setupPasswordToken,
          message: "Verification successful. Please create a new password for your account.",
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
          const sorted = activeSessions.sort((a, b) => new Date(a.lastActiveAt || a.loggedInAt) - new Date(b.lastActiveAt || b.loggedInAt));
          const oldest = sorted[0];
          if (oldest) {
            oldest.isActive = false;
            oldest.revokedAt = new Date();
            oldest.revokeReason = "REPLACED_BY_NEW_DEVICE";
            await oldest.save();
          }
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

      if (!newPassword || newPassword.length < 8 || newPassword.length > 72) {
        return res.status(400).json({
          success: false,
          message: "Password must be between 8 and 72 characters long.",
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

      const tokenHash = crypto.createHash("sha256").update(setupToken.trim()).digest("hex");

      // Atomically verify and consume the reset token in a single DB operation
      const studentAccount = await Student.findOneAndUpdate(
        {
          regNo: rawReg,
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: { $gt: new Date() },
        },
        {
          $set: {
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
            failedPasswordAttempts: 0,
            lastFailedPasswordAt: null,
            lockedUntil: null,
          },
        },
        { new: true }
      );

      if (!studentAccount) {
        return res.status(401).json({
          success: false,
          message: "Password setup session expired or already used. Please verify OTP again.",
          code: "INVALID_SETUP_TOKEN",
        });
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
        { expiresIn: "60d" }
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

      // ── Brute-Force Defense: Verify lockout state BEFORE evaluating password ──
      const now = new Date();
      if (studentAccount.lockedUntil && new Date(studentAccount.lockedUntil) > now) {
        const remainingMinutes = Math.max(1, Math.ceil((new Date(studentAccount.lockedUntil).getTime() - now.getTime()) / (60 * 1000)));
        return res.status(429).json({
          success: false,
          code: "ACCOUNT_TEMPORARILY_LOCKED",
          message: `Account is temporarily locked due to 3 failed password attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} or sign in using email OTP.`,
          lockedUntil: studentAccount.lockedUntil,
          remainingMinutes,
          otpFallbackAllowed: true,
        });
      }

      // If lockout period has expired, automatically reset attempt counters
      if (studentAccount.lockedUntil && new Date(studentAccount.lockedUntil) <= now) {
        studentAccount.failedPasswordAttempts = 0;
        studentAccount.lockedUntil = null;
        studentAccount.lastFailedPasswordAt = null;
        await Student.updateOne(
          { _id: studentAccount._id },
          { $set: { failedPasswordAttempts: 0, lockedUntil: null, lastFailedPasswordAt: null } }
        );
      }

      // If already at or above 3 failed attempts without future timestamp, lock for 15 minutes now
      if ((studentAccount.failedPasswordAttempts || 0) >= 3) {
        const lockoutDate = new Date(Date.now() + 15 * 60 * 1000);
        studentAccount.lockedUntil = lockoutDate;
        await Student.updateOne(
          { _id: studentAccount._id },
          { $set: { lockedUntil: lockoutDate } }
        );
        return res.status(429).json({
          success: false,
          code: "ACCOUNT_TEMPORARILY_LOCKED",
          message: "Account is temporarily locked for 15 minutes due to 3 consecutive failed password attempts. You can sign in using email OTP.",
          lockedUntil: studentAccount.lockedUntil,
          remainingMinutes: 15,
          otpFallbackAllowed: true,
        });
      }

      const maxAllowedDevices = getMaxAllowedDevices(rawReg);
      const activeSessions = await getActiveSessions(StudentSession, rawReg);

      const isPasswordCorrect = await studentAccount.comparePassword(candidatePassword);

      if (isPasswordCorrect) {
        studentAccount.failedPasswordAttempts = 0;
        studentAccount.lastFailedPasswordAt = null;
        studentAccount.lockedUntil = null;
        await Student.updateOne(
          { _id: studentAccount._id },
          { $set: { failedPasswordAttempts: 0, lastFailedPasswordAt: null, lockedUntil: null } }
        );

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
          // Session rotation on re-authentication: atomically retire old session to issue a fresh one
          matchedSession.isActive = false;
          matchedSession.revokedAt = new Date();
          matchedSession.revokeReason = "SESSION_ROTATED_ON_RELOGIN";
          await matchedSession.save();
        }

        // New Device Login Logic:
        if (maxAllowedDevices === 1) {
          if (activeSessions.length === 0) {
            // Existing student with correct password and 0 active sessions -> Direct login without OTP!
            const { newSession } = await replaceStudentSession(StudentSession, rawReg, {
              deviceInfo: extractRequestDeviceInfo(req),
            });

            const studentToken = jwt.sign(
              { regNo: rawReg, sessionId: newSession.sessionId, role: "student" },
              process.env.JWT_SECRET,
              { expiresIn: "60d" }
            );

            setStudentCookie(res, studentToken);

            return res.json({
              success: true,
              message: "Login successful.",
              student: { regNo: rawReg, studentName, sessionId: newSession.sessionId },
            });
          }

          // Single device student with 1 active device -> IN-APP APPROVAL FLOW
          const activeDev = activeSessions[0];
          const { approvalRequest, exchangeSecret } = await createDeviceApprovalRequest(
            rawReg,
            extractRequestDeviceInfo(req),
            activeDev.sessionId
          );

          return res.json({
            success: true,
            step: "APPROVAL_PENDING",
            requestId: approvalRequest.requestId,
            exchangeSecret,
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
          // 2-Device Account (230301120327): FIFO Session Rotation
          if (activeSessions.length >= maxAllowedDevices) {
            const sorted = activeSessions.sort((a, b) => new Date(a.lastActiveAt || a.loggedInAt) - new Date(b.lastActiveAt || b.loggedInAt));
            const oldest = sorted[0];
            if (oldest) {
              oldest.isActive = false;
              oldest.revokedAt = new Date();
              oldest.revokeReason = "REPLACED_BY_NEW_DEVICE";
              await oldest.save();
              publishStudentRealtimeEvent(rawReg, "session-revoked", {
                sessionId: oldest.sessionId,
                revokedSessionId: oldest.sessionId,
                reason: "REPLACED_BY_NEW_DEVICE",
                message: "Your session was terminated because this account was logged into on another device.",
              }).catch(() => {});
            }
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
            { expiresIn: "60d" }
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

      if (studentAccount.failedPasswordAttempts >= 3) {
        const lockoutDate = new Date(Date.now() + 15 * 60 * 1000); // 15-minute temporary lockout
        studentAccount.lockedUntil = lockoutDate;
        await Student.updateOne(
          { _id: studentAccount._id },
          {
            $set: {
              failedPasswordAttempts: studentAccount.failedPasswordAttempts,
              lastFailedPasswordAt: studentAccount.lastFailedPasswordAt,
              lockedUntil: lockoutDate,
            },
          }
        );

        return res.status(429).json({
          success: false,
          code: "PASSWORD_ATTEMPTS_EXCEEDED",
          message: "Incorrect password. 3 consecutive attempts failed. Account is temporarily locked for 15 minutes. You can sign in using OTP verification to reset your password.",
          failedAttempts: studentAccount.failedPasswordAttempts,
          lockedUntil: studentAccount.lockedUntil,
          remainingMinutes: 15,
          otpFallbackAllowed: true,
        });
      }

      await Student.updateOne(
        { _id: studentAccount._id },
        {
          $set: {
            failedPasswordAttempts: studentAccount.failedPasswordAttempts,
            lastFailedPasswordAt: studentAccount.lastFailedPasswordAt,
          },
        }
      );
      const remainingAttempts = Math.max(0, 3 - studentAccount.failedPasswordAttempts);

      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: `Incorrect password. ${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining before account is temporarily locked.`,
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
        { expiresIn: "60d" }
      );

      // Invalidate any existing pending approval requests for this student
      await DeviceApprovalRequest.updateMany(
        { regNo: rawReg, status: "PENDING" },
        { $set: { status: "EXPIRED" } }
      );

      setStudentCookie(res, studentToken);

      return res.json({
        success: true,
        message: wasReplaced ? "Session successfully transferred to this device." : "Logged in successfully.",
        student: { regNo: rawReg, studentName, sessionId: newSession.sessionId },
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       5b. STUDENT COMPLETE DEVICE APPROVAL (EXCHANGE SECRET -> JWT)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "student-complete-approval" || action === "complete-approval") && req.method === "POST") {
      const requestId = String(req.body?.requestId || req.query?.requestId || "").trim();
      const exchangeSecret = String(req.body?.exchangeSecret || req.query?.exchangeSecret || "").trim();

      if (!requestId || !exchangeSecret) {
        return res.status(400).json({
          success: false,
          code: "MISSING_PARAMS",
          message: "Request ID and exchange secret are required to complete device approval.",
        });
      }

      const result = await completeDeviceApproval(StudentSession, requestId, exchangeSecret, req);
      if (!result.success) {
        return res.status(400).json(result);
      }

      setStudentCookie(res, result.token);

      const studentRecord = await SemesterResult.findOne({ regNo: result.regNo }).sort({ semester: -1 });

      return res.json({
        success: true,
        status: "COMPLETED",
        message: "Device approval completed successfully. You are now logged in.",
        student: {
          regNo: result.regNo,
          studentName: studentRecord?.studentName || "Student",
          sessionId: result.sessionId,
        },
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       5c. STUDENT SEND HANDOVER / RECOVERY OTP
    ═══════════════════════════════════════════════════════════════════ */
    if (action === "student-send-handover-otp" && req.method === "POST") {
      const rawReg = String(req.body.regNo || "").trim().toUpperCase();
      const candidatePassword = String(req.body.password || "");
      const requestId = String(req.body.requestId || "");

      if (!rawReg) {
        return res.status(400).json({ success: false, message: "Registration number is required." });
      }

      const studentAccount = await Student.findOne({ regNo: rawReg });
      if (!studentAccount || !studentAccount.passwordHash) {
        return res.status(401).json({ success: false, message: "Invalid student credentials." });
      }

      let isAuthorized = false;
      if (candidatePassword) {
        isAuthorized = await studentAccount.comparePassword(candidatePassword);
      }
      if (!isAuthorized && requestId) {
        const pendingApproval = await DeviceApprovalRequest.findOne({
          $or: [{ requestId }, { id: requestId }],
          regNo: rawReg,
          status: "PENDING",
        });
        if (pendingApproval && new Date() < new Date(pendingApproval.expiresAt)) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(401).json({ success: false, message: "Unauthorized request. Password verification required." });
      }

      const studentRecord = await SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 });
      const studentName = studentRecord?.studentName || "Student";
      const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;

      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      await OtpVerification.deleteMany({ regNo: rawReg });
      await OtpVerification.create({
        regNo: rawReg,
        email: studentEmail,
        otpHash,
        expiresAt,
        attempts: 0,
      });

      try {
        await sendStudentOtpEmail({
          to: studentEmail,
          studentName,
          regNo: rawReg,
          otp,
          expiresInMinutes: 5,
        });
      } catch (emailErr) {
        console.error("Handover OTP email dispatch error:", emailErr);
        return res.status(500).json({ success: false, message: "Failed to dispatch verification code to university email." });
      }

      const parts = studentEmail.split("@");
      const maskedUser = parts[0].length > 4 ? `${parts[0].slice(0, 3)}***${parts[0].slice(-2)}` : `${parts[0].slice(0, 1)}***`;
      const maskedEmail = `${maskedUser}@${parts[1]}`;

      return res.json({
        success: true,
        message: `A 6-digit verification code has been dispatched to ${maskedEmail}`,
        maskedEmail,
        expiresInSeconds: 300,
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

      // If approved, check if client supplied exchangeSecret to complete immediately in one round-trip
      const exchangeSecret = String(req.query.exchangeSecret || req.headers["x-exchange-secret"] || "").trim();
      if (statusData.status === "APPROVED" && exchangeSecret) {
        const result = await completeDeviceApproval(StudentSession, requestId, exchangeSecret, req);
        if (result.success) {
          setStudentCookie(res, result.token);
          const studentRecord = await SemesterResult.findOne({ regNo: result.regNo }).sort({ semester: -1 });
          return res.json({
            success: true,
            status: "APPROVED",
            completed: true,
            message: "Login request approved! Logging you in...",
            student: {
              regNo: result.regNo,
              studentName: studentRecord?.studentName || "Student",
              sessionId: result.sessionId,
            },
          });
        }
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
      // This response is specific to HTTP-only cookies. Never let a browser,
      // CDN, or service worker reuse another session's bootstrap result.
      res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
      res.setHeader("Vary", "Cookie");
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
              const studentRecord = await SemesterResult.findOne({ regNo: decoded.regNo })
                .select("studentName")
                .sort({ semester: -1 })
                .lean();
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
                    sessionId: decoded.sessionId,
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
                  sessionId: decoded.sessionId,
                  permissions: { routes: ["*"], sections: ["*"], actions: ["*"] },
                };
              }
            }
          }
        } catch {}
      }

      // 3. Admin Device Occupancy & Maintenance status & Portal Visibility
      let activeAdminCount = 0;
      let maintenanceState = { enabled: false, message: "", enabledAt: null };
      let buttonVisibilityConfig = {
        mode: "AUTO",
        allowedRoles: {
          mainAdmin: true,
          subAdmin: true,
          specialStudent: true,
          allStudents: false,
          guests: false,
        },
      };

      // Check if client previously had an admin session on this device but cookies were cleared
      const clientLastSession = req.headers["x-admin-last-session"] || req.query?.lastAdminSession;
      let sessionWasRevoked = false;
      if (!adminAuth) {
        try {
          if (clientLastSession) {
            const orphanedSession = await AdminSession.findOneAndUpdate(
              { sessionId: clientLastSession, isActive: true },
              {
                $set: {
                  isActive: false,
                  revokedAt: new Date(),
                  revokeReason: "COOKIE_CLEARED_BY_CLIENT",
                },
              }
            );
            const orphanedSubSession = await SubAdminSession.findOneAndUpdate(
              { sessionId: clientLastSession, isActive: true },
              {
                $set: {
                  isActive: false,
                  revokedAt: new Date(),
                  revokeReason: "COOKIE_CLEARED_BY_CLIENT",
                },
              }
            );
            if (orphanedSession || orphanedSubSession) {
              sessionWasRevoked = true;
            }
          }

          // DEVICE FINGERPRINT / USER-AGENT FALLBACK:
          // If the user cleared cookies/storage or closed incognito, no x-admin-last-session header is sent.
          // Detect any active session created from this exact User-Agent and revoke it since the device has no cookie.
          const clientInfo = extractRequestDeviceInfo(req);
          if (clientInfo && clientInfo.userAgent && clientInfo.userAgent.length > 5) {
            const matchingSession = await AdminSession.findOneAndUpdate(
              {
                isActive: true,
                "deviceInfo.userAgent": clientInfo.userAgent,
                lastActiveAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
              },
              {
                $set: {
                  isActive: false,
                  revokedAt: new Date(),
                  revokeReason: "COOKIE_CLEARED_ON_CLIENT",
                },
              }
            );
            if (matchingSession) sessionWasRevoked = true;

            const matchingSubSession = await SubAdminSession.findOneAndUpdate(
              {
                isActive: true,
                "deviceInfo.userAgent": clientInfo.userAgent,
                lastActiveAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
              },
              {
                $set: {
                  isActive: false,
                  revokedAt: new Date(),
                  revokeReason: "COOKIE_CLEARED_ON_CLIENT",
                },
              }
            );
            if (matchingSubSession) sessionWasRevoked = true;
          }
        } catch (_) {}
      }

      try {
        const [activeAdminSessions, config, vConfigDoc] = await Promise.all([
          getActiveAdminSessions(AdminSession),
          SystemConfig.findOne({ key: "maintenance" }).select("maintenance").lean(),
          SystemConfig.findOne({ key: "admin_button_config" }).select("adminButtonVisibility").lean(),
        ]);
        activeAdminCount = activeAdminSessions?.length || 0;
        if (config?.maintenance) {
          maintenanceState = {
            enabled: Boolean(config.maintenance.enabled),
            message: config.maintenance.message || "",
            enabledAt: config.maintenance.enabledAt || null,
          };
        }
        if (vConfigDoc?.adminButtonVisibility) {
          buttonVisibilityConfig = vConfigDoc.adminButtonVisibility;
        }

        if (sessionWasRevoked) {
          broadcastRealtimeEvent("admin-availability-updated", {
            activeDeviceCount: activeAdminCount,
            isAdminButtonVisible: activeAdminCount < 2,
          }).catch(() => {});
        }

        if (adminAuth && adminAuth.sessionId) {
          const matchedSession = activeAdminSessions?.find((s) => s.sessionId === adminAuth.sessionId);
          if (matchedSession) {
            touchAdminSession(matchedSession).catch(() => {});
          }
        }
      } catch {}

      // Calculate resolved visibility (Manual override vs Automatic system logic)
      // Automatic rule: Visible to all when active devices < 2; hidden everywhere when active devices >= 2
      let resolvedButtonVisible = activeAdminCount < 2;
      if (buttonVisibilityConfig && buttonVisibilityConfig.mode === "MANUAL") {
        const roles = buttonVisibilityConfig.allowedRoles || {};
        if (adminAuth) {
          resolvedButtonVisible = adminAuth.isSubAdmin ? (roles.subAdmin !== false) : (roles.mainAdmin !== false);
        } else if (studentAuth?.regNo === "230301120327") {
          resolvedButtonVisible = roles.specialStudent !== false;
        } else if (studentAuth?.regNo) {
          resolvedButtonVisible = Boolean(roles.allStudents);
        } else {
          resolvedButtonVisible = Boolean(roles.guests);
        }
      }

      return res.json({
        success: true,
        authStatus: "RESOLVED",
        student: studentAuth,
        admin: adminAuth,
        adminDeviceCount: activeAdminCount,
        isAdminButtonVisible: resolvedButtonVisible,
        adminButtonConfig: buttonVisibilityConfig,
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

      const regNoFromBody = req.body?.regNo;
      let sessionId = null;
      let decodedRegNo = null;

      if (token && token !== "none") {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          sessionId = decoded?.sessionId;
          decodedRegNo = decoded?.regNo;
        } catch {}
      }

      if (!sessionId) {
        sessionId = req.headers["x-student-session"] || req.body?.sessionId || null;
      }

      const targetReg = String(decodedRegNo || regNoFromBody || "").toUpperCase().trim();
      const now = new Date();

      if (sessionId) {
        await StudentSession.updateOne(
          { sessionId },
          {
            $set: {
              isActive: false,
              loggedOutAt: now,
              lastActiveAt: now,
              logoutType: "student_manual",
              revokedAt: now,
              revokeReason: "Signed out manually by student",
            },
          }
        );
      } else if (targetReg) {
        const clientInfo = extractRequestDeviceInfo(req);
        const match = await StudentSession.findOne({
          regNo: targetReg,
          isActive: true,
          "deviceInfo.userAgent": clientInfo.userAgent,
        }).sort({ lastActiveAt: -1 });

        if (match) {
          await StudentSession.updateOne(
            { _id: match._id },
            {
              $set: {
                isActive: false,
                loggedOutAt: now,
                lastActiveAt: now,
                logoutType: "student_manual",
                revokedAt: now,
                revokeReason: "Signed out manually by student",
              },
            }
          );
        }
      }

      clearStudentCookie(res);
      return res.json({ success: true, message: "Logged out successfully from this device." });
    }

    /* ═══════════════════════════════════════════════════════════════════
       10. ADMIN STATUS CHECK (/admin/check-status)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "admin-check-status" || action === "check-admin-status") && req.method === "GET") {
      const clientLastSession = req.headers["x-admin-last-session"] || req.query?.lastAdminSession;

      let incomingToken = cookies.jwt || req.headers["x-admin-token"];
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      let decodedAdmin = null;
      if (incomingToken && incomingToken !== "none") {
        try {
          decodedAdmin = jwt.verify(incomingToken, process.env.JWT_SECRET);
        } catch {}
      }

      // If client reports an admin session on this device, but there is no valid admin token matching it:
      let revokedOrphan = false;
      if (clientLastSession && (!decodedAdmin || decodedAdmin.sessionId !== clientLastSession)) {
        try {
          const resRevoke = await AdminSession.findOneAndUpdate(
            { sessionId: clientLastSession, isActive: true },
            {
              $set: {
                isActive: false,
                revokedAt: new Date(),
                revokeReason: "COOKIE_CLEARED_BY_CLIENT",
              },
            }
          );
          if (resRevoke) revokedOrphan = true;
        } catch {}
      }

      const activeSessions = await getActiveAdminSessions(AdminSession);

      if (revokedOrphan) {
        try {
          await broadcastRealtimeEvent("admin-availability-updated", {
            activeDeviceCount: activeSessions.length,
            isAdminButtonVisible: activeSessions.length < MAX_ADMIN_DEVICES,
          });
        } catch {}
      }

      let isCurrentDevice = false;
      if (decodedAdmin && decodedAdmin.role === "admin" && decodedAdmin.sessionId) {
        const matching = activeSessions.find((s) => s.sessionId === decodedAdmin.sessionId);
        if (matching) {
          isCurrentDevice = true;
          touchAdminSession(matching).catch(() => {});
        }
      }

      const isBlocked = false;
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

      let buttonVisibilityConfig = {
        mode: "AUTO",
        allowedRoles: {
          mainAdmin: true,
          subAdmin: true,
          specialStudent: true,
          allStudents: false,
          guests: false,
        },
      };

      try {
        const vConfigDoc = await SystemConfig.findOne({ key: "admin_button_config" }).lean();
        if (vConfigDoc?.adminButtonVisibility) {
          buttonVisibilityConfig = vConfigDoc.adminButtonVisibility;
        }
      } catch {}

      let resolvedButtonVisible = activeSessions.length < MAX_ADMIN_DEVICES;
      if (buttonVisibilityConfig && buttonVisibilityConfig.mode === "MANUAL") {
        const roles = buttonVisibilityConfig.allowedRoles || {};
        if (isCurrentDevice) {
          resolvedButtonVisible = roles.mainAdmin !== false;
        } else {
          resolvedButtonVisible = Boolean(roles.guests);
        }
      }

      return res.json({
        success: true,
        isCurrentDevice,
        activeDeviceCount: activeSessions.length,
        maxAllowedDevices: MAX_ADMIN_DEVICES,
        isBlocked: false,
        otpAllowed: true,
        loginAllowed: true,
        blockReason: null,
        activeDevices: sanitizedDevices,
        isAdminButtonVisible: resolvedButtonVisible,
        adminButtonConfig: buttonVisibilityConfig,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       11. ADMIN PASSWORD LOGIN -> SEND OTP
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "admin-login-password" || action === "login") && req.method === "POST") {
      const candidateRaw = String(req.body?.password || "");
      if (!candidateRaw) {
        return res.status(400).json({ message: "Please enter your administrative password.", code: "PASSWORD_REQUIRED" });
      }

      const candidateTrimmed = candidateRaw.trim();
      const candidateVariants = [candidateRaw];
      if (candidateTrimmed !== candidateRaw && candidateTrimmed.length > 0) candidateVariants.push(candidateTrimmed);
      try {
        const decoded = decodeURIComponent(candidateRaw);
        if (!candidateVariants.includes(decoded)) candidateVariants.push(decoded);
        const decodedTrim = decoded.trim();
        if (!candidateVariants.includes(decodedTrim)) candidateVariants.push(decodedTrim);
      } catch (_) {}

      let isPasswordCorrect = false;
      let matchedAdminDoc = null;
      let targetRecipientEmail = process.env.ADMIN_EMAIL || null;

      // 1. Check against process.env.ADMIN_PASSWORD (clean quotes & newlines)
      const envAdminPassword = process.env.ADMIN_PASSWORD;
      if (envAdminPassword) {
        const cleanEnvPass = String(envAdminPassword).trim().replace(/^["']|["']$/g, "");
        for (const cand of candidateVariants) {
          if (!cand) continue;
          // Plaintext constant-time check against trimmed env var
          const candBuf = Buffer.from(cand, "utf8");
          const envBuf = Buffer.from(cleanEnvPass, "utf8");
          if (candBuf.length === envBuf.length && crypto.timingSafeEqual(candBuf, envBuf)) {
            isPasswordCorrect = true;
            break;
          }
          // Plaintext check against raw env var
          const rawEnvBuf = Buffer.from(envAdminPassword, "utf8");
          if (candBuf.length === rawEnvBuf.length && crypto.timingSafeEqual(candBuf, rawEnvBuf)) {
            isPasswordCorrect = true;
            break;
          }
          // Bcrypt check if env var is bcrypt hash
          if (cleanEnvPass.startsWith("$2a$") || cleanEnvPass.startsWith("$2b$") || cleanEnvPass.startsWith("$2y$")) {
            try {
              if (await bcrypt.compare(cand, cleanEnvPass)) {
                isPasswordCorrect = true;
                break;
              }
            } catch (_) {}
          }
        }
      }

      // 2. Check against all MongoDB Admin accounts
      if (!isPasswordCorrect) {
        const allAdmins = await Admin.find({});
        for (const admin of allAdmins) {
          for (const cand of candidateVariants) {
            if (!cand) continue;
            try {
              if (typeof admin.comparePassword === "function") {
                if (await admin.comparePassword(cand)) {
                  isPasswordCorrect = true;
                  matchedAdminDoc = admin;
                  targetRecipientEmail = admin.email;
                  break;
                }
              } else if (admin.password) {
                if (await bcrypt.compare(cand, admin.password)) {
                  isPasswordCorrect = true;
                  matchedAdminDoc = admin;
                  targetRecipientEmail = admin.email;
                  break;
                }
              }
            } catch (_) {}
          }
          if (isPasswordCorrect) break;
        }
      }

      // 3. Fallback: Check MongoDB SubAdmin accounts (in case active admin is registered in subadmins)
      if (!isPasswordCorrect) {
        const allSubAdmins = await SubAdmin.find({ status: "active" });
        for (const subAdmin of allSubAdmins) {
          for (const cand of candidateVariants) {
            if (!cand) continue;
            try {
              if (typeof subAdmin.comparePassword === "function") {
                if (await subAdmin.comparePassword(cand)) {
                  isPasswordCorrect = true;
                  matchedAdminDoc = subAdmin;
                  targetRecipientEmail = subAdmin.email;
                  break;
                }
              } else if (subAdmin.password) {
                if (await bcrypt.compare(cand, subAdmin.password)) {
                  isPasswordCorrect = true;
                  matchedAdminDoc = subAdmin;
                  targetRecipientEmail = subAdmin.email;
                  break;
                }
              }
            } catch (_) {}
          }
          if (isPasswordCorrect) break;
        }
      }

      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid password. Access denied.", code: "INVALID_PASSWORD" });
      }

      const activeSessions = await getActiveAdminSessions(AdminSession);

      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await AdminOtpVerification.deleteMany({});
      await AdminOtpVerification.create({ otpHash, expiresAt, attempts: 0 });

      const recipientEmail = targetRecipientEmail || matchedAdminDoc?.email || process.env.ADMIN_EMAIL || "jaganparida35@gmail.com";
      try {
        await sendAdminOtpEmail({ to: recipientEmail, otp, expiresInMinutes: 5 });
      } catch (emailErr) {
        console.error("Admin OTP email send failure:", emailErr?.message || emailErr);
        return res.status(503).json({
          success: false,
          code: "EMAIL_SERVICE_UNAVAILABLE",
          message: "Unable to dispatch verification email at this moment. Please wait a few seconds and try again.",
        });
      }

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
        // Prevent permanent lockout if cookies were cleared on one device or ghost sessions exist
        const incomingDevice = extractRequestDeviceInfo(req);
        const sameDeviceSession = activeSessions.find(
          (s) =>
            s.deviceInfo?.userAgent === incomingDevice?.userAgent &&
            s.deviceInfo?.os === incomingDevice?.os &&
            s.deviceInfo?.browser === incomingDevice?.browser
        );
        const sessionToRevoke =
          sameDeviceSession ||
          activeSessions.sort(
            (a, b) =>
              new Date(a.lastActiveAt || a.loggedInAt) -
              new Date(b.lastActiveAt || b.loggedInAt)
          )[0];

        if (sessionToRevoke) {
          await AdminSession.updateOne(
            { _id: sessionToRevoke._id },
            {
              $set: {
                isActive: false,
                revokedAt: new Date(),
                revokeReason: sameDeviceSession
                  ? "REPLACED_BY_RELOGIN"
                  : "REPLACED_BY_NEW_DEVICE",
              },
            }
          );
        }
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
        { expiresIn: "60d" }
      );

      setAdminCookie(res, token);

      // Broadcast live availability to all clients
      let liveAdminCount = 1;
      try {
        const liveActive = await getActiveAdminSessions(AdminSession);
        liveAdminCount = liveActive.length;
        await broadcastRealtimeEvent("admin-availability-updated", {
          activeDeviceCount: liveAdminCount,
          isAdminButtonVisible: liveAdminCount < MAX_ADMIN_DEVICES,
        });
      } catch {}

      return res.json({
        success: true,
        authenticated: true,
        role: "admin",
        adminType: "main",
        sessionId,
        activeDeviceCount: liveAdminCount,
        isAdminButtonVisible: liveAdminCount < MAX_ADMIN_DEVICES,
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

      if (!cleanEmail || !candidatePassword) {
        return res.status(400).json({
          success: false,
          message: "Both email and password are required.",
          code: "CREDENTIALS_REQUIRED",
        });
      }

      const subAdmin = await SubAdmin.findOne({ email: cleanEmail });
      if (!subAdmin) {
        return res.status(401).json({ success: false, message: "Invalid Sub-Admin credentials.", code: "INVALID_CREDENTIALS" });
      }

      const isMatch = await subAdmin.comparePassword(candidatePassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid Sub-Admin credentials.", code: "INVALID_CREDENTIALS" });
      }

      if (subAdmin.status !== "active") {
        return res.status(403).json({ success: false, message: `Account is ${subAdmin.status}.`, code: `SUBADMIN_${subAdmin.status.toUpperCase()}` });
      }

      const activeSessions = await getActiveSubAdminSessions(SubAdminSession, subAdmin._id);

      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await SubAdminOtpVerification.deleteMany({ email: subAdmin.email });
      await SubAdminOtpVerification.create({ email: subAdmin.email, otpHash, expiresAt, attempts: 0 });

      try {
        await sendSubAdminOtpEmail({ to: subAdmin.email, name: subAdmin.name, otp, expiresInMinutes: 5 });
      } catch (emailErr) {
        console.error("Sub-Admin OTP email send failure:", emailErr?.message || emailErr);
        return res.status(503).json({
          success: false,
          code: "EMAIL_SERVICE_UNAVAILABLE",
          message: "Unable to dispatch verification email at this moment. Please wait a few seconds and try again.",
        });
      }

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
        const sorted = activeSessions.sort((a, b) => new Date(a.lastActiveAt || a.loggedInAt) - new Date(b.lastActiveAt || b.loggedInAt));
        const oldest = sorted[0];
        if (oldest) {
          oldest.isActive = false;
          oldest.revokedAt = new Date();
          oldest.revokeReason = "REPLACED_BY_NEW_DEVICE";
          await oldest.save();
        }
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

      let targetSessionId = null;
      let isAdminTypeSub = false;

      if (token && token !== "none") {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          targetSessionId = decoded?.sessionId;
          isAdminTypeSub = decoded?.adminType === "subadmin";
        } catch {}
      }

      if (!targetSessionId) {
        targetSessionId = req.headers["x-admin-last-session"] || req.body?.sessionId || null;
      }

      if (!targetSessionId) {
        const clientInfo = extractRequestDeviceInfo(req);
        if (clientInfo && clientInfo.userAgent) {
          const match = await AdminSession.findOne({
            isActive: true,
            "deviceInfo.userAgent": clientInfo.userAgent,
          }).sort({ lastActiveAt: -1 });
          if (match) targetSessionId = match.sessionId;
          if (!targetSessionId) {
            const subMatch = await SubAdminSession.findOne({
              isActive: true,
              "deviceInfo.userAgent": clientInfo.userAgent,
            }).sort({ lastActiveAt: -1 });
            if (subMatch) targetSessionId = subMatch.sessionId;
          }
        }
      }

      if (targetSessionId) {
        try {
          await AdminSession.updateOne(
            { sessionId: targetSessionId },
            { $set: { isActive: false, revokedAt: new Date(), revokeReason: "Admin manual logout" } }
          );
          await SubAdminSession.updateOne(
            { sessionId: targetSessionId },
            { $set: { isActive: false, revokedAt: new Date(), revokeReason: "Admin manual logout" } }
          );
        } catch {}
      }

      clearAdminCookie(res);

      // Broadcast live availability to all clients
      let remainingAdminCount = 0;
      try {
        const remainingSessions = await getActiveAdminSessions(AdminSession);
        remainingAdminCount = remainingSessions.length;
        await broadcastRealtimeEvent("admin-availability-updated", {
          activeDeviceCount: remainingAdminCount,
          isAdminButtonVisible: remainingAdminCount < MAX_ADMIN_DEVICES,
        });
      } catch {}

      return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
        activeDeviceCount: remainingAdminCount,
        isAdminButtonVisible: remainingAdminCount < MAX_ADMIN_DEVICES,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       18. ADMIN EXPLICIT RELEASE SESSION (/admin/release-session)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "admin-release-session" || action === "release-session") && req.method === "POST") {
      let targetSessionId = req.body?.sessionId || req.headers["x-admin-last-session"] || null;
      if (!targetSessionId) {
        let token = cookies.jwt || req.headers["x-admin-token"];
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
          token = req.headers.authorization.split(" ")[1];
        }
        if (token && token !== "none") {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            targetSessionId = decoded?.sessionId;
          } catch {}
        }
      }

      if (targetSessionId) {
        try {
          await AdminSession.updateOne(
            { sessionId: targetSessionId, isActive: true },
            {
              $set: {
                isActive: false,
                revokedAt: new Date(),
                revokeReason: "EXPLICIT_CLIENT_RELEASE",
              },
            }
          );
        } catch {}
      }

      clearAdminCookie(res);

      let remainingCount = 0;
      try {
        const activeSessions = await getActiveAdminSessions(AdminSession);
        remainingCount = activeSessions.length;
        await broadcastRealtimeEvent("admin-availability-updated", {
          activeDeviceCount: remainingCount,
          isAdminButtonVisible: remainingCount < MAX_ADMIN_DEVICES,
        });
      } catch {}

      return res.status(200).json({
        success: true,
        message: "Admin session released.",
        activeDeviceCount: remainingCount,
        isAdminButtonVisible: remainingCount < MAX_ADMIN_DEVICES,
      });
    }

    /* ═══════════════════════════════════════════════════════════════════
       19. ADMIN HEARTBEAT LIVENESS (/admin/heartbeat)
    ═══════════════════════════════════════════════════════════════════ */
    if ((action === "admin-heartbeat" || action === "heartbeat") && (req.method === "GET" || req.method === "POST")) {
      let incomingToken = cookies.jwt || req.headers["x-admin-token"];
      if (!incomingToken && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        incomingToken = req.headers.authorization.split(" ")[1];
      }

      if (incomingToken && incomingToken !== "none") {
        try {
          const decoded = jwt.verify(incomingToken, process.env.JWT_SECRET);
          if (decoded.role === "admin" && decoded.sessionId) {
            const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
            if (session) {
              await touchAdminSession(session);
              return res.json({ success: true, alive: true, lastActiveAt: session.lastActiveAt });
            }
          }
        } catch {}
      }

      return res.status(401).json({ success: false, alive: false, message: "No active admin session found for heartbeat." });
    }

    return res.status(404).json({ message: `Unknown auth action: ${action}` });
  } catch (error) {
    console.error("Auth handler error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
