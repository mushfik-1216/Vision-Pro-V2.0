/**
 * TradeVision Pro AI — Backend Server
 *
 * Express server that:
 * 1. Serves as a secure proxy between frontend and external APIs
 * 2. Handles Finnhub, Marketaux, CryptoPanic, and OpenAI integrations
 * 3. Provides rate limiting, error handling, and request logging
 * 4. Keeps all API keys server-side-only
 *
 * Startup: npm start  (or  node server.js)
 */

// ── Load environment variables ───────────────────────────────
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const apiRoutes = require("./routes/index");
const { globalErrorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");
const logger = require("./utils/logger");

// ── Initialize Express ───────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";

// ── Security Middleware ──────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin:
      NODE_ENV === "production"
        ? ["https://your-production-domain.com"]
        : [
            "http://localhost:5500",
            "http://localhost:3000",
            "http://127.0.0.1:5500",
            "http://localhost:3001",
          ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Parsing Middleware ───────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ──────────────────────────────────────────
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// ── Rate Limiting ────────────────────────────────────────────
app.use("/api", apiLimiter);

// ── API Routes ───────────────────────────────────────────────
app.use("/api", apiRoutes);

// ── Serve Static Frontend (optional, for production) ─────────
// In development, the frontend is served separately (e.g., via Live Server on port 5500)
// In production, you can serve the built frontend from here:
// app.use(express.static(path.join(__dirname, '..')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'index.html'));
// });

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ─────────────────────────────────────
app.use(globalErrorHandler);

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`╔══════════════════════════════════════════════╗`);
  logger.info(`║   TradeVision Pro AI — Backend Server        ║`);
  logger.info(`║   Port: ${PORT}                               ║`);
  logger.info(`║   Environment: ${NODE_ENV}                    ║`);
  logger.info(`║   API: http://localhost:${PORT}/api           ║`);
  logger.info(`╚══════════════════════════════════════════════╝`);

  // Verify critical environment variables
  const requiredKeys = [
    "FINNHUB_API_KEY",
    "MARKETAUX_API_KEY",
    "CRYPTOPANIC_API_KEY",
    "OPENAI_API_KEY",
  ];
  const missingKeys = requiredKeys.filter((key) => !process.env[key]);

  if (missingKeys.length > 0) {
    logger.warn(`Missing API keys in .env: ${missingKeys.join(", ")}`);
    logger.warn("Some API services may not work until these are configured.");
  } else {
    logger.info("All API keys are configured.");
  }
});
