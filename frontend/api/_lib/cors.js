/**
 * GradeFlow — Central CORS Protocol Compliance & CSRF Protection
 * 
 * Complies with the Fetch / CORS specification and provides defense-in-depth
 * anti-CSRF enforcement across all Vercel Serverless Functions.
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

function isOriginAllowed(origin) {
  if (!origin) return false;
  const norm = normalizeOrigin(origin);
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

const { sanitizeRequest } = require("./mongoSanitize");

function applyCors(req, res, allowedMethods = "GET,POST,PUT,DELETE,OPTIONS") {
  // 1. Automatically sanitize all incoming serverless request data against NoSQL injection
  sanitizeRequest(req);

  const rawOrigin = req.headers?.origin;
  const allowed = isOriginAllowed(rawOrigin);

  // 2. Set strict CORS response headers
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", rawOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else if (!rawOrigin) {
    // Non-browser / same-origin without Origin header
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    // External disallowed origin: strictly disallow credentials
    res.setHeader("Access-Control-Allow-Origin", "null");
  }

  res.setHeader("Access-Control-Allow-Methods", allowedMethods);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-student-token, x-admin-token, x-student-regno, x-gradeflow-csrf, x-device-id"
  );
  res.setHeader("Vary", "Origin");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    if (rawOrigin && !allowed) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Preflight Origin Not Allowed",
        code: "CORS_PREFLIGHT_FORBIDDEN",
      });
      return true;
    }
    res.status(200).end();
    return true;
  }

  // 3. State-Changing Request CSRF Verification (POST, PUT, DELETE, PATCH)
  const method = (req.method || "").toUpperCase();
  const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
  if (!isSafeMethod) {
    // A. W3C Fetch Metadata check (Sec-Fetch-Site)
    const secFetchSite = req.headers?.["sec-fetch-site"];
    if (secFetchSite === "cross-site") {
      if (!rawOrigin || !allowed) {
        res.status(403).json({
          success: false,
          message: "Forbidden: Cross-Site Request Blocked (Sec-Fetch-Site: cross-site)",
          code: "CSRF_CROSS_SITE_BLOCKED",
        });
        return true;
      }
    }

    // B. Strict Origin validation when present
    if (rawOrigin && !allowed) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Cross-Site Request Blocked (Invalid Origin)",
        code: "CSRF_ORIGIN_INVALID",
      });
      return true;
    }

    // C. Referer validation if Origin was absent
    const rawReferer = req.headers?.["referer"];
    let refererOrigin = null;
    if (!rawOrigin && rawReferer) {
      try {
        refererOrigin = new URL(rawReferer).origin;
        if (!isOriginAllowed(refererOrigin)) {
          res.status(403).json({
            success: false,
            message: "Forbidden: Cross-Site Request Blocked (Invalid Referer Origin)",
            code: "CSRF_ORIGIN_INVALID",
          });
          return true;
        }
      } catch {
        res.status(403).json({
          success: false,
          message: "Forbidden: Cross-Site Request Blocked (Malformed Referer)",
          code: "CSRF_ORIGIN_INVALID",
        });
        return true;
      }
    }

    // D. Custom Anti-CSRF Header Verification for Browser Requests
    const requestedWith = req.headers?.["x-requested-with"];
    const csrfToken = req.headers?.["x-csrf-token"] || req.headers?.["x-gradeflow-csrf"];
    const customAuthHeader = req.headers?.["x-student-token"] || req.headers?.["x-admin-token"] || req.headers?.["authorization"];
    const hasCustomHeader = Boolean(
      (requestedWith && requestedWith.toLowerCase() === "xmlhttprequest") ||
      csrfToken ||
      customAuthHeader
    );

    const cookieHeader = req.headers?.["cookie"] || "";
    const hasAuthCookies = /student_jwt|jwt|gf_device_id|gf_auth_present/.test(cookieHeader);
    const isBrowserRequest = Boolean(
      hasAuthCookies ||
      req.headers?.["sec-ch-ua"] ||
      req.headers?.["sec-fetch-mode"] ||
      req.headers?.["sec-fetch-dest"]
    );

    // If browser request with stripped origin and referer, require custom anti-CSRF header
    if (isBrowserRequest && !rawOrigin && !hasCustomHeader) {
      res.status(403).json({
        success: false,
        message: "Forbidden: CSRF protection verification failed (Missing Origin and Custom Anti-CSRF Header).",
        code: "CSRF_MISSING_ORIGIN_AND_HEADER",
      });
      return true;
    }
  }

  return false;
}

module.exports = { applyCors, isOriginAllowed, sanitizeRequest, getStaticAllowedOrigins };
