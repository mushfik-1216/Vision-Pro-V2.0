/**
 * OpenAI API Service
 * Provides AI-powered market analysis using GPT models.
 * Constructs structured prompts from market data and news, then returns JSON analysis.
 *
 * Documentation: https://platform.openai.com/docs/api-reference
 */

const axios = require("axios");
const logger = require("../utils/logger");

const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Make a request to the OpenAI Chat Completions API.
 * @param {Array} messages - Array of message objects
 * @param {object} options - Model options
 * @returns {Promise<object>} API response
 */
async function openaiRequest(messages, options = {}) {
  const model = options.model || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.3;
  const maxTokens = options.maxTokens || 2000;

  try {
    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    logger.debug("OpenAI API success", {
      model,
      tokens: response.data.usage?.total_tokens,
    });

    return response.data;
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMsg = error.response?.data?.error?.message || error.message;

    logger.error("OpenAI API error", {
      statusCode,
      error: errorMsg,
      model,
    });

    throw Object.assign(new Error(`OpenAI API error: ${errorMsg}`), {
      statusCode,
    });
  }
}

/**
 * Generate a comprehensive market analysis for a given asset.
 * @param {object} marketData - Market data from Finnhub
 * @param {Array} newsData - Array of news articles from Marketaux/CryptoPanic
 * @param {object} userInput - User-provided input
 * @param {string} userInput.asset - Asset/pair name
 * @param {string} userInput.timeframe - Chart timeframe
 * @param {string} [userInput.price] - Current price
 * @param {string} [userInput.exchange] - Exchange name
 * @returns {Promise<object>} Structured JSON analysis matching existing UI sections
 */
async function generateMarketAnalysis(marketData, newsData, userInput) {
  const systemPrompt = `You are TradeVision Pro AI, an expert institutional-grade market analyst.

You analyze markets using:
- Technical analysis (market structure, trends, S&R, indicators)
- Smart Money Concepts (BOS, CHOCH, Order Blocks, FVG, Liquidity)
- Candlestick patterns
- Chart patterns
- Volume and momentum analysis
- News sentiment integration

You MUST return ONLY valid JSON (no markdown, no code fences) matching this EXACT structure:

{
  "marketStructure": { "trend": "Uptrend|Downtrend|Sideways", "description": "string" },
  "trendAnalysis": { "direction": "Bullish|Bearish|Neutral", "confidence": number(1-100), "description": "string" },
  "supportResistance": { "majorSupport": "string", "majorResistance": "string", "demandZone": "string", "supplyZone": "string", "liquidityLow": "string", "liquidityHigh": "string", "description": "string" },
  "smartMoneyConcepts": { "concepts": ["string"], "description": "string" },
  "candlestickAnalysis": { "patterns": [{ "name": "string", "sentiment": "bullish|bearish|neutral", "description": "string" }], "description": "string" },
  "chartPatterns": { "patterns": ["string"], "description": "string" },
  "technicalIndicators": [{ "name": "string", "value": "string", "signal": "bullish|bearish|neutral" }],
  "volumeAnalysis": { "description": "string" },
  "momentumAnalysis": { "strength": "Strong|Moderate|Weakening|Exhaustion", "description": "string" },
  "riskAnalysis": { "level": "Low|Medium|High", "details": ["string"] },
  "aiSignal": { "signal": "BUY|SELL|WAIT", "confidence": number(1-100), "description": "string" },
  "tradePlan": { "hasSetup": boolean, "entry": "string", "stopLoss": "string", "target1": "string", "target2": "string", "riskReward": "string", "description": "string" },
  "newsImpact": { "description": "string", "sentiment": "Bullish|Bearish|Neutral", "keyHeadlines": ["string"] },
  "finalSummary": { "bias": "Bullish|Bearish|Neutral", "signal": "BUY|SELL|WAIT", "confidence": number, "riskLevel": "Low|Medium|High", "bestObservation": "string", "mainWarning": "string", "bottomLine": "string" }
}

Important rules:
- Be conservative with signals. Only BUY/SELL when confluence is strong (70%+ confidence).
- Default to WAIT when data is insufficient or conflicting.
- Risk:Reward should be realistic (1:1.5 to 1:5 range).
- Use proper price formatting with dollar signs.
- All descriptions should be professional, educational, and 2-4 sentences.`;

  const currentPrice =
    marketData?.quote?.currentPrice || userInput.price || "Unknown";
  const priceChange = marketData?.quote?.change || "N/A";
  const priceChangePercent = marketData?.quote?.percentChange || "N/A";

  const userPrompt = `Analyze the following market data and provide a comprehensive technical analysis.

ASSET INFORMATION:
- Asset: ${userInput.asset || "Unknown"}
- Timeframe: ${userInput.timeframe || "1h"}
- Current Price: $${currentPrice}
- Exchange: ${userInput.exchange || "Unknown"}

MARKET DATA:
${
  marketData?.quote
    ? `- Current Price: $${marketData.quote.currentPrice}
- Daily High: $${marketData.quote.highPrice}
- Daily Low: $${marketData.quote.lowPrice}
- Open: $${marketData.quote.openPrice}
- Previous Close: $${marketData.quote.previousClose}
- Change: $${priceChange} (${priceChangePercent}%)`
    : "No real-time market data available."
}

${
  marketData?.candles?.candles?.length > 0
    ? `Recent price action (last ${marketData.candles.count} candles, resolution: ${marketData.candles.resolution}):
- Latest close trending from $${marketData.candles.candles[marketData.candles.candles.length - 1]?.close || "N/A"}
- Candle count available for analysis.`
    : ""
}

NEWS & SENTIMENT:
${newsData?.length > 0 ? newsData.map((n, i) => `${i + 1}. "${n.title}"${n.source ? ` (${n.source})` : ""}${n.overallSentimentLabel ? ` [Sentiment: ${n.overallSentimentLabel}]` : ""}`).join("\n") : "No recent news data available."}

Provide a thorough JSON analysis following the exact schema specified. If data is missing, make reasonable assumptions based on the available information and note them.`;

  const response = await openaiRequest([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const content = response.choices?.[0]?.message?.content || "{}";

  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (parseError) {
    logger.error("Failed to parse OpenAI response as JSON", {
      content: content.substring(0, 500),
      error: parseError.message,
    });

    // Return a fallback structure with error note
    return {
      error: "Failed to parse AI response",
      rawContent: content.substring(0, 1000),
      finalSummary: {
        bias: "Neutral",
        signal: "WAIT",
        confidence: 0,
        riskLevel: "High",
        bestObservation: "AI analysis failed to generate properly.",
        mainWarning: "AI response parsing error. Please try again.",
        bottomLine: "Analysis could not be completed due to a technical error.",
      },
    };
  }
}

/**
 * Generate a concise market summary for quick display.
 * @param {object} marketData - Market data
 * @param {Array} newsData - News articles
 * @param {object} userInput - User input
 * @returns {Promise<string>} Concise summary
 */
async function generateQuickSummary(marketData, newsData, userInput) {
  const response = await generateMarketAnalysis(
    marketData,
    newsData,
    userInput,
  );
  return response.finalSummary?.bottomLine || "Analysis completed.";
}

module.exports = {
  generateMarketAnalysis,
  generateQuickSummary,
};
