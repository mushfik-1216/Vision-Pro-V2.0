/**
 * News Controller
 * Handles HTTP requests for news aggregation endpoints.
 */

const ResponseFormatter = require("../utils/responseFormatter");
const apiManager = require("../services/apiManager");
const logger = require("../utils/logger");

/**
 * GET /api/news/aggregated
 * Get aggregated news from both Marketaux and CryptoPanic.
 */
async function getAggregatedNews(req, res, next) {
  try {
    const { symbol = "", cryptoCurrency = "BTC", limit = "10" } = req.query;

    logger.info(`Aggregated news requested`, { symbol, cryptoCurrency, limit });

    const newsLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);

    const news = await apiManager.getAggregatedNews({
      symbol: symbol.trim(),
      cryptoCurrency: cryptoCurrency.trim().toUpperCase(),
      limit: newsLimit,
    });

    return ResponseFormatter.success(res, {
      financial: {
        total: news.financial.total,
        articles: news.financial.articles,
      },
      crypto: {
        total: news.crypto.total,
        posts: news.crypto.posts,
      },
      combined: news.combined,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/news/financial
 * Get financial news from Marketaux only.
 */
async function getFinancialNews(req, res, next) {
  try {
    const { symbols = "", keywords = "", limit = "10", page = "1" } = req.query;

    logger.info(`Financial news requested`, { symbols, keywords, limit, page });

    const newsLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 50);
    const newsPage = Math.max(1, parseInt(page, 10) || 1);

    const marketauxService = require("../services/marketauxService");
    const news = await marketauxService.getFinancialNews({
      symbols: symbols.trim(),
      keywords: keywords.trim(),
      limit: newsLimit,
      page: newsPage,
    });

    return ResponseFormatter.paginated(
      res,
      news.articles,
      newsPage,
      newsLimit,
      news.total,
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/news/crypto
 * Get crypto news from CryptoPanic only.
 */
async function getCryptoNews(req, res, next) {
  try {
    const {
      filter = "hot",
      currency = "",
      region = "en",
      limit = "20",
      page = "1",
    } = req.query;

    logger.info(`Crypto news requested`, {
      filter,
      currency,
      region,
      limit,
      page,
    });

    const newsLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
    const newsPage = Math.max(1, parseInt(page, 10) || 1);

    const cryptopanicService = require("../services/cryptopanicService");
    const news = await cryptopanicService.getCryptoNews({
      filter: filter.trim(),
      currency: currency.trim(),
      region: region.trim(),
      limit: newsLimit,
      page: newsPage,
    });

    return ResponseFormatter.success(res, {
      count: news.count,
      page: newsPage,
      posts: news.posts,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAggregatedNews,
  getFinancialNews,
  getCryptoNews,
};
