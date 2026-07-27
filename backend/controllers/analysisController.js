/**
 * Analysis Controller
 * Handles the main AI-powered market analysis endpoint.
 * Orchestrates data fetching and OpenAI analysis via apiManager.
 */

const ResponseFormatter = require("../utils/responseFormatter");
const apiManager = require("../services/apiManager");
const logger = require("../utils/logger");

/**
 * POST /api/analysis/analyze
 * Run a full AI-powered market analysis.
 * Body: { asset, timeframe, price?, exchange? }
 */
async function runAnalysis(req, res, next) {
  try {
    const { asset, timeframe, price, exchange } = req.body;

    // Validate required fields
    if (!asset || asset.trim() === "") {
      return ResponseFormatter.error(res, "Asset/pair is required", 400);
    }

    if (!timeframe || timeframe.trim() === "") {
      return ResponseFormatter.error(res, "Timeframe is required", 400);
    }

    const sanitizedAsset = asset.trim().toUpperCase();
    const sanitizedTimeframe = timeframe.trim().toLowerCase();
    const sanitizedPrice = price ? price.trim() : "";
    const sanitizedExchange = exchange ? exchange.trim() : "";

    logger.info(`Analysis requested`, {
      asset: sanitizedAsset,
      timeframe: sanitizedTimeframe,
    });

    // Run the full analysis pipeline
    const result = await apiManager.runFullAnalysis({
      asset: sanitizedAsset,
      timeframe: sanitizedTimeframe,
      price: sanitizedPrice,
      exchange: sanitizedExchange,
    });

    logger.info(`Analysis completed for ${sanitizedAsset}`, {
      signal: result.analysis?.aiSignal?.signal,
      confidence: result.analysis?.aiSignal?.confidence,
    });

    return ResponseFormatter.success(res, result);
  } catch (error) {
    // If the API analysis fails, we still want to return a structured response
    // with a fallback indicating the AI analysis failed
    if (error.statusCode === 503) {
      return ResponseFormatter.success(res, {
        asset: req.body?.asset?.toUpperCase() || "Unknown",
        timeframe: req.body?.timeframe || "1h",
        exchange: req.body?.exchange || "Unknown",
        price: req.body?.price || "—",
        error: "AI analysis service unavailable",
        fallback: true,
        generatedAt: new Date().toISOString(),
      });
    }
    next(error);
  }
}

/**
 * GET /api/analysis/health
 * Check if the analysis service is ready.
 */
async function analysisHealth(req, res) {
  return ResponseFormatter.success(res, {
    status: "operational",
    service: "TradeVision Pro AI Analysis Engine",
    version: "1.0.0",
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    finnhubConfigured: !!process.env.FINNHUB_API_KEY,
    marketauxConfigured: !!process.env.MARKETAUX_API_KEY,
    cryptopanicConfigured: !!process.env.CRYPTOPANIC_API_KEY,
  });
}

module.exports = {
  runAnalysis,
  analysisHealth,
};
