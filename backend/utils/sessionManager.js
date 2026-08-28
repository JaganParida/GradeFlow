const crypto = require("crypto");

const PERMANENT_SESSION_MS = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years (Permanent sessions)
const MAX_ADMIN_DEVICES = 2; // Maximum simultaneous active devices for Admin
const MAX_SUBADMIN_DEVICES = 2; // Maximum simultaneous active devices for Sub-Admin

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
 * Returns all currently active sessions for a student registration number.
 */
async function getActiveSessions(StudentSession, regNo) {
  const clean = String(regNo || "").trim().toUpperCase();
  await cleanExpiredSessions(StudentSession, clean);

  return StudentSession.find({
    regNo: clean,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ loggedInAt: -1 });
}

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
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getActiveSessions,
  replaceStudentSession,
  isSessionValid,
  touchSession,
  cleanExpiredAdminSessions,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
  cleanExpiredSubAdminSessions,
  getActiveSubAdminSessions,
};

