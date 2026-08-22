const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms = 7 continuous days

/**
 * Returns the maximum allowed simultaneous active devices for a registration number.
 * 230301120327 = 2 devices
 * All other registration numbers = 1 device
 */
function getMaxAllowedDevices(regNo) {
  const clean = String(regNo || "").trim().toUpperCase();
  return clean === "230301120327" ? 2 : 1;
}

/**
 * Cleans up genuinely expired or inactive sessions from MongoDB.
 * A session is expired ONLY if:
 * 1. Inactivity period >= 7 continuous days (now - lastActiveAt >= 7 days)
 * 2. expiresAt has passed in UTC time
 * 3. isActive is explicitly false
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
 * Returns all currently active, valid sessions for a registration number.
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
 * Validates whether a specific session document is currently active and within 7-day inactivity window.
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
 * Refreshes the last active timestamp and extends expiration by 7 days.
 */
async function touchSession(session) {
  const now = Date.now();
  session.lastActiveAt = new Date(now);
  session.expiresAt = new Date(now + SEVEN_DAYS_MS);
  return session.save();
}

module.exports = {
  SEVEN_DAYS_MS,
  getMaxAllowedDevices,
  cleanExpiredSessions,
  getActiveSessions,
  isSessionValid,
  touchSession,
};
