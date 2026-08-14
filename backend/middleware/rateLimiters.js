const rateLimit = require("express-rate-limit");

// Configurable thresholds via environment variables (with safe defaults)
const AUTH_WINDOW_MS = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000;
const AUTH_MAX = Number(process.env.RATE_LIMIT_AUTH_MAX) || 10;

const PUBLIC_WINDOW_MS = Number(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS) || 60 * 1000;
const PUBLIC_MAX = Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 200;

const ADMIN_WINDOW_MS = Number(process.env.RATE_LIMIT_ADMIN_WINDOW_MS) || 60 * 1000;
const ADMIN_MAX = Number(process.env.RATE_LIMIT_ADMIN_MAX) || 300;

const EMAIL_WINDOW_MS = Number(process.env.RATE_LIMIT_EMAIL_WINDOW_MS) || 60 * 1000;
const EMAIL_MAX = Number(process.env.RATE_LIMIT_EMAIL_MAX) || 50;

// Strict limiter for authentication routes (login, credentials check) with IP+Email key
const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
  },
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : "";
    return email ? `${ip}_${email}` : ip;
  },
});

// Dedicated limiter for sending email notifications (prevents spamming / SMTP quota drain)
const emailLimiter = rateLimit({
  windowMs: EMAIL_WINDOW_MS,
  max: EMAIL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Email dispatch rate limit reached. Please wait a moment before sending more emails.",
  },
});

// Moderate limiter for public student & leaderboard endpoints
const publicLimiter = rateLimit({
  windowMs: PUBLIC_WINDOW_MS,
  max: PUBLIC_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Server is experiencing high traffic. Please try again in a minute.",
  },
});

// Looser limiter for authenticated admin actions
const adminLimiter = rateLimit({
  windowMs: ADMIN_WINDOW_MS,
  max: ADMIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Admin request limit exceeded. Please wait a moment before trying again.",
  },
});

module.exports = {
  authLimiter,
  emailLimiter,
  publicLimiter,
  adminLimiter,
};
