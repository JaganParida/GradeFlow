/**
 * CSRF Protection Middleware for GradeFlow API
 * 
 * Defends against Cross-Site Request Forgery (CSRF) on state-changing HTTP methods
 * (POST, PUT, PATCH, DELETE) for both Express backend and external consumers.
 * 
 * Security Mechanisms:
 * 1. Safe Method Bypass: GET, HEAD, OPTIONS do not alter server state and are allowed.
 * 2. W3C Fetch Metadata Enforcement:
 *    - If Sec-Fetch-Site is "cross-site", request is strictly blocked unless Origin is in ALLOWED_ORIGINS.
 * 3. Strict Origin & Referer Validation:
 *    - Validates Origin (or Referer) against the allowed origin whitelist.
 *    - Untrusted origins are immediately rejected with 403 Forbidden.
 * 4. Custom Anti-CSRF Header Requirement for Browser Requests:
 *    - If an incoming browser-initiated request has Origin/Referer suppressed (e.g. via no-referrer),
 *      it MUST carry a custom header (X-Requested-With: XMLHttpRequest or X-CSRF-Token).
 *    - Cross-origin HTML forms and simple requests cannot attach custom headers without
 *      passing CORS preflight.
 * 5. Elimination of Sec-CH-UA and Content-Type Bypasses:
 *    - Browser default client-hints (sec-ch-ua) and Content-Type: application/json
 *      are NEVER treated as proof of an authorized client.
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/grade-?flow-six[a-z0-9\-_]*\.vercel\.app$/i,
  /^https:\/\/grade-?flow-navy[a-z0-9\-_]*\.vercel\.app$/i,
  /^https:\/\/grade-?flow[a-z0-9\-_]*\.vercel\.app$/i,
  /^http:\/\/localhost:(3000|5173|4173)$/i,
  /^http:\/\/127\.0\.0\.1:(3000|5173|4173)$/i,
];

function normalizeOrigin(val) {
  if (!val || typeof val !== "string") return "";
  try {
    return new URL(val).origin.toLowerCase();
  } catch {
    return val.trim().replace(/\/+$/, "").toLowerCase();
  }
}

function getStaticAllowedOrigins() {
  const origins = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
    "https://grade-flow-six.vercel.app",
    "https://grade-flow-navy.vercel.app",
  ]);

  if (process.env.FRONTEND_URL) {
    const norm = normalizeOrigin(process.env.FRONTEND_URL);
    if (norm) origins.add(norm);
  }
  if (process.env.SERVER_URL) {
    const norm = normalizeOrigin(process.env.SERVER_URL);
    if (norm) origins.add(norm);
  }
  if (process.env.CUSTOM_DOMAIN) {
    const norm = normalizeOrigin(process.env.CUSTOM_DOMAIN);
    if (norm) origins.add(norm);
  }

  return Array.from(origins);
}

function isOriginAllowed(originHeader) {
  if (!originHeader) return false;
  const norm = normalizeOrigin(originHeader);
  if (!norm) return false;

  const staticList = getStaticAllowedOrigins();
  if (staticList.includes(norm)) return true;

  if (ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(norm))) {
    return true;
  }

  const prefix = process.env.VERCEL_PROJECT_PREFIX || "";
  if (
    prefix &&
    norm.startsWith(`https://${prefix.toLowerCase()}`) &&
    norm.endsWith(".vercel.app")
  ) {
    return true;
  }

  return false;
}

const csrfProtect = (req, res, next) => {
  // 1. Safe HTTP methods do not change state
  const method = (req.method || "").toUpperCase();
  const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
  if (isSafeMethod) {
    return next();
  }

  // 2. Resolve requesting origin from Origin or Referer
  let origin = req.headers["origin"] || null;
  if (!origin && req.headers["referer"]) {
    try {
      origin = new URL(req.headers["referer"]).origin;
    } catch {
      origin = null;
    }
  }

  // 3. W3C Fetch Metadata check (Sec-Fetch-Site)
  // When browser labels request cross-site, it MUST match the allowed origin whitelist.
  const secFetchSite = req.headers["sec-fetch-site"];
  if (secFetchSite === "cross-site") {
    if (!origin || !isOriginAllowed(origin)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Cross-Site Request Blocked (Sec-Fetch-Site: cross-site)",
        code: "CSRF_CROSS_SITE_BLOCKED",
      });
    }
  }

  // 4. Strict Origin verification if present
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Cross-Site Request Blocked (Invalid Origin)",
      code: "CSRF_ORIGIN_INVALID",
    });
  }

  // 5. Custom Anti-CSRF Header Verification
  const requestedWith = req.headers["x-requested-with"];
  const csrfToken = req.headers["x-csrf-token"] || req.headers["x-gradeflow-csrf"];
  const customAuthHeader = req.headers["x-student-token"] || req.headers["x-admin-token"] || req.headers["authorization"];
  const hasCustomHeader = Boolean(
    (requestedWith && requestedWith.toLowerCase() === "xmlhttprequest") ||
    csrfToken ||
    customAuthHeader
  );

  // 6. Browser Fingerprint Detection
  const cookieHeader = req.headers["cookie"] || "";
  const hasAuthCookies = /student_jwt|jwt|gf_device_id|gf_auth_present/.test(cookieHeader);
  const isBrowserRequest = Boolean(
    hasAuthCookies ||
    req.headers["sec-ch-ua"] ||
    req.headers["sec-fetch-mode"] ||
    req.headers["sec-fetch-dest"]
  );

  // If a browser request has no Origin/Referer (e.g. suppressed by attacker with no-referrer),
  // it MUST present a valid custom header to prove it is not an ambient cross-site forgery.
  if (isBrowserRequest && !origin && !hasCustomHeader) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: CSRF protection verification failed (Missing Origin and Custom Anti-CSRF Header).",
      code: "CSRF_MISSING_ORIGIN_AND_HEADER",
    });
  }

  next();
};

module.exports = {
  csrfProtect,
  isOriginAllowed,
  getStaticAllowedOrigins,
};
