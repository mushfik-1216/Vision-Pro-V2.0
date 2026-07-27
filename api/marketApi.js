/**
 * Market API — Frontend module for market data endpoints.
 *
 * All calls go through the backend (localhost:3001). No direct API calls.
 * API keys are stored server-side only.
 */

import apiClient from "./apiClient.js";

/**
 * Fetch a real-time quote for a symbol.
 * @param {string} symbol - Asset symbol (e.g., 'BTCUSDT', 'AAPL')
 * @returns {Promise<object>} Quote data with currentPrice, change, etc.
 */
export async function getQuote(symbol) {
  if (!symbol || symbol.trim() === "") {
    throw new Error("Symbol is required");
  }

  const response = await apiClient.get("/market/quote", {
    symbol: symbol.trim().toUpperCase(),
  });

  return response.data;
}

/**
 * Fetch historical candlestick data.
 * @param {string} symbol - Asset symbol
 * @param {string} [resolution='60'] - Candle resolution (1, 5, 15, 30, 60, D, W, M)
 * @param {number} [count=100] - Number of candles
 * @returns {Promise<object>} Candle data array
 */
export async function getCandles(symbol, resolution = "60", count = 100) {
  if (!symbol || symbol.trim() === "") {
    throw new Error("Symbol is required");
  }

  const response = await apiClient.get("/market/candles", {
    symbol: symbol.trim().toUpperCase(),
    resolution,
    count: String(count),
  });

  return response.data;
}

/**
 * Quick health check for market data connectivity.
 * @returns {Promise<object>} Health status
 */
export async function marketHealth() {
  const response = await apiClient.get("/market/health");
  return response.data;
}
