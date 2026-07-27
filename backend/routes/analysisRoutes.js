/**
 * Analysis Routes
 */

const express = require("express");
const router = express.Router();
const analysisController = require("../controllers/analysisController");
const { requireBody } = require("../middleware/validator");
const { analysisLimiter } = require("../middleware/rateLimiter");

// POST /api/analysis/analyze — Rate limited (5 req/min)
router.post(
  "/analyze",
  analysisLimiter,
  requireBody("asset", "timeframe"),
  analysisController.runAnalysis,
);

// GET /api/analysis/health
router.get("/health", analysisController.analysisHealth);

module.exports = router;
