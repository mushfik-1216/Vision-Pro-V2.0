/**
 * API Client — Frontend-side HTTP client
 *
 * Communicates ONLY with the TradeVision Pro AI backend.
 * NO API keys are stored here — all secrets are server-side.
 *
 * Exposed as window.TradeVisionAPI
 */

(function () {
  "use strict";

  const API_BASE_URL = "https://vision-pro-v2-0.onrender.com/api";

  /**
   * Generic fetch wrapper for backend API calls.
   */
  async function apiClient(endpoint, options = {}) {
    const {
      params = {},
      body = null,
      method = "GET",
      timeout = 15000,
    } = options;

    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    // Build fetch options
    const fetchOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    if (body && method === "POST") {
      fetchOptions.body = JSON.stringify(body);
    }

    // AbortController for timeout
    const controller = new AbortController();
    fetchOptions.signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), fetchOptions);
      clearTimeout(timeoutId);

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error(
          `Invalid JSON response from server (HTTP ${response.status})`,
        );
      }

      if (!response.ok) {
        const errorMsg =
          responseData?.error || `Server error (HTTP ${response.status})`;
        throw new Error(errorMsg);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeout / 1000}s`);
      }

      if (error.message === "Failed to fetch") {
        throw new Error(
          "Cannot connect to the analysis server. Make sure the backend is running on port 3001.",
        );
      }

      throw error;
    }
  }

  /**
   * GET convenience.
   */
  apiClient.get = function (endpoint, params = {}) {
    return apiClient(endpoint, { method: "GET", params });
  };

  /**
   * POST convenience.
   */
  apiClient.post = function (endpoint, body = {}) {
    return apiClient(endpoint, { method: "POST", body });
  };

  // ── Market API ──────────────────────────────────────────

  const marketApi = {
    async getQuote(symbol) {
      if (!symbol || symbol.trim() === "")
        throw new Error("Symbol is required");
      const res = await apiClient.get("/market/quote", {
        symbol: symbol.trim().toUpperCase(),
      });
      return res.data;
    },

    async getCandles(symbol, resolution = "60", count = 100) {
      if (!symbol || symbol.trim() === "")
        throw new Error("Symbol is required");
      const res = await apiClient.get("/market/candles", {
        symbol: symbol.trim().toUpperCase(),
        resolution,
        count: String(count),
      });
      return res.data;
    },

    async health() {
      const res = await apiClient.get("/market/health");
      return res.data;
    },
  };

  // ── News API ────────────────────────────────────────────

  const newsApi = {
    async getAggregatedNews({
      symbol = "",
      cryptoCurrency = "BTC",
      limit = 10,
    } = {}) {
      const res = await apiClient.get("/news/aggregated", {
        symbol: symbol.trim(),
        cryptoCurrency: cryptoCurrency.trim().toUpperCase(),
        limit: String(limit),
      });
      return res.data;
    },

    async getFinancialNews({ symbols = "", keywords = "", limit = 10 } = {}) {
      const res = await apiClient.get("/news/financial", {
        symbols: symbols.trim(),
        keywords: keywords.trim(),
        limit: String(limit),
      });
      return res.data;
    },

    async getCryptoNews({ filter = "hot", currency = "", limit = 20 } = {}) {
      const res = await apiClient.get("/news/crypto", {
        filter,
        currency: currency.trim().toUpperCase(),
        limit: String(limit),
      });
      return res.data;
    },
  };

  // ── Analysis API ────────────────────────────────────────

  const analysisApi = {
    async runAnalysis({ asset, timeframe, price, exchange } = {}) {
      if (!asset || !timeframe)
        throw new Error("Asset and timeframe are required");
      const res = await apiClient.post("/analysis/analyze", {
        asset: asset.trim().toUpperCase(),
        timeframe: timeframe.trim().toLowerCase(),
        price: price ? price.trim() : "",
        exchange: exchange ? exchange.trim() : "",
      });
      return res.data;
    },

    async health() {
      const res = await apiClient.get("/analysis/health");
      return res.data;
    },
  };

  // ── Expose globally ─────────────────────────────────────

  window.TradeVisionAPI = {
    client: apiClient,
    market: marketApi,
    news: newsApi,
    analysis: analysisApi,
  };

  console.log(
    "[TradeVisionAPI] Frontend API client loaded. Backend URL:",
    API_BASE_URL,
  );
})();
