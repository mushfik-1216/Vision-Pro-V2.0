/**
 * News Routes
 */

const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");

// GET /api/news/aggregated?symbol=AAPL&cryptoCurrency=BTC&limit=10
router.get("/aggregated", newsController.getAggregatedNews);

// GET /api/news/financial?symbols=AAPL&limit=10
router.get("/financial", newsController.getFinancialNews);

// GET /api/news/crypto?filter=hot&currency=BTC&limit=20
router.get("/crypto", newsController.getCryptoNews);

module.exports = router;
