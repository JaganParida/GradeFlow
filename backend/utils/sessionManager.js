const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // Kept for reference
const PERMANENT_SESSION_MS = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years (Permanent sessions)
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
 * Cleans up explicitly revoked/inactive student sessions from MongoDB.
 * Sessions NEVER expire automatically; they remain active until explicit logout.
 */
async function cleanExpiredSessions(StudentSession, regNo = null) {
  const filter = { isActive: false };
  if (regNo) {
    filter.regNo = String(regNo).trim().toUpperCase();
  }
  await StudentSession.deleteMany(filter);
}

/**
 * Returns all currently active sessions for a student registration number.
 * Sessions remain 100% active and permanent until explicit user logout.
 */
async function getActiveSessions(StudentSession, regNo) {
  const clean = String(regNo || "").trim().toUpperCase();
  await cleanExpiredSessions(StudentSession, clean);

  return StudentSession.find({
    regNo: clean,
    isActive: true,
  }).sort({ loggedInAt: -1 });
}

/**
 * Validates whether a student session document is currently active.
 * One-time login: sessions NEVER auto-expire or auto-logout.
 */
function isSessionValid(session) {
  if (!session || !session.isActive) return false;
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
   ADMIN SESSION HELPERS (PERMANENT ONE-TIME LOGIN UNTIL MANUAL LOGOUT)
═══════════════════════════════════════════════════════════════════ */

/**
 * Cleans up explicitly revoked admin sessions.
 */
async function cleanExpiredAdminSessions(AdminSession) {
  await AdminSession.deleteMany({ isActive: false });
}

/**
 * Returns all currently active admin sessions (max 2 allowed).
 * Sessions remain active permanently until explicit logout.
 */
async function getActiveAdminSessions(AdminSession) {
  await cleanExpiredAdminSessions(AdminSession);

  return AdminSession.find({
    isActive: true,
  }).sort({ loggedInAt: -1 });
}

/**
 * Validates whether an admin session document is active.
 * One-time login: admin sessions NEVER auto-expire or auto-logout.
 */
function isAdminSessionValid(session) {
  if (!session || !session.isActive) return false;
  return true;
}

/**
 * Updates the last active timestamp for audit logging without expiring the admin session.
 */
async function touchAdminSession(session) {
  session.lastActiveAt = new Date();
  if (!session.expiresAt || new Date(session.expiresAt).getFullYear() < 2050) {
    session.expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);
  }
  return session.save();
}

module.exports = {
  SEVEN_DAYS_MS,
  PERMANENT_SESSION_MS,
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
