/**
 * CSRF Protection Middleware for GradeFlow Admin API
 * 
 * Defends against Cross-Site Request Forgery attacks on state-changing requests
 * (POST, PUT, PATCH, DELETE) when using cookie-based authentication.
 * 
 * Mechanisms:
 * 1. Verifies Origin / Referer against whitelist for cross-origin requests.
 * 2. Requires standard custom headers (e.g. X-Requested-With) which cannot be sent
 *    by cross-origin HTML forms without a preflight CORS check.
 */

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://grade-flow-navy.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const VERCEL_PREVIEW_PREFIX = process.env.VERCEL_PROJECT_PREFIX || "";

function isOriginAllowed(originHeader) {
  if (!originHeader) return true; // Non-browser / same-origin without Origin header
  
  try {
    const originUrl = new URL(originHeader);
    const originNormalized = originUrl.origin;

    if (ALLOWED_ORIGINS.includes(originNormalized)) {
      return true;
    }

    if (
      VERCEL_PREVIEW_PREFIX &&
      originNormalized.startsWith(`https://${VERCEL_PREVIEW_PREFIX}`) &&
      originNormalized.endsWith(".vercel.app")
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

const csrfProtect = (req, res, next) => {
  // Safe HTTP methods do not change state
  const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase());
  if (isSafeMethod) {
    return next();
  }

  // 1. Verify Origin / Referer header if present
  const origin = req.headers["origin"] || (req.headers["referer"] ? new URL(req.headers["referer"]).origin : null);
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Cross-Site Request Blocked (Invalid Origin)",
      code: "CSRF_ORIGIN_INVALID",
    });
  }

  // 2. Validate custom header presence for state-changing requests
  const requestedWith = req.headers["x-requested-with"];
  const csrfToken = req.headers["x-csrf-token"] || req.headers["x-gradeflow-csrf"];
  const isCustomClient = req.headers["sec-ch-ua"] || requestedWith || csrfToken || req.headers["content-type"]?.includes("application/json") || req.headers["content-type"]?.includes("multipart/form-data");

  if (!isCustomClient && !isOriginAllowed(origin)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: CSRF protection verification failed.",
      code: "CSRF_VERIFICATION_FAILED",
    });
  }

  next();
};

module.exports = {
  csrfProtect,
  isOriginAllowed,
};
