/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns a consistent error response.
 */

const logger = require("../utils/logger");

/**
 * Express error-handling middleware (4 parameters).
 */
function globalErrorHandler(err, req, res, _next) {
  // Log the error
  logger.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Determine error message
  let errorMessage = "Internal server error";
  if (statusCode < 500) {
    // Client errors — show actual message
    errorMessage = err.message || errorMessage;
  } else if (process.env.NODE_ENV === "development") {
    // Server errors — show details only in development
    errorMessage = err.message || errorMessage;
  }

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create an HTTP error with status code.
 * Usage: throw createError(404, 'Resource not found');
 */
function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { globalErrorHandler, createError };
