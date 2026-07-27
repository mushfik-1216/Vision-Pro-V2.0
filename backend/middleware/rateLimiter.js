/**
 * Rate limiting middleware using express-rate-limit.
 * Protects API endpoints from abuse and excessive requests.
 */

const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
    timestamp: new Date().toISOString(),
  },
});

// Stricter rate limiter for analysis endpoints (OpenAI is expensive)
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 analysis requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      "Analysis rate limit exceeded. Please wait before requesting another analysis.",
    timestamp: new Date().toISOString(),
  },
});

module.exports = { apiLimiter, analysisLimiter };
