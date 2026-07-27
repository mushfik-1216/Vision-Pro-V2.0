/**
 * Market Controller
 * Handles HTTP requests for market data endpoints.
 * Delegates to apiManager for data fetching, uses ResponseFormatter for output.
 */

const ResponseFormatter = require("../utils/responseFormatter");
const apiManager = require("../services/apiManager");
const logger = require("../utils/logger");

/**
 * GET /api/market/quote
 * Get real-time quote for a symbol.
 */
async function getQuote(req, res, next) {
  try {
    const { symbol } = req.query;

    if (!symbol || symbol.trim() === "") {
      return ResponseFormatter.error(
        res,
        "Symbol query parameter is required",
        400,
      );
    }

    logger.info(`Market quote requested for: ${symbol}`);

    const marketData = await apiManager.getMarketData(symbol, "60", 1);

    return ResponseFormatter.success(res, {
      symbol: marketData.symbol,
      quote: marketData.quote,
      timestamp: marketData.timestamp,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/market/candles
 * Get historical candlestick data.
 */
async function getCandles(req, res, next) {
  try {
    const { symbol, resolution = "60", count = "100" } = req.query;

    if (!symbol || symbol.trim() === "") {
      return ResponseFormatter.error(
        res,
        "Symbol query parameter is required",
        400,
      );
    }

    const candlesCount = Math.min(
      Math.max(1, parseInt(count, 10) || 100),
      5000,
    );
    const validResolutions = ["1", "5", "15", "30", "60", "D", "W", "M"];

    if (!validResolutions.includes(resolution)) {
      return ResponseFormatter.error(
        res,
        `Invalid resolution. Must be one of: ${validResolutions.join(", ")}`,
        400,
      );
    }

    logger.info(
      `Candles requested for: ${symbol}, resolution: ${resolution}, count: ${candlesCount}`,
    );

    const marketData = await apiManager.getMarketData(
      symbol,
      resolution,
      candlesCount,
    );

    return ResponseFormatter.success(res, {
      symbol: marketData.symbol,
      candles: marketData.candles,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/market/health
 * Quick check if market data service is reachable.
 * Uses a known symbol (AAPL) to verify API connectivity.
 */
async function healthCheck(req, res, next) {
  try {
    const data = await apiManager.getMarketData("AAPL", "D", 1);

    return ResponseFormatter.success(res, {
      status: "operational",
      finnhubConnected: data.quote?.currentPrice != null,
      symbol: "AAPL",
      lastPrice: data.quote?.currentPrice || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Still return success but indicate API is down
    return ResponseFormatter.success(res, {
      status: "degraded",
      finnhubConnected: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  getQuote,
  getCandles,
  healthCheck,
};
