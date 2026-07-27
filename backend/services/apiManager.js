/**
 * Centralized API Manager
 * Orchestrates calls to all external APIs, handles fallbacks, and returns unified responses.
 * This is the single entry point for the controllers to use.
 */

const finnhubService = require("./finnhubService");
const marketauxService = require("./marketauxService");
const cryptopanicService = require("./cryptopanicService");
const openaiService = require("./openaiService");
const logger = require("../utils/logger");

/**
 * Fetch real-time market data (quote + candles) for a symbol.
 * @param {string} symbol - Asset symbol
 * @param {string} [resolution='60'] - Candle resolution
 * @param {number} [candleCount=50] - Number of candles
 * @returns {Promise<object>} Unified market data
 */
async function getMarketData(symbol, resolution = "60", candleCount = 50) {
  logger.info(`Fetching market data for: ${symbol}`);

  try {
    const [quote, candles] = await Promise.all([
      finnhubService.getQuote(symbol),
      finnhubService.getCandles(symbol, resolution, candleCount),
    ]);

    return {
      symbol: symbol.toUpperCase(),
      quote,
      candles,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`Market data fetch failed for ${symbol}`, {
      error: error.message,
    });

    // Return partial data if one call fails
    try {
      const quote = await finnhubService.getQuote(symbol);
      return {
        symbol: symbol.toUpperCase(),
        quote,
        candles: { candles: [], message: "Candle data unavailable" },
        timestamp: new Date().toISOString(),
        partial: true,
      };
    } catch (fallbackError) {
      throw Object.assign(
        new Error(
          `Unable to fetch market data for ${symbol}: ${error.message}`,
        ),
        { statusCode: 502 },
      );
    }
  }
}

/**
 * Fetch aggregated news from both Marketaux and CryptoPanic.
 * @param {object} options
 * @param {string} [options.symbol] - For financial news filtering
 * @param {string} [options.cryptoCurrency] - For crypto news filtering
 * @param {number} [options.limit=10] - Articles per source
 * @returns {Promise<object>} Aggregated news
 */
async function getAggregatedNews({
  symbol = "",
  cryptoCurrency = "BTC",
  limit = 10,
} = {}) {
  logger.info("Fetching aggregated news");

  const results = {
    financial: { articles: [], total: 0 },
    crypto: { posts: [], total: 0 },
    combined: [],
  };

  try {
    const financialNews = await marketauxService.getFinancialNews({
      symbols: symbol,
      limit,
    });
    results.financial.articles = financialNews.articles;
    results.financial.total = financialNews.total;
  } catch (error) {
    logger.error("Marketaux news fetch failed", { error: error.message });
  }

  try {
    const cryptoNews = await cryptopanicService.getCryptoNews({
      filter: "important",
      currency: cryptoCurrency,
      limit,
    });
    results.crypto.posts = cryptoNews.posts;
    results.crypto.total = cryptoNews.count;
  } catch (error) {
    logger.error("CryptoPanic news fetch failed", { error: error.message });
  }

  // Combine and sort by date
  const financialItems = results.financial.articles.map((a) => ({
    type: "financial",
    title: a.title,
    description: a.description,
    url: a.url,
    source: a.source,
    publishedAt: a.publishedAt,
    sentiment: a.overallSentimentLabel,
    sentimentScore: a.overallSentiment,
  }));

  const cryptoItems = results.crypto.posts.map((p) => ({
    type: "crypto",
    title: p.title,
    description: "",
    url: p.url,
    source: p.source,
    publishedAt: p.publishedAt,
    sentiment:
      p.votes.positive > p.votes.negative
        ? "Bullish"
        : p.votes.negative > p.votes.positive
          ? "Bearish"
          : "Neutral",
    sentimentScore:
      p.votes.total > 0
        ? (p.votes.positive - p.votes.negative) / p.votes.total
        : 0,
    currencies: p.currencies,
  }));

  results.combined = [...financialItems, ...cryptoItems]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit * 2);

  return results;
}

/**
 * Full analysis pipeline: fetch market data + news, then run AI analysis.
 * @param {object} userInput
 * @param {string} userInput.asset - Asset symbol
 * @param {string} userInput.timeframe - Timeframe
 * @param {string} [userInput.price] - Current price
 * @param {string} [userInput.exchange] - Exchange
 * @returns {Promise<object>} Complete analysis result
 */
async function runFullAnalysis(userInput) {
  const { asset, timeframe, price, exchange } = userInput;
  logger.info(`Running full analysis for: ${asset} on ${timeframe}`);

  // Step 1: Fetch market data (with fallback on failure)
  let marketData = null;
  try {
    marketData = await getMarketData(
      asset,
      timeframe === "1M"
        ? "M"
        : timeframe === "1w"
          ? "W"
          : timeframe === "1d"
            ? "D"
            : timeframe.replace("m", ""),
      100,
    );
  } catch (error) {
    logger.warn(`Market data unavailable for analysis: ${error.message}`);
  }

  // Step 2: Fetch news
  let newsData = [];
  try {
    const news = await getAggregatedNews({
      symbol: asset,
      cryptoCurrency: asset
        .replace("/USD", "")
        .replace("/USDT", "")
        .replace("USD", ""),
      limit: 10,
    });
    newsData = news.combined;
  } catch (error) {
    logger.warn(`News unavailable for analysis: ${error.message}`);
  }

  // Step 3: Run OpenAI analysis
  let aiAnalysis;
  try {
    aiAnalysis = await openaiService.generateMarketAnalysis(
      { quote: marketData?.quote, candles: marketData?.candles },
      newsData,
      { asset, timeframe, price, exchange },
    );
  } catch (error) {
    logger.error(`AI analysis failed: ${error.message}`);
    throw Object.assign(new Error(`AI analysis failed: ${error.message}`), {
      statusCode: 503,
    });
  }

  // Step 4: Return unified result
  return {
    asset,
    timeframe,
    exchange: exchange || "Unknown",
    price:
      price ||
      (marketData?.quote?.currentPrice
        ? `$${marketData.quote.currentPrice}`
        : "—"),
    marketData,
    news: newsData,
    analysis: aiAnalysis,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getMarketData,
  getAggregatedNews,
  runFullAnalysis,
};
