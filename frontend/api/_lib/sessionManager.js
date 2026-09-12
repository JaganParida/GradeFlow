const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const EventEmitter = require("events");

const DeviceApprovalRequest = require("./models/DeviceApprovalRequest");
const StudentNotification = require("./models/StudentNotification");
const {
  publishStudentRealtimeEvent,
  publishApprovalRealtimeEvent,
  broadcastRealtimeEvent,
} = require("./ablyService");

const DEFAULT_SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days rolling session TTL
const PERMANENT_SESSION_MS = DEFAULT_SESSION_TTL_MS;
const MAX_ADMIN_DEVICES = 2; // Maximum simultaneous active devices for Admin
const MAX_SUBADMIN_DEVICES = 2; // Maximum simultaneous active devices for Sub-Admin
const APPROVAL_TTL_MS = 3 * 60 * 1000; // 3 minutes TTL for device approval requests

// Global event bus for SSE real-time notifications & session revocation events
const authEventBus = new EventEmitter();
authEventBus.setMaxListeners(200);

/**
 * Returns the maximum allowed simultaneous active devices for a student registration number.
 * 230301120327 = 2 devices
 * All other registration numbers = 1 device
 */
function getMaxAllowedDevices(regNo) {
  const clean = String(regNo || "").trim().toUpperCase();
  return clean === "230301120327" ? 2 : 1;
}

/**
 * Cleans up explicitly revoked/inactive student sessions from MongoDB.
 */
async function cleanExpiredSessions(StudentSession, regNo = null) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const filter = {
    $or: [
      { isActive: false, updatedAt: { $lt: thirtyDaysAgo } },
      { expiresAt: { $lte: thirtyDaysAgo } },
    ],
  };
  if (regNo) {
    filter.regNo = String(regNo).trim().toUpperCase();
  }
  await StudentSession.deleteMany(filter);
}

/**
 * Single Authoritative Server-Side Function: Returns all genuinely valid active sessions.
 * Queries active, unexpired sessions without write-on-read locks.
 */
async function getValidActiveSessions(StudentSession, regNo) {
  const clean = String(regNo || "").trim().toUpperCase();

  return StudentSession.find({
    regNo: clean,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ loggedInAt: -1 });
}

// Alias for backward compatibility
const getActiveSessions = getValidActiveSessions;

const userSessionLocks = new Map();

async function withUserLock(key, fn) {
  while (userSessionLocks.has(key)) {
    try {
      await userSessionLocks.get(key);
    } catch {}
  }
  let releaseLock;
  const lockPromise = new Promise((resolve) => {
    releaseLock = resolve;
  });
  userSessionLocks.set(key, lockPromise);
  try {
    return await fn();
  } finally {
    userSessionLocks.delete(key);
    releaseLock();
  }
}

/**
 * Atomically replaces an active session for normal students (limit = 1).
 * Serialized via per-student lock to guarantee zero race conditions under concurrent requests.
 */
async function replaceStudentSession(StudentSession, regNo, sessionData) {
  const clean = String(regNo || "").trim().toUpperCase();
  const maxAllowed = getMaxAllowedDevices(clean);

  return withUserLock(`student_session_${clean}`, async () => {
    let wasReplaced = false;

    // 1. If single-device student (limit = 1), revoke all existing active sessions
    if (maxAllowed === 1) {
      const updateResult = await StudentSession.updateMany(
        {
          regNo: clean,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            revokedAt: new Date(),
            revokeReason: "REPLACED_BY_NEW_DEVICE",
          },
        }
      );
      wasReplaced = (updateResult.modifiedCount || updateResult.nModified || 0) > 0;
    }

    // 2. Create the new active session
    const newSession = await StudentSession.create({
      regNo: clean,
      sessionId: sessionData.sessionId || crypto.randomUUID(),
      deviceId: sessionData.deviceId || crypto.randomUUID(),
      tokenHash: sessionData.tokenHash || "",
      deviceInfo: sessionData.deviceInfo || {},
      loggedInAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: sessionData.expiresAt || new Date(Date.now() + PERMANENT_SESSION_MS),
      isActive: true,
    });

    return { newSession, wasReplaced, previousSession: null };
  });
}

/**
 * Creates a pending DeviceApprovalRequest and an in-app StudentNotification for the active device.
 */
async function createDeviceApprovalRequest(regNo, requestingDeviceInfo, targetSessionId) {
  const clean = String(regNo || "").trim().toUpperCase();
  const requestId = crypto.randomUUID();
  const notificationId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + APPROVAL_TTL_MS);

  // Generate single-use cryptographic exchange secret (PKCE-style)
  const exchangeSecret = crypto.randomBytes(32).toString("hex");
  const exchangeHash = crypto.createHash("sha256").update(exchangeSecret).digest("hex");

  // Invalidate any existing pending requests for this student
  await DeviceApprovalRequest.updateMany(
    { regNo: clean, status: "PENDING" },
    { $set: { status: "EXPIRED" } }
  );

  const approvalRequest = await DeviceApprovalRequest.create({
    requestId,
    regNo: clean,
    requestingDeviceInfo,
    targetSessionId,
    exchangeHash,
    status: "PENDING",
    expiresAt,
  });

  const notification = await StudentNotification.create({
    notificationId,
    regNo: clean,
    type: "LOGIN_APPROVAL_REQUEST",
    title: "New Login Request",
    message: `Someone is attempting to log in to your account from a new ${requestingDeviceInfo.deviceType || "device"} (${requestingDeviceInfo.platform || "Unknown"}).`,
    approvalRequestId: requestId,
    targetSessionId,
    requestingDevice: {
      deviceType: requestingDeviceInfo.deviceType || "Desktop",
      os: requestingDeviceInfo.os || "Unknown",
      browser: requestingDeviceInfo.browser || "Unknown",
      platform: requestingDeviceInfo.platform || "Unknown",
      ip: requestingDeviceInfo.ip || "",
    },
    status: "UNREAD",
    expiresAt,
  });

  // Emit realtime notification event strictly targeting active session and student channel
  if (targetSessionId) {
    authEventBus.emit(`notification:${clean}:${targetSessionId}`, {
      type: "NEW_NOTIFICATION",
      notification,
      approvalRequest,
    });
  }
  authEventBus.emit(`notification:${clean}`, {
    type: "NEW_NOTIFICATION",
    notification,
    approvalRequest,
  });

  // Publish instant Ably WebSocket event to student's active device (<0.1s latency)
  try {
    const plainNotif = notification && notification.toObject ? notification.toObject() : JSON.parse(JSON.stringify(notification));
    const plainApproval = approvalRequest && approvalRequest.toObject ? approvalRequest.toObject() : JSON.parse(JSON.stringify(approvalRequest));
    delete plainApproval.exchangeHash; // Never expose exchange hash in realtime payloads
    await publishStudentRealtimeEvent(clean, "new-notification", {
      type: "NEW_NOTIFICATION",
      notification: plainNotif,
      approvalRequest: plainApproval,
    });
  } catch (e) {
    console.warn("[Ably] Device approval publish warning:", e?.message || e);
  }

  return { approvalRequest, notification, exchangeSecret };
}

/**
 * Handles device approval response (ALLOW or DENY) from the active authenticated device.
 * Guarantees atomic session revocation on ALLOW and double-click protection.
 * Zero plaintext JWTs are created or stored in MongoDB or SSE.
 */
async function respondDeviceApproval(StudentSession, requestId, respondingSessionId, action) {
  const cleanAction = String(action || "").toUpperCase();

  const reqDoc = await DeviceApprovalRequest.findOne({ requestId });
  if (!reqDoc) {
    return { success: false, code: "REQUEST_NOT_FOUND", message: "Approval request not found." };
  }

  const cleanReg = reqDoc.regNo;

  return withUserLock(`student_session_${cleanReg}`, async () => {
    // Re-fetch within lock to prevent double-approval race conditions
    const freshReq = await DeviceApprovalRequest.findOne({ requestId });
    if (!freshReq || freshReq.status !== "PENDING") {
      return {
        success: false,
        code: "REQUEST_ALREADY_PROCESSED",
        message: `This request has already been ${freshReq ? freshReq.status.toLowerCase() : "processed"}.`,
        status: freshReq?.status || "PROCESSED",
      };
    }

    if (new Date() > new Date(freshReq.expiresAt)) {
      freshReq.status = "EXPIRED";
      await freshReq.save();
      await StudentNotification.updateMany({ approvalRequestId: requestId }, { $set: { status: "EXPIRED" } });
      return { success: false, code: "REQUEST_EXPIRED", message: "This approval request has expired." };
    }

    if (cleanAction === "DENY") {
      freshReq.status = "DENIED";
      freshReq.respondedAt = new Date();
      freshReq.respondedBySessionId = respondingSessionId;
      await freshReq.save();

      await StudentNotification.updateMany(
        { approvalRequestId: requestId },
        { $set: { status: "DENIED" } }
      );

      // Emit real-time event to waiting device
      authEventBus.emit(`approval:${requestId}`, {
        status: "DENIED",
        message: "Login request was denied from your active device.",
      });

      authEventBus.emit(`notification:${cleanReg}:${respondingSessionId}`, {
        type: "NOTIFICATION_UPDATED",
        requestId,
        status: "DENIED",
      });
      authEventBus.emit(`notification:${cleanReg}`, {
        type: "NOTIFICATION_UPDATED",
        requestId,
        status: "DENIED",
      });

      // Publish instant Ably WebSocket events (<0.1s latency)
      try {
        await Promise.allSettled([
          publishApprovalRealtimeEvent(requestId, cleanReg, "approval-status", {
            status: "DENIED",
            message: "Login request was denied from your active device.",
          }),
          publishStudentRealtimeEvent(cleanReg, "approval-response", {
            requestId,
            status: "DENIED",
          }),
          publishStudentRealtimeEvent(cleanReg, "notification-updated", {
            requestId,
            status: "DENIED",
          }),
        ]);
      } catch (e) {
        console.warn("[Ably] Denied publish warning:", e?.message || e);
      }

      return { success: true, status: "DENIED", message: "Login request denied successfully." };
    }

    if (cleanAction === "ALLOW") {
      const targetSessionId = freshReq.targetSessionId || respondingSessionId;

      // 1. Atomically revoke target active session(s)
      if (targetSessionId) {
        await StudentSession.updateOne(
          { regNo: cleanReg, sessionId: targetSessionId, isActive: true },
          {
            $set: {
              isActive: false,
              revokedAt: new Date(),
              revokeReason: "APPROVED_ON_NEW_DEVICE",
            },
          }
        );
      } else {
        await StudentSession.updateMany(
          { regNo: cleanReg, isActive: true },
          {
            $set: {
              isActive: false,
              revokedAt: new Date(),
              revokeReason: "APPROVED_ON_NEW_DEVICE",
            },
          }
        );
      }

      // 2. Mark approval record as APPROVED (NO JWT in DB - waiting device will exchange its secret)
      freshReq.status = "APPROVED";
      freshReq.respondedAt = new Date();
      freshReq.respondedBySessionId = respondingSessionId;
      await freshReq.save();

      await StudentNotification.updateMany(
        { approvalRequestId: requestId },
        { $set: { status: "APPROVED" } }
      );

      authEventBus.emit(`notification:${cleanReg}:${targetSessionId}`, {
        type: "NOTIFICATION_UPDATED",
        requestId,
        status: "APPROVED",
      });
      authEventBus.emit(`notification:${cleanReg}`, {
        type: "NOTIFICATION_UPDATED",
        requestId,
        status: "APPROVED",
      });

      // 3. Notify the old device that its session is revoked
      authEventBus.emit(`session_revoked:${cleanReg}`, {
        revokedSessionId: targetSessionId,
        reason: "APPROVED_ON_NEW_DEVICE",
        message: "Your session ended because your account was approved on another device.",
      });

      // 4. Notify waiting new device that request is APPROVED (it will exchange secret for session)
      authEventBus.emit(`approval:${requestId}`, {
        status: "APPROVED",
        requestId,
        regNo: cleanReg,
      });

      // 5. Publish instant Ably WebSocket events (<0.1s latency)
      try {
        await Promise.allSettled([
          publishStudentRealtimeEvent(cleanReg, "notification-updated", {
            requestId,
            status: "APPROVED",
          }),
          publishStudentRealtimeEvent(cleanReg, "session-revoked", {
            revokedSessionId: targetSessionId,
            reason: "APPROVED_ON_NEW_DEVICE",
            message: "Your session ended because your account was approved on another device.",
          }),
          publishApprovalRealtimeEvent(requestId, cleanReg, "approval-status", {
            status: "APPROVED",
            requestId,
            regNo: cleanReg,
          }),
        ]);
      } catch (e) {
        console.warn("[Ably] Approved publish warning:", e?.message || e);
      }

      return {
        success: true,
        status: "APPROVED",
        message: "Device approved successfully. Session transferred.",
      };
    }

    return { success: false, message: "Invalid action specified." };
  });
}

/**
 * Atomically completes device approval exchange using single-use exchange secret.
 * Generates JWT and new StudentSession only upon valid cryptographic secret presentation.
 */
async function completeDeviceApproval(StudentSession, requestId, exchangeSecret, req = {}) {
  if (!requestId || !exchangeSecret) {
    return { success: false, code: "MISSING_PARAMS", message: "Request ID and exchange secret are required." };
  }

  const exchangeHash = crypto.createHash("sha256").update(String(exchangeSecret).trim()).digest("hex");

  const reqDoc = await DeviceApprovalRequest.findOne({ requestId });
  if (!reqDoc) {
    return { success: false, code: "REQUEST_NOT_FOUND", message: "Approval request not found." };
  }

  const cleanReg = reqDoc.regNo;

  return withUserLock(`student_session_${cleanReg}`, async () => {
    const freshReq = await DeviceApprovalRequest.findOne({ requestId });
    if (!freshReq) {
      return { success: false, code: "REQUEST_NOT_FOUND", message: "Approval request not found." };
    }

    if (freshReq.status === "COMPLETED") {
      return { success: false, code: "ALREADY_COMPLETED", message: "This approval has already been completed." };
    }

    if (freshReq.status !== "APPROVED") {
      return {
        success: false,
        code: "NOT_APPROVED",
        message: `Approval request is not approved yet (current status: ${freshReq.status}).`,
        status: freshReq.status,
      };
    }

    if (new Date() > new Date(freshReq.expiresAt)) {
      freshReq.status = "EXPIRED";
      await freshReq.save();
      return { success: false, code: "REQUEST_EXPIRED", message: "This approval request has expired." };
    }

    if (!freshReq.exchangeHash || freshReq.exchangeHash !== exchangeHash) {
      return { success: false, code: "INVALID_EXCHANGE_SECRET", message: "Invalid approval exchange secret." };
    }

    // 1. Create new active session for the approved device
    const newSessionId = crypto.randomUUID();
    const newDeviceId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL_MS);

    const newSession = await StudentSession.create({
      regNo: cleanReg,
      sessionId: newSessionId,
      deviceId: newDeviceId,
      deviceInfo: freshReq.requestingDeviceInfo || {},
      loggedInAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt,
      isActive: true,
    });

    // 2. Mark request as COMPLETED to prevent replay attacks
    freshReq.status = "COMPLETED";
    freshReq.exchangeHash = null;
    freshReq.approvedSessionId = newSessionId;
    freshReq.completedAt = new Date();
    await freshReq.save();

    // 3. Issue signed JWT (60 days)
    const token = jwt.sign(
      { regNo: cleanReg, sessionId: newSessionId, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "60d" }
    );

    return {
      success: true,
      token,
      session: newSession,
      regNo: cleanReg,
      sessionId: newSessionId,
    };
  });
}

/**
 * Checks the status of a pending approval request for the waiting new device.
 */
async function getDeviceApprovalStatus(requestId) {
  const reqDoc = await DeviceApprovalRequest.findOne({ requestId });
  if (!reqDoc) {
    return { success: false, code: "NOT_FOUND", status: "NOT_FOUND", message: "Approval request not found." };
  }

  if (reqDoc.status === "PENDING" && new Date() > new Date(reqDoc.expiresAt)) {
    reqDoc.status = "EXPIRED";
    await reqDoc.save();
    await StudentNotification.updateMany({ approvalRequestId: requestId }, { $set: { status: "EXPIRED" } });
  }

  return {
    success: true,
    status: reqDoc.status,
    requestId: reqDoc.requestId,
    regNo: reqDoc.regNo,
    expiresAt: reqDoc.expiresAt,
  };
}

/**
 * Validates whether a student session document is currently active.
 */
function isSessionValid(session) {
  if (!session || !session.isActive) return false;
  if (session.expiresAt && new Date(session.expiresAt) <= new Date()) return false;
  return true;
}

/**
 * Updates the last active timestamp for audit logging without expiring the session.
 * Throttled to 15 minutes to eliminate redundant MongoDB write locks on high-traffic reads.
 * Rolls expiration by 60 days if expiring within 30 days.
 */
async function touchSession(session) {
  if (!session || !session.isActive || !session._id) return session;
  const now = Date.now();
  if (session.lastActiveAt && (now - new Date(session.lastActiveAt).getTime()) < 15 * 60 * 1000) {
    return session;
  }
  const update = {
    $set: {
      lastActiveAt: new Date(now),
    },
  };
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
  if (!session.expiresAt || new Date(session.expiresAt).getTime() < thirtyDaysFromNow) {
    update.$set.expiresAt = new Date(now + DEFAULT_SESSION_TTL_MS);
  }
  // Atomic query: update only if isActive is still true, preventing resurrection of revoked sessions
  await session.constructor.updateOne({ _id: session._id, isActive: true }, update);
  session.lastActiveAt = update.$set.lastActiveAt;
  if (update.$set.expiresAt) session.expiresAt = update.$set.expiresAt;
  return session;
}

/* ═══════════════════════════════════════════════════════════════════
   ADMIN & SUB-ADMIN SESSION HELPERS
═══════════════════════════════════════════════════════════════════ */

async function cleanExpiredAdminSessions(AdminSession) {
  await AdminSession.deleteMany({
    $or: [
      { isActive: false },
      { expiresAt: { $lte: new Date() } },
    ],
  });
}

const ADMIN_ACTIVITY_TTL_MS = 60 * 60 * 1000; // 1 hour rolling session window for inactive/abandoned devices

async function getActiveAdminSessions(AdminSession) {
  const activeCutoff = new Date(Date.now() - ADMIN_ACTIVITY_TTL_MS);

  // Automatically mark stale zombie sessions (inactive > 3m or null lastActiveAt) as dormant
  try {
    const pruneRes = await AdminSession.updateMany(
      {
        isActive: true,
        $or: [
          { lastActiveAt: { $lt: activeCutoff } },
          { lastActiveAt: null },
          { lastActiveAt: { $exists: false } },
        ],
      },
      {
        $set: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: "INACTIVITY_OR_COOKIE_LOSS",
        },
      }
    );

    if ((pruneRes?.modifiedCount || pruneRes?.nModified || 0) > 0) {
      try {
        const remainingCount = await AdminSession.countDocuments({
          isActive: true,
          expiresAt: { $gt: new Date() },
          lastActiveAt: { $gte: activeCutoff },
        });
        if (typeof broadcastRealtimeEvent === "function") {
          broadcastRealtimeEvent("admin-availability-updated", {
            activeDeviceCount: remainingCount,
            isAdminButtonVisible: remainingCount < MAX_ADMIN_DEVICES,
          }).catch(() => {});
        }
      } catch (_) {}
    }
  } catch (_) {}

  return AdminSession.find({
    isActive: true,
    expiresAt: { $gt: new Date() },
    lastActiveAt: { $gte: activeCutoff },
  }).sort({ lastActiveAt: -1 });
}

function isAdminSessionValid(session) {
  if (!session || !session.isActive) return false;
  if (session.expiresAt && new Date(session.expiresAt) <= new Date()) return false;
  return true;
}

async function touchAdminSession(session) {
  if (!session || !session.isActive || !session._id) return session;
  const now = Date.now();
  // Throttled to 15 seconds to support live 30s heartbeats efficiently
  if (session.lastActiveAt && (now - new Date(session.lastActiveAt).getTime()) < 15 * 1000) {
    return session;
  }
  const update = {
    $set: {
      lastActiveAt: new Date(now),
    },
  };
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
  if (!session.expiresAt || new Date(session.expiresAt).getTime() < thirtyDaysFromNow) {
    update.$set.expiresAt = new Date(now + DEFAULT_SESSION_TTL_MS);
  }
  // Atomic query: update only if isActive is still true, preventing resurrection of revoked sessions
  await session.constructor.updateOne({ _id: session._id, isActive: true }, update);
  session.lastActiveAt = update.$set.lastActiveAt;
  if (update.$set.expiresAt) session.expiresAt = update.$set.expiresAt;
  return session;
}

async function cleanExpiredSubAdminSessions(SubAdminSession, subAdminId = null) {
  const filter = {
    $or: [
      { isActive: false },
      { expiresAt: { $lte: new Date() } },
    ],
  };
  if (subAdminId) {
    filter.subAdminId = subAdminId;
  }
  await SubAdminSession.deleteMany(filter);
}

async function getActiveSubAdminSessions(SubAdminSession, subAdminId) {
  return SubAdminSession.find({
    subAdminId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ loggedInAt: -1 });
}

module.exports = {
  DEFAULT_SESSION_TTL_MS,
  PERMANENT_SESSION_MS,
  MAX_ADMIN_DEVICES,
  MAX_SUBADMIN_DEVICES,
  APPROVAL_TTL_MS,
  authEventBus,
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getValidActiveSessions,
  getActiveSessions,
  replaceStudentSession,
  createDeviceApprovalRequest,
  respondDeviceApproval,
  completeDeviceApproval,
  getDeviceApprovalStatus,
  isSessionValid,
  touchSession,
  cleanExpiredAdminSessions,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
  cleanExpiredSubAdminSessions,
  getActiveSubAdminSessions,
};
