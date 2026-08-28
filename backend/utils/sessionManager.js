const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const EventEmitter = require("events");

const DeviceApprovalRequest = require("../models/DeviceApprovalRequest");
const StudentNotification = require("../models/StudentNotification");

const PERMANENT_SESSION_MS = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years (Permanent sessions until explicit logout)
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
  const filter = {
    $or: [
      { isActive: false },
      { expiresAt: { $lte: new Date() } },
    ],
  };
  if (regNo) {
    filter.regNo = String(regNo).trim().toUpperCase();
  }
  await StudentSession.deleteMany(filter);
}

/**
 * Single Authoritative Server-Side Function: Returns all genuinely valid active sessions.
 * Reconciles stale/expired records so they never count toward device limits.
 */
async function getValidActiveSessions(StudentSession, regNo) {
  const clean = String(regNo || "").trim().toUpperCase();
  await cleanExpiredSessions(StudentSession, clean);

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

  // Emit realtime notification event
  authEventBus.emit(`notification:${clean}`, {
    type: "NEW_NOTIFICATION",
    notification,
    approvalRequest,
  });

  return { approvalRequest, notification };
}

/**
 * Handles device approval response (ALLOW or DENY) from the active authenticated device.
 * Guarantees atomic session replacement on ALLOW and double-click protection.
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

      return { success: true, status: "DENIED", message: "Login request denied successfully." };
    }

    if (cleanAction === "ALLOW") {
      // 1. Atomically revoke all existing active sessions for this student
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

      // 2. Create the new session for the requesting device
      const newSessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);

      const newSession = await StudentSession.create({
        regNo: cleanReg,
        sessionId: newSessionId,
        deviceId: crypto.randomUUID(),
        deviceInfo: freshReq.requestingDeviceInfo || {},
        loggedInAt: new Date(),
        lastActiveAt: new Date(),
        expiresAt,
        isActive: true,
      });

      // 3. Generate secure student JWT token for the approved session
      const token = jwt.sign(
        { regNo: cleanReg, sessionId: newSessionId, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "36500d" }
      );

      // 4. Update approval record
      freshReq.status = "APPROVED";
      freshReq.approvedSessionId = newSessionId;
      freshReq.approvedToken = token;
      freshReq.respondedAt = new Date();
      freshReq.respondedBySessionId = respondingSessionId;
      await freshReq.save();

      await StudentNotification.updateMany(
        { approvalRequestId: requestId },
        { $set: { status: "APPROVED" } }
      );

      // 5. Notify the old device that its session is revoked
      authEventBus.emit(`session_revoked:${cleanReg}`, {
        revokedSessionId: respondingSessionId,
        reason: "APPROVED_ON_NEW_DEVICE",
        message: "Your session ended because your account was approved on another device.",
      });

      // 6. Notify the waiting new device that approval is complete (NO raw token in SSE)
      authEventBus.emit(`approval:${requestId}`, {
        status: "APPROVED",
        student: {
          regNo: cleanReg,
          sessionId: newSessionId,
        },
      });

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
    approvedToken: reqDoc.status === "APPROVED" ? reqDoc.approvedToken : null,
    approvedSessionId: reqDoc.status === "APPROVED" ? reqDoc.approvedSessionId : null,
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
 */
async function touchSession(session) {
  session.lastActiveAt = new Date();
  if (!session.expiresAt || new Date(session.expiresAt).getFullYear() < 2050) {
    session.expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);
  }
  return session.save();
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

async function getActiveAdminSessions(AdminSession) {
  await cleanExpiredAdminSessions(AdminSession);

  return AdminSession.find({
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ loggedInAt: -1 });
}

function isAdminSessionValid(session) {
  if (!session || !session.isActive) return false;
  if (session.expiresAt && new Date(session.expiresAt) <= new Date()) return false;
  return true;
}

async function touchAdminSession(session) {
  session.lastActiveAt = new Date();
  if (!session.expiresAt || new Date(session.expiresAt).getFullYear() < 2050) {
    session.expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);
  }
  return session.save();
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
  await cleanExpiredSubAdminSessions(SubAdminSession, subAdminId);

  return SubAdminSession.find({
    subAdminId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ loggedInAt: -1 });
}

module.exports = {
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
