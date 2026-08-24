const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

/**
 * Multi-Layer Endpoint-Aware Rate Limiters with Shared Wi-Fi / NAT Partitioning
 * - Never trusts unverified client headers for authenticated routes
 * - Composite keys: Server-verified identity + Client IP
 * - Prevents 1 abusive student from blocking an entire college campus
 */

// Helper to extract verified or sanitized identity from request
function getClientIdentityKey(req) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";

  // 1. Check verified JWT from Authorization header or cookie
  const authHeader = req.headers.authorization;
  const rawToken =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies?.gf_student_token || req.cookies?.token;

  if (rawToken && process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(rawToken, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
      if (decoded && (decoded.regNo || decoded.email || decoded.id)) {
        const id = decoded.regNo || decoded.email || decoded.id;
        return `${ip}_auth_${id}`;
      }
    } catch (_) {
      // Invalid/expired token — fallback to body/IP
    }
  }

  // 2. Unauthenticated request: use sanitized regNo/email from body or query if available
  const bodyIdentifier =
    (req.body && (req.body.regNo || req.body.email || req.body.username)) ||
    (req.query && req.query.regNo) ||
    "anon";

  const sanitizedId = String(bodyIdentifier).trim().toUpperCase().slice(0, 32);
  return `${ip}_${sanitizedId}`;
}

const standardRateLimitMessage = {
  success: false,
  message: "Too many requests. Please wait a moment and try again.",
  code: "RATE_LIMIT_EXCEEDED",
};

// ── 1. Strict Authentication Limiter ─────────────────────────────────
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: standardRateLimitMessage,
  keyGenerator: (req) => getClientIdentityKey(req),
});

// ── 2. Dedicated OTP Send Limiter ────────────────────────────────────
const otpSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6, // 6 attempts per minute flood/DDoS barrier
  skipFailedRequests: true, // Failed delivery never penalizes the student
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait a moment before trying again.",
    code: "OTP_FLOOD_PROTECTION",
  },
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const reg = (req.body && req.body.regNo ? String(req.body.regNo).trim().toUpperCase() : "anon");
    return `otp_send_${ip}_${reg}`;
  },
});

// ── 3. Dedicated OTP Verification Attempt Limiter ────────────────────
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5, // 5 attempts per 10 minutes per student
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please wait 10 minutes or request a new code.",
    code: "OTP_VERIFY_RATE_LIMITED",
  },
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const reg = (req.body && req.body.regNo ? String(req.body.regNo).trim().toUpperCase() : "anon");
    return `otp_verify_${ip}_${reg}`;
  },
});

// ── 4. Student Search & Data Limiter ─────────────────────────────────
const studentSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_STUDENT_MAX) || 60, // 60 searches/min per student identity
  standardHeaders: true,
  legacyHeaders: false,
  message: standardRateLimitMessage,
  keyGenerator: (req) => getClientIdentityKey(req),
});

// ── 5. Public Endpoint Limiter (Leaderboard, Timetable) ───────────────
const publicLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: standardRateLimitMessage,
  keyGenerator: (req) => req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
});

// ── 6. Authenticated Admin Actions Limiter ───────────────────────────
const adminLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_ADMIN_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_ADMIN_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: standardRateLimitMessage,
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const adminEmail = req.admin?.email || req.subAdmin?.email || "admin";
    return `admin_${ip}_${adminEmail}`;
  },
});

// ── 7. Email Batch Dispatch Limiter ──────────────────────────────────
const emailLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_EMAIL_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_EMAIL_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Email dispatch rate limit reached. Please wait a moment before sending more emails.",
    code: "EMAIL_RATE_LIMITED",
  },
});

module.exports = {
  getClientIdentityKey,
  authLimiter,
  otpSendLimiter,
  otpLimiter,
  studentSearchLimiter,
  publicLimiter,
  adminLimiter,
  emailLimiter,
};
