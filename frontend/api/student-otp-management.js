const connectToDatabase = require("./_lib/db");
const AdminSession = require("./_lib/models/AdminSession");
const SubAdminSession = require("./_lib/models/SubAdminSession");
const SubAdmin = require("./_lib/models/SubAdmin");
const SemesterResult = require("./_lib/models/SemesterResult");
const StudentDailyLimit = require("./_lib/models/StudentDailyLimit");
const StudentSession = require("./_lib/models/StudentSession");
const OtpVerification = require("./_lib/models/OtpVerification");
const AdminOtpVerification = require("./_lib/models/AdminOtpVerification");
const SubAdminOtpVerification = require("./_lib/models/SubAdminOtpVerification");
const OtpRequestLog = require("./_lib/models/OtpRequestLog");
const AdminAuditLog = require("./_lib/models/AdminAuditLog");
const jwt = require("jsonwebtoken");
const { globalDbQueue } = require("./_lib/dbProtection");
const { getActiveSessions, getMaxAllowedDevices } = require("./_lib/sessionManager");
const { publishAdminRealtimeEvent, publishStudentRealtimeEvent } = require("./_lib/ablyService");

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
          return {
            error: "FORBIDDEN",
            status: 403,
            message: "Forbidden: Administrative access restricted. Student accounts cannot access administrative endpoints.",
          };
        }
      } catch {}
    }
    return { error: "AUTH_REQUIRED", status: 401, message: "Administrative authentication required." };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role === "student" || decoded.regNo) {
      return { error: "FORBIDDEN", status: 403, message: "Forbidden: Admin privileges required. Student accounts cannot access administrative endpoints." };
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

    // Connect to database only after cryptographic verification
    await connectToDatabase();

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

function sanitizeSession(s, idx, currentSessionId = null) {
  const ua = String(s.deviceInfo?.userAgent || "");
  const rawIp = String(s.deviceInfo?.ip || s.ip || "");
  const maskedIp = rawIp.includes(".")
    ? `${rawIp.split(".").slice(0, 2).join(".")}.***.***`
    : (rawIp ? "Hidden" : "Unknown");

  let os = s.deviceInfo?.os || "Unknown";
  if (os === "Unknown" || !os) {
    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone/i.test(ua)) os = "iOS";
    else if (/ipad/i.test(ua)) os = "iPadOS";
    else if (/linux/i.test(ua)) os = "Linux";
  }

  let browser = s.deviceInfo?.browser || "Unknown";
  if (browser === "Unknown" || !browser) {
    if (/edg/i.test(ua)) browser = "Edge";
    else if (/chrome|crios/i.test(ua)) browser = "Chrome";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua)) browser = "Safari";
    else if (/opera|opr/i.test(ua)) browser = "Opera";
  }

  let deviceType = s.deviceInfo?.deviceType || "Desktop";
  if (deviceType === "Desktop" || !deviceType || deviceType === "Unknown") {
    if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua) || os === "Android" || os === "iOS") {
      deviceType = "Mobile";
    } else if (/tablet|ipad|android(?!.*mobile)/i.test(ua) || os === "iPadOS") {
      deviceType = "Tablet";
    } else if (os === "Windows" || os === "macOS" || os === "Linux") {
      deviceType = "Laptop";
    }
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

  const isCurrent = Boolean(currentSessionId && s.sessionId === currentSessionId);

  return {
    deviceIndex: idx + 1,
    sessionId: s.sessionId,
    deviceId: s.deviceId,
    deviceType,
    os,
    browser,
    platform,
    userAgent: ua,
    ip: rawIp,
    maskedIp,
    loggedInAt: s.loggedInAt,
    lastActiveAt: s.lastActiveAt,
    loggedOutAt: s.loggedOutAt || s.revokedAt || null,
    logoutType: s.logoutType || (s.revokedAt ? "revoked" : null),
    revokeReason: s.revokeReason || null,
    expiresAt: s.expiresAt,
    isActive: Boolean(s.isActive),
    isCurrent,
    status: s.isActive ? "ACTIVE" : (s.logoutType === "student_manual" ? "SIGNED_OUT" : "REVOKED"),
  };
}

module.exports = async (req, res) => {
  if (applyCors(req, res, "GET,POST,OPTIONS")) return;

  const authResult = await authenticateMainAdmin(req);
  if (authResult.error) {
    return res.status(authResult.status).json({
      success: false,
      code: authResult.error,
      message: authResult.message,
    });
  }

  let action = req.query.action;
  if (!action && req.url) {
    if (req.url.includes("reset-admin-otp") || req.url.includes("admin-otp-reset")) action = "reset-admin-otp";
    else if (req.url.includes("admin-details") || req.url.includes("admin-sessions")) action = "admin-details";
    else if (req.url.includes("subadmin-details") || req.url.includes("subadmin-sessions")) action = "subadmin-details";
    else if (req.url.includes("revoke-admin-session")) action = "revoke-admin-session";
    else if (req.url.includes("revoke-all-admin-sessions")) action = "revoke-all-admin-sessions";
    else if (req.url.includes("revoke-subadmin-session")) action = "revoke-subadmin-session";
    else if (req.url.includes("revoke-all-subadmin-sessions")) action = "revoke-all-subadmin-sessions";
    else if (req.url.includes("reset-subadmin-otp")) action = "reset-subadmin-otp";
  }
  if (action === "admin-sessions") action = "admin-details";
  const paramRegNo = req.query.regNo;

  // ── 0. RESET ADMIN OTP LIMIT (NO REGNO REQUIRED) ──
  if (action === "reset-admin-otp" || action === "admin-otp-reset") {
    try {
      const todayKey = getIstDateKey();
      const rollingWindowMs = 24 * 60 * 60 * 1000;
      const yesterdayKey = getIstDateKey(new Date(Date.now() - rollingWindowMs));
      const AdminOtpVerification = require("./_lib/models/AdminOtpVerification");

      // Reset today's and rolling-window limits for Admin accounts
      const deleteResult = await globalDbQueue.run(() =>
        StudentDailyLimit.deleteMany({
          regNo: { $regex: /^ADMIN:/i },
          dateKey: { $in: [todayKey, yesterdayKey] },
        })
      );

      // Clean any unverified Admin OTP records
      await globalDbQueue.run(() => AdminOtpVerification.deleteMany({}));

      const adminEmail = authResult.admin?.email || process.env.ADMIN_EMAIL || "main_admin";

      try {
        await globalDbQueue.run(() =>
          AdminAuditLog.create({
            actorEmail: adminEmail,
            actorType: "main_admin",
            action: "ADMIN_OTP_LIMIT_RESET",
            actionType: "MANAGEMENT",
            targetRegNo: "ADMIN:GLOBAL",
            result: "SUCCESS",
            details: {
              dateKey: todayKey,
              deletedDailyLimitRecords: deleteResult.deletedCount,
            },
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
            userAgent: req.headers["user-agent"] || "",
          })
        );
      } catch (_) {}

      return res.json({
        success: true,
        message: `Today's Administrator OTP request counter has been reset to 0/5. 5 attempts are now available.`,
        dateKey: todayKey,
        maxDailyLimit: 5,
        remainingAttempts: 5,
      });
    } catch (adminResetErr) {
      console.error("Admin OTP reset error:", adminResetErr);
      return res.status(500).json({ success: false, message: "Failed to reset Administrator OTP limit." });
    }
  }

  // ── 0b. GET FULL ADMIN DETAILS & SESSIONS ──
  if (action === "admin-details" || action === "admin-sessions") {
    try {
      const todayKey = getIstDateKey();
      const currentSessionId = authResult.admin?.sessionId;
      const adminEmail = authResult.admin?.email || process.env.ADMIN_EMAIL || "jaganparida35@gmail.com";

      const [allAdminSessions, dailyLimit, activeOtp, auditLogs, otpLogs] = await Promise.all([
        globalDbQueue.run(() =>
          AdminSession.find({})
            .sort({ lastActiveAt: -1, updatedAt: -1 })
            .limit(20)
            .lean()
        ),
        globalDbQueue.run(() =>
          StudentDailyLimit.findOne({ regNo: { $regex: /^ADMIN:/i }, dateKey: todayKey })
        ),
        globalDbQueue.run(() =>
          AdminOtpVerification.findOne({ expiresAt: { $gt: new Date() } })
        ),
        globalDbQueue.run(() =>
          AdminAuditLog.find({
            $or: [
              { actorType: "main_admin" },
              { actorEmail: adminEmail },
              { action: { $regex: /ADMIN/i } },
            ],
          })
            .sort({ timestamp: -1 })
            .limit(30)
            .lean()
        ),
        globalDbQueue.run(() =>
          OtpRequestLog.find({ regNo: { $regex: /^ADMIN/i } })
            .sort({ timestamp: -1 })
            .limit(30)
            .lean()
        ),
      ]);

      const sanitizedActiveSessions = allAdminSessions
        .filter((s) => s.isActive && (!s.expiresAt || new Date(s.expiresAt) > new Date()))
        .map((s, idx) => sanitizeSession(s, idx, currentSessionId));

      const sanitizedRecentHistory = allAdminSessions.map((s, idx) =>
        sanitizeSession(s, idx, currentSessionId)
      );

      const latestLoggedOut = allAdminSessions.find(
        (s) => !s.isActive && (s.loggedOutAt || s.revokedAt)
      );
      const mostRecentSession = allAdminSessions[0]
        ? sanitizeSession(allAdminSessions[0], 0, currentSessionId)
        : null;

      const lastLogoutInfo = latestLoggedOut
        ? {
            device: sanitizeSession(latestLoggedOut, 0, currentSessionId),
            loggedOutAt: latestLoggedOut.loggedOutAt || latestLoggedOut.revokedAt,
            lastActiveAt: latestLoggedOut.lastActiveAt,
            reason: latestLoggedOut.revokeReason || "Administrator session revoked",
            logoutType: "revoked",
          }
        : (mostRecentSession && !mostRecentSession.isActive
            ? {
                device: mostRecentSession,
                loggedOutAt: mostRecentSession.loggedOutAt || mostRecentSession.lastActiveAt,
                lastActiveAt: mostRecentSession.lastActiveAt,
                reason: mostRecentSession.revokeReason || "Previous session ended",
                logoutType: "ended",
              }
            : null);

      const todayUsage = dailyLimit ? dailyLimit.otpSendCount : 0;
      const maxDailyLimit = 5;

      let isCooldownActive = false;
      let cooldownRemainingSeconds = 0;
      let cooldownStartedAt = null;

      if (dailyLimit && dailyLimit.lastOtpSentAt && dailyLimit.otpSendCount > 0) {
        const timeSinceLastSend = Date.now() - new Date(dailyLimit.lastOtpSentAt).getTime();
        if (timeSinceLastSend < 180 * 1000) {
          isCooldownActive = true;
          cooldownRemainingSeconds = Math.ceil((180 * 1000 - timeSinceLastSend) / 1000);
          cooldownStartedAt = dailyLimit.lastOtpSentAt;
        }
      }

      const latestOtpStatus = activeOtp ? "ACTIVE" : "NONE";

      const maskedEmail = adminEmail.includes("@")
        ? `${adminEmail.slice(0, 4)}***@${adminEmail.split("@")[1]}`
        : "jaga***@gmail.com";

      const istFormatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
      });

      const formattedFromOtp = (otpLogs || []).map((log) => {
        const ip = String(log.deviceInfo?.ip || "");
        const maskedIp = ip.includes(".")
          ? `${ip.split(".").slice(0, 2).join(".")}.***.***`
          : (ip ? "Hidden" : "Unknown");
        return {
          id: log._id,
          timestamp: log.timestamp || log.createdAt,
          formattedTime: istFormatter.format(new Date(log.timestamp || log.createdAt)),
          dateKey: log.dateKey || todayKey,
          status: log.status || "DELIVERED",
          deliveryStatus: log.deliveryStatus || "DELIVERED",
          provider: log.provider || "SYSTEM",
          failoverOccurred: Boolean(log.failoverOccurred),
          primaryFailureReason: log.primaryFailureReason || null,
          reason: log.reason || "Administrator OTP Request",
          device: {
            deviceType: log.deviceInfo?.deviceType || "Desktop",
            os: log.deviceInfo?.os || "Windows",
            browser: log.deviceInfo?.browser || "Chrome",
            platform: log.deviceInfo?.platform || "Authorized Admin Console",
            maskedIp,
          },
        };
      });

      const formattedFromAudit = (auditLogs || []).map((log) => {
        const ip = String(log.ip || "");
        const maskedIp = ip.includes(".")
          ? `${ip.split(".").slice(0, 2).join(".")}.***.***`
          : (ip ? "Hidden" : "Unknown");

        let status = "DELIVERED";
        if (log.result === "FAILED" || log.result === "DENIED" || log.result === "FORBIDDEN") {
          status = "FAILED";
        }

        const actionText = (log.action || "ADMIN_AUDIT").replace(/_/g, " ");

        return {
          id: log._id,
          timestamp: log.timestamp || log.createdAt,
          formattedTime: istFormatter.format(new Date(log.timestamp || log.createdAt)),
          dateKey: todayKey,
          status,
          deliveryStatus: status === "DELIVERED" ? "DELIVERED" : "FAILED",
          provider: "AUDIT",
          failoverOccurred: false,
          primaryFailureReason: null,
          reason: actionText,
          device: {
            deviceType: "Desktop",
            os: "Secure Admin Console",
            browser: "Admin Workspace",
            platform: "Authorized Administrator Device",
            maskedIp,
          },
        };
      });

      const combinedTimeline = [...formattedFromOtp, ...formattedFromAudit]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 50);

      const adminSummary = {
        regNo: "MAIN_ADMIN",
        studentName: "Main Administrator",
        maskedEmail,
        fullEmail: adminEmail,
        isRegistered: true,
        branch: "System Administration",
        batch: "Chief Security Control",
        roleTitle: "Institutional Chief Administrator",
        todayDateKey: todayKey,
        todayUsage,
        maxDailyLimit,
        remainingDailyAttempts: Math.max(0, maxDailyLimit - todayUsage),
        isUnlimited: false,
        todayDeliveries: todayUsage,
        todayFailed: 0,
        isCooldownActive,
        cooldownRemainingSeconds,
        cooldownStartedAt,
        activeDevicesCount: sanitizedActiveSessions.length,
        maxAllowedDevices: 2,
        activeSessions: sanitizedActiveSessions,
        recentSessions: sanitizedRecentHistory,
        lastLogoutInfo,
        lastActiveDevice: mostRecentSession,
        latestOtpStatus,
      };

      res.setHeader("Cache-Control", "private, no-cache, no-store");
      return res.json({
        success: true,
        currentSessionId,
        adminData: adminSummary,
        studentSummary: adminSummary,
        historyTimeline: combinedTimeline,
        sessions: sanitizedActiveSessions,
      });
    } catch (adminSessionsErr) {
      console.error("Fetch Admin Details Error:", adminSessionsErr);
      return res.status(500).json({ success: false, message: "Failed to fetch administrator details." });
    }
  }

  // ── 0c. REVOKE SPECIFIC ADMIN SESSION ──
  if (action === "revoke-admin-session") {
    try {
      let targetSessionId = String(req.query.sessionId || req.body?.sessionId || "").trim();
      if (!targetSessionId && req.url) {
        const match = req.url.match(/revoke-admin-session\/([a-zA-Z0-9_-]+)/);
        if (match) targetSessionId = match[1];
      }
      const reason = String(req.body?.reason || "MANUAL_REVOCATION_BY_MAIN_ADMIN").trim();

      if (!targetSessionId) {
        return res.status(400).json({
          success: false,
          message: "Session ID is required to revoke an admin session.",
        });
      }

      const revokedSession = await globalDbQueue.run(() =>
        AdminSession.findOneAndUpdate(
          { sessionId: targetSessionId, isActive: true },
          {
            $set: {
              isActive: false,
              revokedAt: new Date(),
              revokeReason: reason,
            },
          },
          { new: true }
        )
      );

      if (!revokedSession) {
        return res.status(404).json({
          success: false,
          message: "Active administrator session not found or already terminated.",
        });
      }

      // Realtime eviction via Ably on admin-control channel
      try {
        await publishAdminRealtimeEvent("session-revoked", {
          sessionId: targetSessionId,
          revokedSessionId: targetSessionId,
          reason,
          timestamp: Date.now(),
        });
      } catch (ablyErr) {
        console.warn("Ably publish error on admin session revocation:", ablyErr.message);
      }

      const adminEmail = authResult.admin?.email || process.env.ADMIN_EMAIL || "main_admin";

      try {
        await globalDbQueue.run(() =>
          AdminAuditLog.create({
            actorEmail: adminEmail,
            actorType: "main_admin",
            action: "ADMIN_SESSION_REVOKED",
            actionType: "SECURITY_ALERT",
            targetRegNo: `ADMIN:${targetSessionId}`,
            result: "SUCCESS",
            details: {
              targetSessionId,
              deviceInfo: revokedSession.deviceInfo,
              reason,
            },
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
            userAgent: req.headers["user-agent"] || "",
          })
        );
      } catch (_) {}

      return res.json({
        success: true,
        message: "Administrator session revoked successfully.",
        sessionId: targetSessionId,
      });
    } catch (revokeErr) {
      console.error("Revoke Admin Session Error:", revokeErr);
      return res.status(500).json({ success: false, message: "Failed to revoke administrator session." });
    }
  }

  // ── 0d. REVOKE ALL (OR ALL OTHER) ADMIN SESSIONS ──
  if (action === "revoke-all-admin-sessions") {
    try {
      const currentSessionId = authResult.admin?.sessionId;
      const revokeCurrent = req.body?.revokeCurrent === true;
      const reason = String(req.body?.reason || "ALL_ADMIN_SESSIONS_REVOKED_BY_MAIN_ADMIN").trim();

      const filter = { isActive: true };
      if (!revokeCurrent && currentSessionId) {
        filter.sessionId = { $ne: currentSessionId };
      }

      const updateResult = await globalDbQueue.run(() =>
        AdminSession.updateMany(filter, {
          $set: {
            isActive: false,
            revokedAt: new Date(),
            revokeReason: reason,
          },
        })
      );

      // Realtime eviction via Ably
      try {
        await publishAdminRealtimeEvent("session-revoked", {
          all: true,
          exceptSessionId: revokeCurrent ? null : currentSessionId,
          reason,
          timestamp: Date.now(),
        });
      } catch (ablyErr) {
        console.warn("Ably publish error on revoke all admin sessions:", ablyErr.message);
      }

      const adminEmail = authResult.admin?.email || process.env.ADMIN_EMAIL || "main_admin";

      try {
        await globalDbQueue.run(() =>
          AdminAuditLog.create({
            actorEmail: adminEmail,
            actorType: "main_admin",
            action: "ALL_ADMIN_SESSIONS_REVOKED",
            actionType: "SECURITY_ALERT",
            targetRegNo: "ADMIN:ALL",
            result: "SUCCESS",
            details: {
              revokedCount: updateResult.modifiedCount,
              keptCurrent: !revokeCurrent,
              reason,
            },
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "",
            userAgent: req.headers["user-agent"] || "",
          })
        );
      } catch (_) {}

      return res.json({
        success: true,
        message: revokeCurrent
          ? `All administrator sessions (${updateResult.modifiedCount}) have been revoked.`
          : `All other administrator sessions (${updateResult.modifiedCount}) have been revoked. Current session retained.`,
        revokedCount: updateResult.modifiedCount,
      });
    } catch (revokeAllErr) {
      console.error("Revoke All Admin Sessions Error:", revokeAllErr);
      return res.status(500).json({ success: false, message: "Failed to revoke administrator sessions." });
    }
  }

  // ── 0e. GET SUB-ADMIN DETAILS & SESSIONS ──
  if (action === "subadmin-details" || action === "subadmin-sessions") {
    try {
      const todayKey = getIstDateKey();

      const subAdmins = await globalDbQueue.run(() =>
        SubAdmin.find()
          .select("_id name email status role permissions createdAt")
          .lean()
      );

      let targetSubAdminId = String(req.query.subAdminId || req.body?.subAdminId || "").trim();
      let targetEmail = String(req.query.email || req.body?.email || "").trim().toLowerCase();

      let selected = null;
      if (targetSubAdminId) {
        selected = subAdmins.find((s) => String(s._id) === targetSubAdminId);
      } else if (targetEmail) {
        selected = subAdmins.find((s) => s.email.toLowerCase() === targetEmail);
      }
      if (!selected && subAdmins.length > 0) {
        selected = subAdmins[0];
      }

      if (!selected) {
        return res.json({
          success: true,
          subAdmins: [],
          selectedSubAdminId: null,
          selectedSubAdmin: null,
          studentSummary: null,
          historyTimeline: [],
          sessions: [],
        });
      }

      const subAdminEmail = selected.email;
      const subAdminAccountKey = "SUBADMIN:" + subAdminEmail.toLowerCase();

      const [allSubAdminSessions, dailyLimit, activeOtp, auditLogs] = await Promise.all([
        globalDbQueue.run(() =>
          SubAdminSession.find({ subAdminId: selected._id })
            .sort({ lastActiveAt: -1, updatedAt: -1 })
            .limit(20)
            .lean()
        ),
        globalDbQueue.run(() =>
          StudentDailyLimit.findOne({ regNo: subAdminAccountKey, dateKey: todayKey })
        ),
        globalDbQueue.run(() =>
          SubAdminOtpVerification.findOne({ email: subAdminEmail.toLowerCase(), expiresAt: { $gt: new Date() } })
        ),
        globalDbQueue.run(() =>
          AdminAuditLog.find({
            $or: [
              { actorEmail: subAdminEmail },
              { targetId: subAdminEmail },
              { "details.subAdminId": String(selected._id) },
            ],
          })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean()
        ),
      ]);

      const sanitizedActiveSessions = allSubAdminSessions
        .filter((s) => s.isActive && (!s.expiresAt || new Date(s.expiresAt) > new Date()))
        .map((s, idx) => sanitizeSession(s, idx));

      const sanitizedRecentHistory = allSubAdminSessions.map((s, idx) =>
        sanitizeSession(s, idx)
      );

      const latestLoggedOut = allSubAdminSessions.find(
        (s) => !s.isActive && (s.loggedOutAt || s.revokedAt)
      );
      const mostRecentSession = allSubAdminSessions[0]
        ? sanitizeSession(allSubAdminSessions[0], 0)
        : null;

      const lastLogoutInfo = latestLoggedOut
        ? {
            device: sanitizeSession(latestLoggedOut, 0),
            loggedOutAt: latestLoggedOut.loggedOutAt || latestLoggedOut.revokedAt,
            lastActiveAt: latestLoggedOut.lastActiveAt,
            reason: latestLoggedOut.revokeReason || "Sub-administrator session revoked",
            logoutType: "revoked",
          }
        : (mostRecentSession && !mostRecentSession.isActive
            ? {
                device: mostRecentSession,
                loggedOutAt: mostRecentSession.loggedOutAt || mostRecentSession.lastActiveAt,
                lastActiveAt: mostRecentSession.lastActiveAt,
                reason: mostRecentSession.revokeReason || "Previous session ended",
                logoutType: "ended",
              }
            : null);

      const todayUsage = dailyLimit ? dailyLimit.otpSendCount : 0;
      const maxDailyLimit = 5;

      let isCooldownActive = false;
      let cooldownRemainingSeconds = 0;
      let cooldownStartedAt = null;

      if (dailyLimit && dailyLimit.lastOtpSentAt && dailyLimit.otpSendCount > 0) {
        const timeSinceLastSend = Date.now() - new Date(dailyLimit.lastOtpSentAt).getTime();
        if (timeSinceLastSend < 180 * 1000) {
          isCooldownActive = true;
          cooldownRemainingSeconds = Math.ceil((180 * 1000 - timeSinceLastSend) / 1000);
          cooldownStartedAt = dailyLimit.lastOtpSentAt;
        }
      }

      const latestOtpStatus = activeOtp ? "ACTIVE" : "NONE";

      const maskedEmail = subAdminEmail.includes("@")
        ? `${subAdminEmail.slice(0, 4)}***@${subAdminEmail.split("@")[1]}`
        : "sub***@centurion.edu.in";

      const routesList = (selected.permissions?.routes || []).join(", ");
      const actionsCount = (selected.permissions?.actions || []).length;

      const istFormatter = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
      });

      const formattedTimeline = auditLogs.map((log) => {
        const ip = String(log.ip || "");
        const maskedIp = ip.includes(".")
          ? `${ip.split(".").slice(0, 2).join(".")}.***.***`
          : (ip ? "Hidden" : "Unknown");

        let status = "DELIVERED";
        if (log.result === "FAILED" || log.result === "DENIED" || log.result === "FORBIDDEN") {
          status = "FAILED";
        }

        const actionText = (log.action || "SUBADMIN_ACTION").replace(/_/g, " ");

        return {
          id: log._id,
          timestamp: log.timestamp || log.createdAt,
          formattedTime: istFormatter.format(new Date(log.timestamp || log.createdAt)),
          dateKey: todayKey,
          status,
          deliveryStatus: status === "DELIVERED" ? "DELIVERED" : "FAILED",
          provider: "AUDIT",
          failoverOccurred: false,
          primaryFailureReason: null,
          reason: actionText,
          device: {
            deviceType: "Desktop",
            os: "Delegated Console",
            browser: "Protected Console",
            platform: "Sub-Admin Console",
            maskedIp,
          },
        };
      });

      const subAdminSummary = {
        regNo: `SUBADMIN:${subAdminEmail.split("@")[0].toUpperCase()}`,
        subAdminId: String(selected._id),
        studentName: selected.name,
        maskedEmail,
        fullEmail: subAdminEmail,
        isRegistered: true,
        branch: routesList ? `Routes: ${routesList}` : "Delegated Sub-Admin",
        batch: `${actionsCount} Granted Actions`,
        roleTitle: "Institutional Sub-Administrator",
        status: selected.status || "active",
        todayDateKey: todayKey,
        todayUsage,
        maxDailyLimit,
        remainingDailyAttempts: Math.max(0, maxDailyLimit - todayUsage),
        isUnlimited: false,
        todayDeliveries: todayUsage,
        todayFailed: 0,
        isCooldownActive,
        cooldownRemainingSeconds,
        cooldownStartedAt,
        activeDevicesCount: sanitizedActiveSessions.length,
        maxAllowedDevices: 2,
        activeSessions: sanitizedActiveSessions,
        recentSessions: sanitizedRecentHistory,
        lastLogoutInfo,
        lastActiveDevice: mostRecentSession,
        latestOtpStatus,
      };

      res.setHeader("Cache-Control", "private, no-cache, no-store");
      return res.json({
        success: true,
        subAdmins: subAdmins.map((s) => ({
          _id: String(s._id),
          name: s.name,
          email: s.email,
          status: s.status,
          role: s.role,
          permissions: s.permissions,
        })),
        selectedSubAdminId: String(selected._id),
        selectedSubAdmin: subAdminSummary,
        studentSummary: subAdminSummary,
        historyTimeline: formattedTimeline,
        sessions: sanitizedActiveSessions,
      });
    } catch (subAdminDetailsErr) {
      console.error("Fetch SubAdmin Details Error:", subAdminDetailsErr);
      return res.status(500).json({ success: false, message: "Failed to fetch sub-administrator details." });
    }
  }

  // ── 0f. REVOKE SPECIFIC SUBADMIN SESSION ──
  if (action === "revoke-subadmin-session") {
    try {
      let targetSessionId = String(req.query.sessionId || req.body?.sessionId || "").trim();
      if (!targetSessionId && req.url) {
        const match = req.url.match(/revoke-subadmin-session\/([a-zA-Z0-9_-]+)/);
        if (match) targetSessionId = match[1];
      }
      const reason = String(req.body?.reason || "MANUAL_REVOCATION_BY_MAIN_ADMIN").trim();

      if (!targetSessionId) {
        return res.status(400).json({
          success: false,
          message: "Session ID is required to revoke a sub-admin session.",
        });
      }

      const revokedSession = await globalDbQueue.run(() =>
        SubAdminSession.findOneAndUpdate(
          { sessionId: targetSessionId, isActive: true },
          {
            $set: {
              isActive: false,
              revokedAt: new Date(),
              revokeReason: reason,
            },
          },
          { new: true }
        )
      );

      if (!revokedSession) {
        return res.status(404).json({
          success: false,
          message: "Active sub-administrator session not found or already terminated.",
        });
      }

      try {
        await publishAdminRealtimeEvent("subadmin-session-revoked", {
          sessionId: targetSessionId,
          subAdminId: revokedSession.subAdminId,
          reason,
          timestamp: Date.now(),
        });
      } catch (_) {}

      return res.json({
        success: true,
        message: "Sub-administrator session revoked successfully.",
        sessionId: targetSessionId,
      });
    } catch (revokeErr) {
      console.error("Revoke SubAdmin Session Error:", revokeErr);
      return res.status(500).json({ success: false, message: "Failed to revoke sub-administrator session." });
    }
  }

  // ── 0g. REVOKE ALL SESSIONS FOR SUBADMIN ──
  if (action === "revoke-all-subadmin-sessions") {
    try {
      const targetSubAdminId = String(req.body?.subAdminId || req.query.subAdminId || "").trim();
      const reason = String(req.body?.reason || "ALL_SESSIONS_REVOKED_BY_MAIN_ADMIN").trim();

      const filter = { isActive: true };
      if (targetSubAdminId) {
        filter.subAdminId = targetSubAdminId;
      }

      const updateResult = await globalDbQueue.run(() =>
        SubAdminSession.updateMany(filter, {
          $set: {
            isActive: false,
            revokedAt: new Date(),
            revokeReason: reason,
          },
        })
      );

      try {
        await publishAdminRealtimeEvent("subadmin-session-revoked", {
          all: true,
          subAdminId: targetSubAdminId,
          reason,
          timestamp: Date.now(),
        });
      } catch (_) {}

      return res.json({
        success: true,
        message: `All active sessions (${updateResult.modifiedCount}) for sub-administrator have been revoked.`,
        revokedCount: updateResult.modifiedCount,
      });
    } catch (revokeAllErr) {
      console.error("Revoke All SubAdmin Sessions Error:", revokeAllErr);
      return res.status(500).json({ success: false, message: "Failed to revoke sub-administrator sessions." });
    }
  }

  // ── 0h. RESET SUBADMIN OTP LIMIT ──
  if (action === "reset-subadmin-otp") {
    try {
      const subAdminEmail = String(req.body?.email || req.query.email || "").trim().toLowerCase();
      if (!subAdminEmail) {
        return res.status(400).json({ success: false, message: "Sub-administrator email is required to reset OTP counter." });
      }

      const todayKey = getIstDateKey();
      const rollingWindowMs = 24 * 60 * 60 * 1000;
      const yesterdayKey = getIstDateKey(new Date(Date.now() - rollingWindowMs));

      await globalDbQueue.run(() =>
        StudentDailyLimit.deleteMany({
          regNo: "SUBADMIN:" + subAdminEmail,
          dateKey: { $in: [todayKey, yesterdayKey] },
        })
      );

      await globalDbQueue.run(() =>
        SubAdminOtpVerification.deleteMany({ email: subAdminEmail })
      );

      return res.json({
        success: true,
        message: `Today's OTP counter for sub-administrator (${subAdminEmail}) has been reset to 0/5.`,
        remainingAttempts: 5,
      });
    } catch (resetSubAdminErr) {
      console.error("Reset SubAdmin OTP Error:", resetSubAdminErr);
      return res.status(500).json({ success: false, message: "Failed to reset sub-administrator OTP limit." });
    }
  }

  const rawReg = String(paramRegNo || req.body?.regNo || "").trim().toUpperCase();

  if (!rawReg || !/^[a-zA-Z0-9_-]{3,30}$/.test(rawReg)) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration number format. Must be 3-30 alphanumeric characters.",
    });
  }

  const todayKey = getIstDateKey();
  const isSpecialStudent = rawReg === "230301120327";
  const isUnlimited = isSpecialStudent;
  const maxDailyLimit = isSpecialStudent ? 5 : 3;

  // ── 1. GET /history ──
  if (req.method === "GET" || action === "history") {
    try {
      // Parallel fetch all independent student data sources for maximum throughput.
      // Fixed .select to include "branch batch" (was missing, causing undefined in response).
      const [studentRecord, dailyLimit, allRecentSessions, activeOtp, requestLogs] = await Promise.all([
        globalDbQueue.run(() =>
          SemesterResult.findOne({ regNo: rawReg }).sort({ semester: -1 }).select("studentName branch batch").lean()
        ),
        globalDbQueue.run(() =>
          StudentDailyLimit.findOne({ regNo: rawReg, dateKey: todayKey })
        ),
        globalDbQueue.run(() =>
          StudentSession.find({ regNo: rawReg })
            .select("sessionId isActive expiresAt deviceInfo loggedInAt lastActiveAt updatedAt loggedOutAt revokedAt logoutType revokeReason")
            .sort({ lastActiveAt: -1, updatedAt: -1 })
            .limit(10)
            .lean()
        ),
        globalDbQueue.run(() => OtpVerification.findOne({ regNo: rawReg })),
        globalDbQueue.run(() =>
          OtpRequestLog.find({ regNo: rawReg }).sort({ timestamp: -1 }).limit(50).lean()
        ),
      ]);

      const studentName = studentRecord?.studentName || "Student";
      const studentEmail = `${rawReg.toLowerCase()}@centurionuniv.edu.in`;
      const maskedEmail = `${studentEmail.slice(0, 4)}***@${studentEmail.split("@")[1]}`;

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

      const maxAllowedDevices = getMaxAllowedDevices(rawReg);

      const sanitizedActiveSessions = allRecentSessions.filter((s) => s.isActive).map((s, idx) => sanitizeSession(s, idx));
      const sanitizedRecentHistory = allRecentSessions.map((s, idx) => sanitizeSession(s, idx));

      const latestLoggedOut = allRecentSessions.find((s) => !s.isActive && (s.loggedOutAt || s.revokedAt));
      const mostRecentSession = allRecentSessions[0] ? sanitizeSession(allRecentSessions[0], 0) : null;

      const lastLogoutInfo = latestLoggedOut
        ? {
            device: sanitizeSession(latestLoggedOut, 0),
            loggedOutAt: latestLoggedOut.loggedOutAt || latestLoggedOut.revokedAt,
            lastActiveAt: latestLoggedOut.lastActiveAt,
            reason: latestLoggedOut.revokeReason || (latestLoggedOut.logoutType === "student_manual" ? "Signed out manually by student" : "Session ended"),
            logoutType: latestLoggedOut.logoutType || "manual",
          }
        : (mostRecentSession && !mostRecentSession.isActive
            ? {
                device: mostRecentSession,
                loggedOutAt: mostRecentSession.loggedOutAt || mostRecentSession.lastActiveAt,
                lastActiveAt: mostRecentSession.lastActiveAt,
                reason: mostRecentSession.revokeReason || "Previous session ended",
                logoutType: "ended",
              }
            : null);

      let latestOtpStatus = "NONE";
      if (activeOtp) {
        latestOtpStatus = new Date(activeOtp.expiresAt) > new Date() ? "ACTIVE" : "EXPIRED";
      }

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
          remainingDailyAttempts: Math.max(0, maxDailyLimit - todayUsage),
          isUnlimited,
          todayDeliveries,
          todayFailed,
          isCooldownActive,
          cooldownRemainingSeconds,
          cooldownStartedAt,
          activeDevicesCount: sanitizedActiveSessions.length,
          maxAllowedDevices: isSpecialStudent ? 2 : 1,
          activeSessions: sanitizedActiveSessions,
          recentSessions: sanitizedRecentHistory,
          lastLogoutInfo,
          lastActiveDevice: mostRecentSession,
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

      const now = new Date();
      const safeReason = req.body?.reason ? String(req.body.reason).trim().slice(0, 200) : "Main Admin Session Revocation";

      await globalDbQueue.run(() =>
        StudentSession.updateOne(
          { regNo: rawReg, sessionId },
          {
            $set: {
              isActive: false,
              loggedOutAt: now,
              lastActiveAt: now,
              logoutType: "admin_revoked",
              revokedAt: now,
              revokeReason: safeReason,
            },
          }
        )
      );

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

      try {
        await Promise.allSettled([
          publishAdminRealtimeEvent("otp-updated", { regNo: rawReg, timestamp: Date.now() }),
          publishStudentRealtimeEvent(rawReg, "session-revoked", {
            revokedSessionId: sessionId,
            message: "Your session was ended by Institutional Administrator.",
          }),
        ]);
      } catch (e) {
        console.warn("[Ably] Revoke session publish warning:", e?.message || e);
      }

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

      const now = new Date();
      const safeReason = req.body?.reason ? String(req.body.reason).trim().slice(0, 200) : "Main Admin Revoke All Sessions";

      await globalDbQueue.run(() =>
        StudentSession.updateMany(
          { regNo: rawReg, isActive: true },
          {
            $set: {
              isActive: false,
              loggedOutAt: now,
              lastActiveAt: now,
              logoutType: "admin_revoked_all",
              revokedAt: now,
              revokeReason: safeReason,
            },
          }
        )
      );
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

      try {
        await Promise.allSettled([
          publishAdminRealtimeEvent("otp-updated", { regNo: rawReg, timestamp: Date.now() }),
          publishStudentRealtimeEvent(rawReg, "session-revoked", {
            allSessionsRevoked: true,
            message: "All active sessions were ended by Institutional Administrator.",
          }),
        ]);
      } catch (e) {
        console.warn("[Ably] Revoke all sessions publish warning:", e?.message || e);
      }

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
      const rollingWindowMs = 24 * 60 * 60 * 1000;
      const yesterdayKey = getIstDateKey(new Date(Date.now() - rollingWindowMs));

      const existingLimits = await globalDbQueue.run(() =>
        StudentDailyLimit.find({ regNo: rawReg, dateKey: { $in: [todayKey, yesterdayKey] } })
      );
      const todayDoc = existingLimits.find((d) => d.dateKey === todayKey);
      const beforeUsage = todayDoc ? todayDoc.otpSendCount : 0;
      const beforeCooldown =
        todayDoc &&
        todayDoc.lastOtpSentAt &&
        todayDoc.otpSendCount > 0 &&
        Date.now() - new Date(todayDoc.lastOtpSentAt).getTime() < 180 * 1000;

      // Fully reset all records in rolling 24-hour window (including sendTimestamps)
      await globalDbQueue.run(() =>
        StudentDailyLimit.updateMany(
          { regNo: rawReg, dateKey: { $in: [todayKey, yesterdayKey] } },
          {
            $set: {
              otpSendCount: 0,
              lastOtpSentAt: null,
              sendTimestamps: [],
            },
          }
        )
      );

      // Ensure today's document is cleanly initialized
      await globalDbQueue.run(() =>
        StudentDailyLimit.updateOne(
          { regNo: rawReg, dateKey: todayKey },
          {
            $set: {
              otpSendCount: 0,
              lastOtpSentAt: null,
              sendTimestamps: [],
            },
          },
          { upsert: true }
        )
      );

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

      try {
        await publishAdminRealtimeEvent("otp-updated", { regNo: rawReg, timestamp: Date.now() });
      } catch (e) {
        console.warn("[Ably] OTP updated publish warning:", e?.message || e);
      }

      return res.json({
        success: true,
        message: `Today's OTP send attempt counter for student ${rawReg} has been reset to 0/${maxDailyLimit}.`,
        before: {
          usage: beforeUsage,
          cooldown: Boolean(beforeCooldown),
        },
        after: {
          usage: 0,
          cooldown: false,
          maxDailyLimit,
        },
      });
    } catch (err) {
      console.error("POST student-otp-management reset error:", err);
      return res.status(500).json({ success: false, message: "Failed to reset student OTP attempts." });
    }
  }

  return res.status(405).json({ success: false, message: "Method Not Allowed" });
};
