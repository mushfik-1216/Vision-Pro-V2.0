/**
 * News API — Frontend module for news endpoints.
 *
 * All calls go through the backend (localhost:3001). No direct API calls.
 * API keys are stored server-side only.
 */

import apiClient from "./apiClient.js";

/**
 * Fetch aggregated news from both Marketaux (financial) and CryptoPanic (crypto).
 * @param {object} options
 * @param {string} [options.symbol] - Symbol for financial news filtering
 * @param {string} [options.cryptoCurrency='BTC'] - Currency for crypto news
 * @param {number} [options.limit=10] - Articles per source
 * @returns {Promise<object>} Combined news data
 */
export async function getAggregatedNews({
  symbol = "",
  cryptoCurrency = "BTC",
  limit = 10,
} = {}) {
  const response = await apiClient.get("/news/aggregated", {
    symbol: symbol.trim(),
    cryptoCurrency: cryptoCurrency.trim().toUpperCase(),
    limit: String(limit),
  });

  return response.data;
}

/**
 * Fetch financial news from Marketaux only.
 * @param {object} options
 * @param {string} [options.symbols] - Comma-separated symbols (e.g., 'AAPL,TSLA')
 * @param {string} [options.keywords] - Search keywords
 * @param {number} [options.limit=10] - Number of articles
 * @returns {Promise<object>} Financial news data
 */
export async function getFinancialNews({
  symbols = "",
  keywords = "",
  limit = 10,
} = {}) {
  const response = await apiClient.get("/news/financial", {
    symbols: symbols.trim(),
    keywords: keywords.trim(),
    limit: String(limit),
  });

  return response.data;
}

/**
 * Fetch crypto news from CryptoPanic only.
 * @param {object} options
 * @param {string} [options.filter='hot'] - Filter: hot, rising, bullish, bearish, important, lol
 * @param {string} [options.currency] - Cryptocurrency code
 * @param {number} [options.limit=20] - Number of posts
 * @returns {Promise<object>} Crypto news data
 */
export async function getCryptoNews({
  filter = "hot",
  currency = "",
  limit = 20,
} = {}) {
  const response = await apiClient.get("/news/crypto", {
    filter,
    currency: currency.trim().toUpperCase(),
    limit: String(limit),
  });

  return response.data;
}
