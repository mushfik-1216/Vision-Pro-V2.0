/**
 * Market Data Routes
 */

const express = require("express");
const router = express.Router();
const marketController = require("../controllers/marketController");
const { requireQuery } = require("../middleware/validator");

// GET /api/market/quote?symbol=BTCUSDT
router.get("/quote", requireQuery("symbol"), marketController.getQuote);

// GET /api/market/candles?symbol=BTCUSDT&resolution=60&count=100
router.get("/candles", requireQuery("symbol"), marketController.getCandles);

// GET /api/market/health
router.get("/health", marketController.healthCheck);

module.exports = router;
