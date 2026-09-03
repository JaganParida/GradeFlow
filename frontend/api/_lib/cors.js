/**
 * GradeFlow — Central CORS Protocol Compliance & Origin Validation
 * 
 * Complies with the Fetch / CORS specification:
 * When Access-Control-Allow-Credentials is true, Access-Control-Allow-Origin
 * MUST NOT be '*', but rather the validated requesting origin.
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/grade-flow-navy\.vercel\.app$/,
  /^https:\/\/gradeflow-navy\.vercel\.app$/,
  /^https:\/\/gradeflow.*\.vercel\.app$/,
  /^http:\/\/localhost:(3000|5173)$/,
  /^http:\/\/127\.0\.0\.1:(3000|5173)$/,
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

function applyCors(req, res, allowedMethods = "GET,POST,PUT,DELETE,OPTIONS") {
  const origin = req.headers?.origin;
  const allowed = isOriginAllowed(origin);

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    // Non-browser / CLI / same-origin requests without Origin header
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    // External origin
    res.setHeader("Access-Control-Allow-Origin", "https://grade-flow-navy.vercel.app");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Access-Control-Allow-Methods", allowedMethods);
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cookie, x-student-token, x-admin-token"
  );
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = { applyCors, isOriginAllowed };
