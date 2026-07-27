/**
 * Unified response formatter for all API endpoints.
 * Ensures consistent JSON structure across the entire backend.
 */

class ResponseFormatter {
  /**
   * Send a success response.
   * @param {object} res - Express response object
   * @param {*} data - Response payload
   * @param {string} [message] - Optional success message
   * @param {number} [statusCode=200] - HTTP status code
   */
  static success(res, data, message = "OK", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send an error response.
   * @param {object} res - Express response object
   * @param {string} error - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {*} [details] - Optional error details (hidden in production)
   */
  static error(res, error, statusCode = 500, details = null) {
    const response = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    };

    // Include details only in development mode
    if (details && process.env.NODE_ENV === "development") {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated success response.
   * @param {object} res - Express response object
   * @param {Array} data - Array of items
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   */
  static paginated(res, data, page, limit, total) {
    return res.status(200).json({
      success: true,
      message: "OK",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ResponseFormatter;
