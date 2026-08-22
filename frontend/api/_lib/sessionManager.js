const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms = 7 continuous days
const MAX_ADMIN_DEVICES = 2; // Maximum simultaneous active devices for Admin

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
 * Cleans up genuinely expired or inactive student sessions from MongoDB.
 */
async function cleanExpiredSessions(StudentSession, regNo = null) {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  const now = new Date();
  const filter = {
    $or: [
      { lastActiveAt: { $lt: cutoff } },
      { expiresAt: { $lt: now } },
      { isActive: false },
    ],
  };
  if (regNo) {
    filter.regNo = String(regNo).trim().toUpperCase();
  }
  await StudentSession.deleteMany(filter);
}

/**
 * Returns all currently active, valid sessions for a student registration number.
 */
async function getActiveSessions(StudentSession, regNo) {
  const clean = String(regNo || "").trim().toUpperCase();
  await cleanExpiredSessions(StudentSession, clean);

  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  const now = new Date();

  return StudentSession.find({
    regNo: clean,
    isActive: true,
    lastActiveAt: { $gte: cutoff },
    expiresAt: { $gt: now },
  }).sort({ loggedInAt: -1 });
}

/**
 * Validates whether a student session document is currently active and within 7-day inactivity window.
 */
function isSessionValid(session) {
  if (!session || !session.isActive) return false;
  const now = Date.now();
  const lastActive = new Date(session.lastActiveAt).getTime();
  const expires = new Date(session.expiresAt).getTime();
  if (now - lastActive > SEVEN_DAYS_MS) return false;
  if (now >= expires) return false;
  return true;
}

/**
 * Refreshes the last active timestamp and extends expiration by 7 days for a student session.
 */
async function touchSession(session) {
  const now = Date.now();
  session.lastActiveAt = new Date(now);
  session.expiresAt = new Date(now + SEVEN_DAYS_MS);
  return session.save();
}

/* ═══════════════════════════════════════════════════════════════════
   ADMIN SESSION HELPERS (MAX 2 DEVICES & 7-DAY INACTIVITY)
═══════════════════════════════════════════════════════════════════ */

/**
 * Cleans up expired admin sessions.
 */
async function cleanExpiredAdminSessions(AdminSession) {
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  const now = new Date();
  await AdminSession.deleteMany({
    $or: [
      { lastActiveAt: { $lt: cutoff } },
      { expiresAt: { $lt: now } },
      { isActive: false },
    ],
  });
}

/**
 * Returns all currently active, valid admin sessions (max 2 allowed).
 */
async function getActiveAdminSessions(AdminSession) {
  await cleanExpiredAdminSessions(AdminSession);

  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  const now = new Date();

  return AdminSession.find({
    isActive: true,
    lastActiveAt: { $gte: cutoff },
    expiresAt: { $gt: now },
  }).sort({ loggedInAt: -1 });
}

/**
 * Validates whether an admin session document is active and within 7-day inactivity window.
 */
function isAdminSessionValid(session) {
  if (!session || !session.isActive) return false;
  const now = Date.now();
  const lastActive = new Date(session.lastActiveAt).getTime();
  const expires = new Date(session.expiresAt).getTime();
  if (now - lastActive > SEVEN_DAYS_MS) return false;
  if (now >= expires) return false;
  return true;
}

/**
 * Refreshes the last active timestamp and extends expiration by 7 days for an admin session.
 */
async function touchAdminSession(session) {
  const now = Date.now();
  session.lastActiveAt = new Date(now);
  session.expiresAt = new Date(now + SEVEN_DAYS_MS);
  return session.save();
}

module.exports = {
  SEVEN_DAYS_MS,
  MAX_ADMIN_DEVICES,
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getActiveSessions,
  isSessionValid,
  touchSession,
  cleanExpiredAdminSessions,
  getActiveAdminSessions,
  isAdminSessionValid,
  touchAdminSession,
};
