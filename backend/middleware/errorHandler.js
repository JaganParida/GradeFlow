/**
 * Centralized Global Error Handler Middleware
 * Prevents information leakage (stack traces, DB paths, internal details)
 * while logging full debug details on the server side.
 */

function errorHandler(err, req, res, next) {
  // Always log detailed error information on server side for debugging
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    ip: req.ip,
    user: req.user ? req.user.email : "anonymous",
  });

  // Handle specific known error types cleanly
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (err.type === "entity.too.large" || err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Payload size too large" });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  // Return clean generic message to client in production to prevent information leakage
  const clientMessage =
    process.env.NODE_ENV === "production"
      ? "An internal server error occurred. Please try again later."
      : err.message || "An internal server error occurred.";

  res.status(statusCode).json({
    message: clientMessage,
  });
}

module.exports = errorHandler;
