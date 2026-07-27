/**
 * Marketaux API Service
 * Provides financial news aggregation across stocks, crypto, and traditional markets.
 *
 * Documentation: https://www.marketaux.com/documentation
 */

const axios = require("axios");
const logger = require("../utils/logger");

const MARKETAUX_BASE_URL =
  process.env.MARKETAUX_BASE_URL || "https://api.marketaux.com/v1";
const MARKETAUX_API_KEY = process.env.MARKETAUX_API_KEY;

/**
 * Generic request handler for Marketaux API calls.
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Response data
 */
async function marketauxRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${MARKETAUX_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        api_token: MARKETAUX_API_KEY,
      },
      timeout: 10000,
    });

    logger.debug(`Marketaux API success: ${endpoint}`, { params });

    return response.data;
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMsg = error.response?.data?.error?.message || error.message;

    logger.error(`Marketaux API error: ${endpoint}`, {
      statusCode,
      error: errorMsg,
      params,
    });

    throw Object.assign(new Error(`Marketaux API error: ${errorMsg}`), {
      statusCode,
    });
  }
}

/**
 * Fetch financial news articles.
 * @param {object} options - Search options
 * @param {string} [options.symbols] - Comma-separated symbols (e.g., 'AAPL,TSLA')
 * @param {string} [options.keywords] - Search keywords
 * @param {string} [options.filterEntities] - Filter by entity type (e.g., 'true')
 * @param {number} [options.limit=10] - Number of articles (1-50)
 * @param {number} [options.page=1] - Page number
 * @returns {Promise<object>} News articles with pagination
 */
async function getFinancialNews({
  symbols = "",
  keywords = "",
  filterEntities = "true",
  limit = 10,
  page = 1,
} = {}) {
  const params = {
    filter_entities: filterEntities,
    limit: Math.min(Math.max(1, limit), 50),
    page: Math.max(1, page),
  };

  if (symbols.trim()) params.symbols = symbols.trim();
  if (keywords.trim()) params.keywords = keywords.trim();

  const data = await marketauxRequest("/news/all", params);

  return {
    total: data.meta?.found || 0,
    returned: data.data?.length || 0,
    page: data.meta?.page || page,
    articles: (data.data || []).map((article) => ({
      uuid: article.uuid,
      title: article.title,
      description: article.description,
      snippet: article.snippet,
      url: article.url,
      source: article.source,
      publishedAt: article.published_at,
      entities: (article.entities || []).map((e) => ({
        symbol: e.symbol,
        name: e.name,
        sentimentScore: e.sentiment_score,
      })),
      overallSentiment: article.overall_sentiment_score,
      overallSentimentLabel: article.overall_sentiment_label,
      raw: article,
    })),
    raw: data,
  };
}

/**
 * Get market sentiment for a specific symbol based on recent news.
 * @param {string} symbol - Stock/crypto symbol
 * @param {number} [limit=5] - Number of articles to analyze
 * @returns {Promise<object>} Sentiment analysis
 */
async function getSentiment(symbol, limit = 5) {
  if (!symbol)
    throw Object.assign(new Error("Symbol is required"), { statusCode: 400 });

  const result = await getFinancialNews({ symbols: symbol, limit });

  const sentimentScores = result.articles
    .filter(
      (a) => a.overallSentiment !== null && a.overallSentiment !== undefined,
    )
    .map((a) => a.overallSentiment);

  const avgSentiment =
    sentimentScores.length > 0
      ? sentimentScores.reduce((sum, s) => sum + s, 0) / sentimentScores.length
      : 0;

  return {
    symbol: symbol.toUpperCase(),
    averageSentiment: parseFloat(avgSentiment.toFixed(4)),
    sentimentLabel:
      avgSentiment > 0.15
        ? "Bullish"
        : avgSentiment < -0.15
          ? "Bearish"
          : "Neutral",
    articleCount: result.articles.length,
    articles: result.articles,
  };
}

module.exports = {
  getFinancialNews,
  getSentiment,
};
