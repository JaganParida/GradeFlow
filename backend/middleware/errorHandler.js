/**
 * Centralized Global Error Handler Middleware
 * Prevents information leakage (stack traces, DB paths, internal details)
 * while logging full debug details on the server side.
 */

function errorHandler(err, req, res, next) {
  // Always log detailed error information on server side for debugging
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    name: err.name,
    code: err.code,
    ip: req.ip,
    user: req.user ? req.user.email : "anonymous",
  });

  // 1. Database Overload / High Traffic Queue Overflow
  if (err.name === "DatabaseOverloadError" || err.code === "DB_OVERLOAD") {
    return res.status(429).json({
      success: false,
      code: "HIGH_TRAFFIC_QUEUE",
      message: "GradeFlow is experiencing high traffic. Please wait a moment and try again.",
    });
  }

  // 2. Email Provider Failure / Failover Exhaustion
  if (err.name === "EmailProviderError" || err.classification === "ALL_PROVIDERS_UNAVAILABLE") {
    return res.status(503).json({
      success: false,
      code: "OTP_DELIVERY_UNAVAILABLE",
      message: "OTP delivery is temporarily unavailable. Please try again in a few moments.",
    });
  }

  // 3. Validation Errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // 4. JWT & Auth Errors
  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // 5. Payload / Upload Size Limits
  if (err.type === "entity.too.large" || err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Payload size too large" });
  }

  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  
  // Return clean user-facing message to prevent security information leakage
  const clientMessage =
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again shortly."
      : err.message || "An internal server error occurred.";

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
  });
}

module.exports = errorHandler;
