/**
 * CryptoPanic API Service
 * Provides cryptocurrency news, market sentiment, and social signals.
 *
 * Documentation: https://cryptopanic.com/developers/api/
 */

const axios = require("axios");
const logger = require("../utils/logger");

const CRYPTOPANIC_BASE_URL =
  process.env.CRYPTOPANIC_BASE_URL || "https://cryptopanic.com/api/v1";
const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY;

/**
 * Generic request handler for CryptoPanic API calls.
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Response data
 */
async function cryptopanicRequest(endpoint, params = {}) {
  try {
    const response = await axios.get(`${CRYPTOPANIC_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        auth_token: CRYPTOPANIC_API_KEY,
      },
      timeout: 10000,
    });

    logger.debug(`CryptoPanic API success: ${endpoint}`, { params });

    return response.data;
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMsg = error.response?.data?.error || error.message;

    logger.warn(`CryptoPanic API error (non-fatal): ${endpoint}`, {
      statusCode,
      error: errorMsg,
      params,
    });

    // Return empty result set instead of throwing — makes CryptoPanic optional
    return { count: 0, results: [] };
  }
}

/**
 * Fetch cryptocurrency news posts.
 * @param {object} options - Filter options
 * @param {string} [options.filter='hot'] - 'hot', 'rising', 'bullish', 'bearish', 'important', 'lol'
 * @param {string} [options.currency] - Filter by currency (e.g., 'BTC', 'ETH')
 * @param {string} [options.region] - Filter by region (e.g., 'en' for English)
 * @param {number} [options.limit=20] - Number of posts (max 100)
 * @param {number} [options.page=1] - Page number
 * @returns {Promise<object>} News posts with pagination
 */
async function getCryptoNews({
  filter = "hot",
  currency = "",
  region = "en",
  limit = 20,
  page = 1,
} = {}) {
  const validFilters = [
    "hot",
    "rising",
    "bullish",
    "bearish",
    "important",
    "lol",
  ];
  const safeFilter = validFilters.includes(filter) ? filter : "hot";

  const params = {
    filter: safeFilter,
    limit: Math.min(Math.max(1, limit), 100),
    page: Math.max(1, page),
  };

  // Only include public=true for API key auth
  params.public = "true";

  if (currency.trim()) params.currencies = currency.trim().toUpperCase();
  if (region.trim()) params.region = region.trim();

  const data = await cryptopanicRequest("/posts/", params);

  return {
    count: data.count || 0,
    page: page,
    next: data.next || null,
    previous: data.previous || null,
    posts: (data.results || []).map((post) => ({
      id: post.id,
      title: post.title,
      url: post.url,
      source: post.source?.title || "Unknown",
      publishedAt: post.published_at,
      created_at: post.created_at,
      domain: post.domain,
      currencies: (post.currencies || []).map((c) => ({
        code: c.code,
        title: c.title,
        slug: c.slug,
        url: c.url,
      })),
      votes: {
        positive: post.votes?.positive || 0,
        negative: post.votes?.negative || 0,
        important: post.votes?.important || 0,
        lol: post.votes?.lol || 0,
        total: (post.votes?.positive || 0) + (post.votes?.negative || 0),
      },
      metadata: {
        isHot: filter === "hot",
        kind: post.kind,
        isFeatured: post.is_featured,
      },
      raw: post,
    })),
    raw: data,
  };
}

/**
 * Get market sentiment for a specific cryptocurrency based on news.
 * @param {string} [currency='BTC'] - Cryptocurrency code
 * @param {number} [limit=20] - Number of posts to analyze
 * @returns {Promise<object>} Sentiment summary
 */
async function getCryptoAnalystSentiment(currency = "BTC", limit = 20) {
  const result = await getCryptoNews({
    filter: "important",
    currency,
    limit,
  });

  // Calculate sentiment from vote ratios
  const posts = result.posts;
  const totalPositive = posts.reduce((sum, p) => sum + p.votes.positive, 0);
  const totalNegative = posts.reduce((sum, p) => sum + p.votes.negative, 0);
  const totalVotes = totalPositive + totalNegative;

  let sentimentScore = 0;
  let sentimentLabel = "Neutral";
  if (totalVotes > 0) {
    sentimentScore = ((totalPositive - totalNegative) / totalVotes) * 100;
    sentimentScore = parseFloat(sentimentScore.toFixed(2));
    sentimentLabel =
      sentimentScore > 20
        ? "Bullish"
        : sentimentScore < -20
          ? "Bearish"
          : "Neutral";
  }

  return {
    currency: currency.toUpperCase(),
    sentimentScore,
    sentimentLabel,
    postsAnalyzed: posts.length,
    totalVotes,
    positiveVotes: totalPositive,
    negativeVotes: totalNegative,
    recentPosts: posts.slice(0, 5).map((p) => ({
      title: p.title,
      votes: p.votes,
      publishedAt: p.publishedAt,
    })),
  };
}

module.exports = {
  getCryptoNews,
  getCryptoAnalystSentiment,
};
