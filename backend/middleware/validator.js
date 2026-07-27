/**
 * Input validation middleware.
 * Validates required query/body parameters before they reach controllers.
 */

const ResponseFormatter = require("../utils/responseFormatter");

/**
 * Validate that required query parameters exist.
 * @param {...string} params - Required parameter names
 * @returns {function} Express middleware
 */
function requireQuery(...params) {
  return (req, res, next) => {
    const missing = params.filter(
      (p) => !req.query[p] || req.query[p].trim() === "",
    );
    if (missing.length > 0) {
      return ResponseFormatter.error(
        res,
        `Missing required query parameter(s): ${missing.join(", ")}`,
        400,
      );
    }
    next();
  };
}

/**
 * Validate that required body fields exist.
 * @param {...string} fields - Required field names
 * @returns {function} Express middleware
 */
function requireBody(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => !req.body[f] || req.body[f].toString().trim() === "",
    );
    if (missing.length > 0) {
      return ResponseFormatter.error(
        res,
        `Missing required body field(s): ${missing.join(", ")}`,
        400,
      );
    }
    next();
  };
}

/**
 * Sanitize a string input: trim and remove excessive whitespace.
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
  if (typeof str !== "string") return "";
  return str.trim().replace(/\s+/g, " ");
}

module.exports = { requireQuery, requireBody, sanitizeString };
