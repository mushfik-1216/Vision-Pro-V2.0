/**
 * Route aggregator — mounts all sub-routers under their prefixes.
 */

const express = require("express");
const router = express.Router();

const marketRoutes = require("./marketRoutes");
const newsRoutes = require("./newsRoutes");
const analysisRoutes = require("./analysisRoutes");

// Health check for the entire API
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "TradeVision Pro AI API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount sub-routers
router.use("/market", marketRoutes);
router.use("/news", newsRoutes);
router.use("/analysis", analysisRoutes);

module.exports = router;
