/**
 * Finnhub API Service
 * Handles all communication with the Finnhub market data API.
 * Provides real-time quotes, historical candles, and company news.
 *
 * Documentation: https://finnhub.io/docs/api
 */

const axios = require("axios");
const logger = require("../utils/logger");

const FINNHUB_BASE_URL =
  process.env.FINNHUB_BASE_URL || "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

/**
 * Generic request handler for Finnhub API calls.
 * @param {string} endpoint - API endpoint path (e.g., '/quote')
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Response data
 */
async function finnhubRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        token: FINNHUB_API_KEY,
      },
      timeout: 10000,
    });

    logger.debug(`Finnhub API success: ${endpoint}`, { params });

    return response.data;
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMsg = error.response?.data?.error || error.message;

    logger.error(`Finnhub API error: ${endpoint}`, {
      statusCode,
      error: errorMsg,
      params,
    });

    throw Object.assign(new Error(`Finnhub API error: ${errorMsg}`), {
      statusCode,
    });
  }
}

/**
 * Get real-time quote for a symbol.
 * @param {string} symbol - Stock/crypto symbol (e.g., 'AAPL', 'BTC-USD')
 * @returns {Promise<object>} { c, h, l, o, pc, t, dp, d }
 */
async function getQuote(symbol) {
  if (!symbol)
    throw Object.assign(new Error("Symbol is required"), { statusCode: 400 });

  const data = await finnhubRequest("/quote", { symbol });

  return {
    symbol: symbol.toUpperCase(),
    currentPrice: data.c,
    highPrice: data.h,
    lowPrice: data.l,
    openPrice: data.o,
    previousClose: data.pc,
    timestamp: data.t,
    change: data.d,
    percentChange: data.dp,
    raw: data,
  };
}

/**
 * Get historical candlestick data.
 * @param {string} symbol - Symbol (e.g., 'AAPL')
 * @param {string} resolution - 1, 5, 15, 30, 60, D, W, M
 * @param {number} count - Number of candles to fetch (max 5000)
 * @returns {Promise<Array>} Array of candle objects
 */
async function getCandles(symbol, resolution = "60", count = 100) {
  if (!symbol)
    throw Object.assign(new Error("Symbol is required"), { statusCode: 400 });

  const resolutions = ["1", "5", "15", "30", "60", "D", "W", "M"];
  if (!resolutions.includes(resolution)) {
    throw Object.assign(
      new Error(
        `Invalid resolution: ${resolution}. Must be one of: ${resolutions.join(", ")}`,
      ),
      { statusCode: 400 },
    );
  }

  const to = Math.floor(Date.now() / 1000);
  // Approximate seconds based on resolution
  const resolutionSeconds =
    resolution === "D"
      ? 86400
      : resolution === "W"
        ? 604800
        : resolution === "M"
          ? 2592000
          : parseInt(resolution, 10) * 60;
  const from = to - resolutionSeconds * count;

  const data = await finnhubRequest("/stock/candle", {
    symbol,
    resolution,
    from,
    to,
  });

  if (data.s === "no_data") {
    return {
      candles: [],
      message: "No data available for this symbol/resolution.",
    };
  }

  // Format candles into array of objects
  const candles = (data.t || []).map((timestamp, i) => ({
    timestamp,
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }));

  return {
    symbol: symbol.toUpperCase(),
    resolution,
    count: candles.length,
    candles,
    raw: data,
  };
}

/**
 * Get company profile information.
 * @param {string} symbol - Stock symbol
 * @returns {Promise<object>} Company profile
 */
async function getCompanyProfile(symbol) {
  if (!symbol)
    throw Object.assign(new Error("Symbol is required"), { statusCode: 400 });

  const data = await finnhubRequest("/stock/profile2", { symbol });

  if (!data || Object.keys(data).length === 0) {
    return { message: "No profile data available for this symbol." };
  }

  return {
    symbol: data.ticker,
    name: data.name,
    logo: data.logo,
    exchange: data.exchange,
    industry: data.finnhubIndustry,
    marketCap: data.marketCapitalization,
    ipo: data.ipo,
    shareOutstanding: data.shareOutstanding,
    weburl: data.weburl,
    raw: data,
  };
}

module.exports = {
  getQuote,
  getCandles,
  getCompanyProfile,
};
