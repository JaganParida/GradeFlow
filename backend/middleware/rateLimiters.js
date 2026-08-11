const rateLimit = require("express-rate-limit");

// Configurable thresholds via environment variables (with safe defaults)
const AUTH_WINDOW_MS = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000;
const AUTH_MAX = Number(process.env.RATE_LIMIT_AUTH_MAX) || 10;

const PUBLIC_WINDOW_MS = Number(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS) || 60 * 1000;
const PUBLIC_MAX = Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 200;

const ADMIN_WINDOW_MS = Number(process.env.RATE_LIMIT_ADMIN_WINDOW_MS) || 60 * 1000;
const ADMIN_MAX = Number(process.env.RATE_LIMIT_ADMIN_MAX) || 300;

// Strict limiter for authentication routes (login, credentials check)
const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
  keyGenerator: (req) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const email = req.body && req.body.email ? String(req.body.email).trim().toLowerCase() : "";
    return email ? `${ip}_${email}` : ip;
  },
});

// Moderate limiter for public student & leaderboard endpoints
const publicLimiter = rateLimit({
  windowMs: PUBLIC_WINDOW_MS,
  max: PUBLIC_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
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
    message: "Admin request limit exceeded. Please wait a moment before trying again.",
  },
});

module.exports = {
  authLimiter,
  publicLimiter,
  adminLimiter,
};
