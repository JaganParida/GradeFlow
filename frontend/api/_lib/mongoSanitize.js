/**
 * GradeFlow — Native NoSQL Injection Protection for Vercel Serverless Functions
 * 
 * Deeply and recursively sanitizes request payloads by stripping any keys starting
 * with '$' (e.g. $ne, $gt, $where, $regex) or containing '.' (deep path injection)
 * from req.body, req.query, and req.params.
 * 
 * Zero dependencies, zero external overhead, perfectly optimized for Vercel Free Quota.
 */

function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    !(obj instanceof Date) &&
    !(obj instanceof RegExp) &&
    !(obj instanceof Buffer)
  );
}

/**
 * Recursively strips NoSQL injection operator keys ($*, *.*) from an object or array.
 * Mutates in place and returns the cleaned object.
 */
function sanitizeObject(target) {
  if (!target || typeof target !== "object") return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeObject(target[i]);
    }
    return target;
  }

  if (isPlainObject(target)) {
    const keys = Object.keys(target);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // Strip any MongoDB query operator ($gt, $ne, $regex, etc.) or dot notation
      if (key.charCodeAt(0) === 36 || key.includes(".")) { // 36 is '$'
        delete target[key];
      } else {
        target[key] = sanitizeObject(target[key]);
      }
    }
  }

  return target;
}

/**
 * Sanitizes an incoming Vercel Serverless HTTP Request.
 * Safely processes req.body, req.query, and req.params.
 */
function sanitizeRequest(req) {
  if (!req) return;

  // 1. Sanitize req.query
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  // 2. Sanitize req.body (handles both parsed JSON object and raw string)
  if (req.body) {
    if (typeof req.body === "object") {
      sanitizeObject(req.body);
    } else if (typeof req.body === "string" && (req.body.startsWith("{") || req.body.startsWith("["))) {
      try {
        const parsed = JSON.parse(req.body);
        sanitizeObject(parsed);
        req.body = parsed;
      } catch (_) {}
    }
  }

  // 3. Sanitize req.params if populated
  if (req.params && typeof req.params === "object") {
    sanitizeObject(req.params);
  }
}

/**
 * Defense-in-depth: Strict string casting and alphanumeric normalization for identifiers
 */
function cleanIdentifier(val, minLen = 5, maxLen = 30) {
  if (val === null || val === undefined) return "";
  const str = String(val).trim().toUpperCase();
  const pattern = new RegExp(`^[A-Z0-9]{${minLen},${maxLen}}$`);
  return pattern.test(str) ? str : "";
}

module.exports = {
  sanitizeObject,
  sanitizeRequest,
  cleanIdentifier,
};
