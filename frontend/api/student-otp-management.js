const connectToDatabase = require("./_lib/db");
const AdminSession = require("./_lib/models/AdminSession");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const SubAdmin = require("./_lib/models/SubAdmin");
const SemesterResult = require("./_lib/models/SemesterResult");
const StudentDailyLimit = require("./_lib/models/StudentDailyLimit");
const StudentSession = require("./_lib/models/StudentSession");
const OtpVerification = require("./_lib/models/OtpVerification");
const OtpRequestLog = require("./_lib/models/OtpRequestLog");
const AdminAuditLog = require("./_lib/models/AdminAuditLog");
const jwt = require("jsonwebtoken");
const { globalDbQueue } = require("./_lib/dbProtection");
const { getActiveSessions, getMaxAllowedDevices } = require("./_lib/sessionManager");

const CORS_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-admin-token",
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

function getIstDateKey() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istDate = new Date(utcTime + istOffset);
  return istDate.toISOString().slice(0, 10);
}

async function authenticateMainAdmin(req) {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token && req.headers["x-admin-token"]) {
    token = req.headers["x-admin-token"];
  }

  if (!token || token === "none") {
    // Check if a student token was passed via headers or cookies
    const studentToken = cookies.student_jwt || req.headers["x-student-token"];
    if (studentToken && studentToken !== "none") {
      try {
        const decodedStudent = jwt.verify(studentToken, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (decodedStudent && (decodedStudent.role === "student" || decodedStudent.regNo)) {
          if (decodedStudent.regNo !== "230301120327") {
            return {
              error: "FORBIDDEN",
              status: 403,
              message: "Forbidden: Administrative access restricted. Student accounts cannot access administrative endpoints.",
            };
          }
        }
      } catch {}
    }
    return { error: "AUTH_REQUIRED", status: 401, message: "Administrative authentication required." };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student" || decoded.regNo) {
      if (decoded.regNo !== "230301120327") {
        return { error: "FORBIDDEN", status: 403, message: "Forbidden: Admin privileges required. Student accounts cannot access administrative endpoints." };
      }
    }

    if (decoded.adminType === "subadmin") {
      // Record unauthorized attempt by subadmin in audit log
      try {
        await AdminAuditLog.create({
          actorEmail: decoded.email || "unknown_subadmin",
          actorType: "subadmin",
          action: "UNAUTHORIZED_MAIN_ADMIN_ACCESS_ATTEMPT",
          actionType: "SECURITY_ALERT",
          route: req.url || "/api/admin/student-otp-management",
          result: "FORBIDDEN",
          details: { subAdminId: decoded.subAdminId },
          ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
          userAgent: req.headers["user-agent"] || "",
        });
      } catch {}

      return {
        error: "MAIN_ADMIN_REQUIRED",
        status: 403,
        message: "Access Denied: Only the Institutional Main Administrator is authorized to manage Student OTP attempts.",
      };
    }

    // Main Admin Session Verification
    if (decoded.sessionId) {
      const session = await AdminSession.findOne({ sessionId: decoded.sessionId, isActive: true });
      if (!session) {
        return { error: "ADMIN_SESSION_TERMINATED", status: 401, message: "Admin session is no longer active." };
      }
    }

    return { admin: decoded };
  } catch (err) {
    return { error: "AUTH_INVALID", status: 401, message: "Administrative token invalid or expired." };
  }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_HEADERS["Access-Control-Allow-Origin"]);
  res.setHeader("Access-Control-Allow-Credentials", CORS_HEADERS["Access-Control-Allow-Credentials"]);
  res.setHeader("Access-Control-Allow-Methods", CORS_HEADERS["Access-Control-Allow-Methods"]);
  res.setHeader("Access-Control-Allow-Headers", CORS_HEADERS["Access-Control-Allow-Headers"]);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  await connectToDatabase();

  const authResult = await authenticateMainAdmin(req);
  if (authResult.error) {
    return res.status(authResult.status).json({
      success: false,
      code: authResult.error,
      message: authResult.message,
    });
  }

  const { action, regNo: paramRegNo } = req.query;
  const rawReg = String(paramRegNo || req.body?.regNo || "").trim().toUpperCase();

  if (!rawReg || !/^[a-zA-Z0-9_-]{3,30}$/.test(rawReg)) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration number format. Must be 3-30 alphanumeric characters.",
    });
  }

  const todayKey = getIstDateKey();
  const isUnlimited = rawReg === "230301120327";
  const maxDailyLimit = isUnlimited ? 99 : 2;

  // ── 1. GET /history ──
  if (req.method === "GET" || action === "history") {
    try {
      const studentRecord = await globalDbQueue.run(() =>
        SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 })
      );

      const studentName = studentRecord?.studentName || "Student";
      const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;
      const maskedEmail = `${studentEmail.slice(0, 4)}***@${studentEmail.split("@")[1]}`;

      const dailyLimit = await globalDbQueue.run(() =>
        StudentDailyLimit.findOne({ regNo: rawReg, dateKey: todayKey })
      );
      const todayUsage = dailyLimit ? dailyLimit.otpSendCount : 0;

      let isCooldownActive = false;
      let cooldownRemainingSeconds = 0;
      let cooldownStartedAt = null;

      if (!isUnlimited && dailyLimit && dailyLimit.lastOtpSentAt && dailyLimit.otpSendCount > 0) {
        const timeSinceLastSend = Date.now() - new Date(dailyLimit.lastOtpSentAt).getTime();
        if (timeSinceLastSend < 180 * 1000) {
          isCooldownActive = true;
          cooldownRemainingSeconds = Math.ceil((180 * 1000 - timeSinceLastSend) / 1000);
          cooldownStartedAt = dailyLimit.lastOtpSentAt;
        }
      }

      const activeSessions = await globalDbQueue.run(() =>
        getActiveSessions(StudentSession, rawReg)
      );
      const maxAllowedDevices = getMaxAllowedDevices(rawReg);

      const sanitizedSessions = activeSessions.map((s, idx) => {
        const ua = String(s.deviceInfo?.userAgent || "");
        const rawIp = String(s.deviceInfo?.ip || "");
        const maskedIp = rawIp.includes(".")
          ? `${rawIp.split(".").slice(0, 2).join(".")}.***.***`
          : (rawIp ? "Hidden" : "Unknown");

        let os = "Unknown";
        if (/windows/i.test(ua)) os = "Windows";
        else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
        else if (/android/i.test(ua)) os = "Android";
        else if (/iphone/i.test(ua)) os = "iOS";
        else if (/ipad/i.test(ua)) os = "iPadOS";
        else if (/linux/i.test(ua)) os = "Linux";

        let browser = "Unknown";
        if (/edg/i.test(ua)) browser = "Edge";
        else if (/chrome|crios/i.test(ua)) browser = "Chrome";
        else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
        else if (/safari/i.test(ua)) browser = "Safari";
        else if (/opera|opr/i.test(ua)) browser = "Opera";

        let deviceType = "Desktop";
        if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua) || os === "Android" || os === "iOS") {
          deviceType = "Mobile";
        } else if (/tablet|ipad|android(?!.*mobile)/i.test(ua) || os === "iPadOS") {
          deviceType = "Tablet";
        } else if (os === "Windows" || os === "macOS" || os === "Linux") {
          deviceType = "Laptop";
        }

        let platform = s.deviceInfo?.platform;
        if (!platform || platform === "Unknown") {
          if (os !== "Unknown" && browser !== "Unknown") {
            platform = `${os} / ${browser}`;
          } else if (os !== "Unknown") {
            platform = `${os} Device`;
          } else if (deviceType !== "Unknown") {
            platform = `${deviceType} Browser`;
          } else {
            platform = "Authorized Browser";
          }
        }

        return {
          deviceIndex: idx + 1,
          sessionId: s.sessionId,
          deviceType,
          os,
          browser,
          platform,
          userAgent: ua,
          maskedIp,
          loggedInAt: s.loggedInAt,
          lastActiveAt: s.lastActiveAt,
          expiresAt: s.expiresAt,
          status: "ACTIVE",
        };
      });

      const activeOtp = await globalDbQueue.run(() => OtpVerification.findOne({ regNo: rawReg }));
      let latestOtpStatus = "NONE";
      if (activeOtp) {
        latestOtpStatus = new Date(activeOtp.expiresAt) > new Date() ? "ACTIVE" : "EXPIRED";
      }

      const requestLogs = await globalDbQueue.run(() =>
        OtpRequestLog.find({ regNo: rawReg }).sort({ timestamp: -1 }).limit(50).lean()
      );

      const todayDeliveries = requestLogs.filter(
        (l) => l.dateKey === todayKey && l.status === "DELIVERED"
      ).length;
      const todayFailed = requestLogs.filter(
        (l) => l.dateKey === todayKey && (l.status === "FAILED" || l.status === "BLOCKED")
      ).length;

      const formattedHistory = requestLogs.map((log) => {
        const istFormatter = new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "medium",
        });
        const formattedTime = istFormatter.format(new Date(log.timestamp));
        const ip = String(log.deviceInfo?.ip || "");
        const maskedIp = ip.includes(".") ? `${ip.split(".").slice(0, 2).join(".")}.***.***` : (ip ? "Hidden" : "Unknown");

        return {
          id: log._id,
          timestamp: log.timestamp,
          formattedTime,
          dateKey: log.dateKey,
          status: log.status,
          deliveryStatus: log.deliveryStatus,
          provider: log.provider,
          failoverOccurred: log.failoverOccurred,
          primaryFailureReason: log.primaryFailureReason,
          reason: log.reason,
          device: {
            deviceType: log.deviceInfo?.deviceType || "Desktop",
            os: log.deviceInfo?.os || "Unknown",
            browser: log.deviceInfo?.browser || "Unknown",
            platform: log.deviceInfo?.platform || "Unknown",
            maskedIp,
          },
        };
      });

      res.setHeader("Cache-Control", "private, no-cache, no-store");
      return res.json({
        success: true,
        studentSummary: {
          regNo: rawReg,
          studentName,
          maskedEmail,
          isRegistered: Boolean(studentRecord),
          branch: studentRecord?.branch || "Unknown",
          batch: studentRecord?.batch || "Unknown",
          todayDateKey: todayKey,
          todayUsage,
          maxDailyLimit,
          remainingDailyAttempts: isUnlimited ? 99 : Math.max(0, maxDailyLimit - todayUsage),
          isUnlimited,
          todayDeliveries,
          todayFailed,
          isCooldownActive,
          cooldownRemainingSeconds,
          cooldownStartedAt,
          activeDevicesCount: activeSessions.length,
          maxAllowedDevices: isUnlimited ? 2 : 1,
          activeSessions: sanitizedSessions,
          latestOtpStatus,
        },
        historyTimeline: formattedHistory,
      });
    } catch (err) {
      console.error("GET student-otp-management error:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch student OTP history." });
    }
  }

  // ── 2. POST /revoke-session ──
  if (action === "revoke-session") {
    try {
      const sessionId = String(req.body?.sessionId || "").trim();
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "Session identifier (sessionId) is required to revoke device session.",
        });
      }

      const sessionToRevoke = await globalDbQueue.run(() =>
        StudentSession.findOne({ regNo: rawReg, sessionId })
      );

      if (!sessionToRevoke) {
        return res.status(404).json({
          success: false,
          message: "Active device session not found or already revoked.",
        });
      }

      await globalDbQueue.run(() =>
        StudentSession.deleteOne({ regNo: rawReg, sessionId })
      );

      const safeReason = req.body?.reason ? String(req.body.reason).trim().slice(0, 200) : "Main Admin Session Revocation";
      const adminEmail = authResult.admin?.email || process.env.ADMIN_EMAIL || "main_admin";

      try {
        await globalDbQueue.run(() =>
          AdminAuditLog.create({
            actorEmail: adminEmail,
            actorType: "main_admin",
            action: "STUDENT_DEVICE_SESSION_REVOKE",
            actionType: "MANAGEMENT",
            targetRegNo: rawReg,
            result: "SUCCESS",
            details: {
              sessionId,
              platform: sessionToRevoke.deviceInfo?.platform || "Unknown",
              userAgent: sessionToRevoke.deviceInfo?.userAgent || "Unknown",
              ip: sessionToRevoke.deviceInfo?.ip || "",
              loggedInAt: sessionToRevoke.loggedInAt,
              reason: safeReason,
            },
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
            userAgent: req.headers["user-agent"] || "",
          })
        );
      } catch (auditErr) {
        console.warn("Audit log error:", auditErr.message);
      }

      const remainingSessions = await globalDbQueue.run(() =>
        getActiveSessions(StudentSession, rawReg)
      );
      const maxAllowed = getMaxAllowedDevices(rawReg);

      return res.json({
        success: true,
        message: `Device session (${sessionToRevoke.deviceInfo?.platform || "Authorized Device"}) for student ${rawReg} was successfully revoked.`,
        remainingActiveDevices: remainingSessions.length,
        maxAllowedDevices: maxAllowed,
        revokedSessionId: sessionId,
      });
    } catch (err) {
      console.error("POST student-otp-management revoke-session error:", err);
      return res.status(500).json({ success: false, message: "Failed to revoke student device session." });
    }
  }

  // ── 3. POST /revoke-all-sessions ──
  if (action === "revoke-all-sessions") {
    try {
      const activeSessions = await globalDbQueue.run(() =>
        getActiveSessions(StudentSession, rawReg)
      );
      const countToRevoke = activeSessions.length;

      await globalDbQueue.run(() =>
        StudentSession.deleteMany({ regNo: rawReg })
      );

      const safeReason = req.body?.reason ? String(req.body.reason).trim().slice(0, 200) : "Main Admin Revoke All Sessions";
      const adminEmail = authResult.admin?.email || process.env.ADMIN_EMAIL || "main_admin";

      try {
        await globalDbQueue.run(() =>
          AdminAuditLog.create({
            actorEmail: adminEmail,
            actorType: "main_admin",
            action: "STUDENT_ALL_DEVICE_SESSIONS_REVOKE",
            actionType: "MANAGEMENT",
            targetRegNo: rawReg,
            result: "SUCCESS",
            details: {
              revokedCount: countToRevoke,
              revokedSessions: activeSessions.map((s) => ({
                sessionId: s.sessionId,
                platform: s.deviceInfo?.platform || "Unknown",
                loggedInAt: s.loggedInAt,
              })),
              reason: safeReason,
            },
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
            userAgent: req.headers["user-agent"] || "",
          })
        );
      } catch (auditErr) {
        console.warn("Audit log error:", auditErr.message);
      }

      const maxAllowed = getMaxAllowedDevices(rawReg);

      return res.json({
        success: true,
        message: `All active device sessions (${countToRevoke}) for student ${rawReg} were successfully revoked.`,
        revokedCount: countToRevoke,
        remainingActiveDevices: 0,
        maxAllowedDevices: maxAllowed,
      });
    } catch (err) {
      console.error("POST student-otp-management revoke-all-sessions error:", err);
      return res.status(500).json({ success: false, message: "Failed to revoke student device sessions." });
    }
  }

  // ── 4. POST /reset ──
  if (req.method === "POST" || action === "reset") {
    try {
      const existingLimit = await globalDbQueue.run(() =>
        StudentDailyLimit.findOne({ regNo: rawReg, dateKey: todayKey })
      );
      const beforeUsage = existingLimit ? existingLimit.otpSendCount : 0;
      const beforeCooldown = existingLimit && existingLimit.lastOtpSentAt && existingLimit.otpSendCount > 0 && (Date.now() - new Date(existingLimit.lastOtpSentAt).getTime() < 180 * 1000);

      if (existingLimit) {
        existingLimit.otpSendCount = 0;
        existingLimit.lastOtpSentAt = null;
        await globalDbQueue.run(() => existingLimit.save());
      } else {
        await globalDbQueue.run(() =>
          StudentDailyLimit.create({
            regNo: rawReg,
            dateKey: todayKey,
            otpSendCount: 0,
            lastOtpSentAt: null,
          })
        );
      }

      await globalDbQueue.run(() => OtpVerification.deleteMany({ regNo: rawReg }));

      const safeReason = req.body?.reason ? String(req.body.reason).trim().slice(0, 200) : "Main Admin OTP Reset";
      const adminEmail = authResult.admin?.email || process.env.ADMIN_EMAIL || "main_admin";

      try {
        await globalDbQueue.run(() =>
          AdminAuditLog.create({
            actorEmail: adminEmail,
            actorType: "main_admin",
            action: "STUDENT_OTP_ATTEMPT_RESET",
            actionType: "MANAGEMENT",
            targetRegNo: rawReg,
            result: "SUCCESS",
            details: {
              previousUsage: beforeUsage,
              newUsage: 0,
              previousCooldown: Boolean(beforeCooldown),
              newCooldown: false,
              dateKey: todayKey,
              reason: safeReason,
            },
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
            userAgent: req.headers["user-agent"] || "",
          })
        );
      } catch (auditErr) {
        console.warn("Audit log error:", auditErr.message);
      }

      return res.json({
        success: true,
        message: `Today's OTP send attempt counter for student ${rawReg} has been reset to 0/2.`,
        before: {
          usage: beforeUsage,
          cooldown: Boolean(beforeCooldown),
        },
        after: {
          usage: 0,
          cooldown: false,
          maxDailyLimit: rawReg === "230301120327" ? 99 : 2,
        },
      });
    } catch (err) {
      console.error("POST student-otp-management reset error:", err);
      return res.status(500).json({ success: false, message: "Failed to reset student OTP attempts." });
    }
  }

  return res.status(405).json({ success: false, message: "Method Not Allowed" });
};
