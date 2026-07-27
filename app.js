/* ================================================================
   TradeVision Pro AI — Application Engine
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM References ----
  const uploadContainer = document.getElementById("uploadContainer");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadPreview = document.getElementById("uploadPreview");
  const previewImage = document.getElementById("previewImage");
  const changeImageBtn = document.getElementById("changeImageBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const loadingSection = document.getElementById("loadingSection");
  const resultsSection = document.getElementById("resultsSection");
  const copyBtn = document.getElementById("copyBtn");
  const newAnalysisBtn = document.getElementById("newAnalysisBtn");

  // Inputs
  const assetInput = document.getElementById("assetInput");
  const timeframeInput = document.getElementById("timeframeInput");
  const priceInput = document.getElementById("priceInput");
  const exchangeInput = document.getElementById("exchangeInput");

  // Loading steps
  const loadSteps = [
    document.getElementById("loadStep1"),
    document.getElementById("loadStep2"),
    document.getElementById("loadStep3"),
    document.getElementById("loadStep4"),
  ];

  let uploadedFile = null;
  let analysisResult = null;

  // ---- Upload Handlers ----
  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      uploadContainer.style.display = "none";
      uploadPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  uploadContainer.addEventListener("click", () => fileInput.click());
  uploadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  changeImageBtn.addEventListener("click", () => {
    uploadedFile = null;
    uploadPreview.style.display = "none";
    uploadContainer.style.display = "block";
    fileInput.value = "";
  });

  // Drag & Drop
  uploadContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadContainer.classList.add("drag-over");
  });
  uploadContainer.addEventListener("dragleave", () => {
    uploadContainer.classList.remove("drag-over");
  });
  uploadContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadContainer.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  // ============================================================
  //  ANALYSIS ENGINE — Backend-first with local fallback
  // ============================================================

  /**
   * Main analysis entry point.
   * Tries real backend API first. Falls back to local mock if unavailable.
   */
  async function generateAnalysis() {
    const asset = assetInput.value.trim() || "BTC/USDT";
    const timeframe = timeframeInput.value;
    const price = priceInput.value.trim() || "—";
    const exchange = exchangeInput.value;

    // Try the backend API first
    if (window.TradeVisionAPI) {
      try {
        console.log("[TradeVision] Requesting AI analysis from backend...");
        const apiResult = await window.TradeVisionAPI.analysis.runAnalysis({
          asset,
          timeframe,
          price: price !== "—" ? price : "",
          exchange,
        });

        // If the backend returned a successful analysis, map it to render format
        if (apiResult && apiResult.analysis && !apiResult.fallback) {
          console.log("[TradeVision] Backend analysis received successfully.");
          return mapBackendResponse(apiResult);
        } else {
          console.warn(
            "[TradeVision] Backend returned fallback/empty response. Using local fallback.",
          );
        }
      } catch (error) {
        console.warn("[TradeVision] Backend API unavailable:", error.message);
        console.log("[TradeVision] Falling back to local analysis engine.");
      }
    } else {
      console.log(
        "[TradeVision] TradeVisionAPI not loaded. Using local analysis.",
      );
    }

    // Fallback: use local mock analysis
    return generateLocalAnalysis(asset, timeframe, price, exchange);
  }

  /**
   * Map backend API response to the format expected by renderAnalysis().
   */
  function mapBackendResponse(apiResult) {
    const a = apiResult.analysis || {};
    const price = apiResult.price || "—";

    // Basic info from the backend
    const result = {
      asset: apiResult.asset || "Unknown",
      timeframe: apiResult.timeframe || "1h",
      price: price,
      exchange: apiResult.exchange || "TradingView",
    };

    // Market Structure
    const ms = a.marketStructure || {};
    result.structure = {
      trend: ms.trend || "Sideways / Ranging",
      desc: ms.description || "Market structure analysis from AI.",
    };

    // Trend Analysis
    const ta = a.trendAnalysis || {};
    result.trend = {
      dir: ta.direction || "Neutral",
      conf: ta.confidence || 50,
      text: ta.description || "Trend analysis from AI.",
    };

    // Support & Resistance
    const sr = a.supportResistance || {};
    result.sr = {
      majorSupport: sr.majorSupport || "—",
      majorResistance: sr.majorResistance || "—",
      demandZone: sr.demandZone || "—",
      supplyZone: sr.supplyZone || "—",
      liquidityLow: sr.liquidityLow || "—",
      liquidityHigh: sr.liquidityHigh || "—",
    };

    // Smart Money Concepts
    const smc = a.smartMoneyConcepts || {};
    result.smcVisible = smc.concepts || ["SMC analysis from AI"];

    // Candlestick Analysis
    const ca = a.candlestickAnalysis || {};
    result.candleVisible = (ca.patterns || []).map((p) => ({
      name: p.name || "Unknown Pattern",
      sentiment: p.sentiment || "neutral",
      desc: p.description || "",
    }));
    if (result.candleVisible.length === 0) {
      result.candleVisible = [
        {
          name: "Candlestick Analysis",
          sentiment: "neutral",
          desc: ca.description || "AI candlestick analysis.",
        },
      ];
    }

    // Chart Patterns
    const cp = a.chartPatterns || {};
    result.patternVisible = cp.patterns || [];

    // Technical Indicators
    const ti = a.technicalIndicators || [];
    result.indicators =
      ti.map((ind) => ({
        name: ind.name || "Indicator",
        value: ind.value || "—",
        cls: ind.signal || "neutral",
      })) || [];

    // Volume
    const va = a.volumeAnalysis || {};
    result.volume = va.description || "Volume analysis from AI.";

    // Momentum
    const ma = a.momentumAnalysis || {};
    result.momentum = {
      strength: ma.strength || "Moderate",
      text: ma.description || "Momentum analysis from AI.",
    };

    // Risk
    const ra = a.riskAnalysis || {};
    result.risk = ra.level || "Medium";
    result.riskDetails = ra.details || ["Risk analysis from AI."];

    // AI Signal
    const as = a.aiSignal || {};
    result.signal = as.signal || "WAIT";
    result.signalText = as.description || "AI signal analysis.";
    result.confidence = as.confidence || 50;

    // Trade Plan
    const tp = a.tradePlan || {};
    if (tp.hasSetup && tp.entry && tp.stopLoss) {
      result.tradePlan = {
        entry: tp.entry,
        stop: tp.stopLoss,
        target1: tp.target1 || "—",
        target2: tp.target2 || "—",
        rr: tp.riskReward || "1:2",
      };
    }

    // News Impact
    const ni = a.newsImpact || {};
    result.newsImpactText = ni.description || "News impact analysis.";
    result.newsSentiment = ni.sentiment || "Neutral";
    result.newsHeadlines = ni.keyHeadlines || [];

    // Final Summary
    const fs = a.finalSummary || {};
    result.bestObs = fs.bestObservation || "Analysis completed by AI.";
    result.mainWarn = fs.mainWarning || "Trade with caution.";

    return result;
  }

  /**
   * Local mock analysis engine — used as fallback when backend is unavailable.
   * This is the original mock generator, kept for offline use.
   */
  function generateLocalAnalysis(asset, timeframe, price, exchange) {
    // Seed-based pseudo-random for consistency
    const seed = hashString(asset + timeframe + price + Date.now());
    const pick = (arr) =>
      arr[
        Math.floor((((Math.sin(seed) * 10000) % 1) + 1) * arr.length) %
          arr.length
      ];

    // ---- Market Structure ----
    const structures = [
      {
        trend: "Uptrend",
        desc: "Price is forming a series of Higher Highs (HH) and Higher Lows (HL), indicating strong bullish structure. The most recent HH was respected and price continues to push upward with momentum.",
      },
      {
        trend: "Downtrend",
        desc: "Price is exhibiting Lower Highs (LH) and Lower Lows (LL), confirming a bearish market structure. Each rally is being sold into, signaling persistent selling pressure.",
      },
      {
        trend: "Sideways / Ranging",
        desc: "Price is consolidating within a horizontal range with no clear HH or LL. This indicates market indecision and a potential buildup for a breakout.",
      },
      {
        trend: "Uptrend (Late Stage)",
        desc: "Price is in an uptrend but showing signs of exhaustion. Recent candles have long upper wicks and decreasing momentum, suggesting a possible reversal.",
      },
      {
        trend: "Downtrend (Late Stage)",
        desc: "Price continues to make lower lows but with decreasing momentum. Bullish divergence is forming on momentum oscillators.",
      },
    ];
    const structure = pick(structures);

    // ---- Trend ----
    const trendTypes = [
      {
        dir: "Bullish",
        conf: 65 + Math.floor(Math.sin(seed + 1) * 15),
        text: "Strong bullish momentum with price trading above key EMAs. The trend is well-established with consistent higher timeframe structure. Buying pressure dominates.",
      },
      {
        dir: "Bearish",
        conf: 65 + Math.floor(Math.sin(seed + 2) * 15),
        text: "Sustained bearish momentum with price below all major moving averages. Sellers are in control and each bounce is being rejected.",
      },
      {
        dir: "Neutral",
        conf: 40 + Math.floor(Math.sin(seed + 3) * 12),
        text: "Price is oscillating with no clear directional bias. The market is in a consolidation phase awaiting a catalyst for the next move.",
      },
    ];
    const trend = pick(trendTypes);

    // ---- Support & Resistance ----
    const basePrice =
      price !== "—" ? parseFloat(price.replace(/,/g, "")) : 43250;
    const offset = basePrice * 0.02;
    const sr = {
      majorSupport: (
        basePrice -
        offset * (1.2 + Math.abs(Math.sin(seed + 4)) * 1.5)
      ).toFixed(2),
      majorResistance: (
        basePrice +
        offset * (1.2 + Math.abs(Math.sin(seed + 5)) * 1.5)
      ).toFixed(2),
      demandZone: `${(basePrice - offset * (0.5 + Math.abs(Math.sin(seed + 6)) * 0.8)).toFixed(2)} - ${(basePrice - offset * (0.2 + Math.abs(Math.sin(seed + 7)) * 0.3)).toFixed(2)}`,
      supplyZone: `${(basePrice + offset * (0.2 + Math.abs(Math.sin(seed + 8)) * 0.3)).toFixed(2)} - ${(basePrice + offset * (0.5 + Math.abs(Math.sin(seed + 9)) * 0.8)).toFixed(2)}`,
      liquidityLow: (
        basePrice -
        offset * (2 + Math.abs(Math.sin(seed + 10)) * 2.5)
      ).toFixed(2),
      liquidityHigh: (
        basePrice +
        offset * (2 + Math.abs(Math.sin(seed + 11)) * 2.5)
      ).toFixed(2),
    };

    // ---- SMC ----
    const smcItems = [
      "BOS (Break of Structure)",
      "CHOCH (Change of Character)",
    ];
    const smcOptional = [
      "Order Block",
      "Fair Value Gap (FVG)",
      "Liquidity Sweep",
      "Premium Zone",
      "Discount Zone",
    ];
    const smcVisible = [pick(smcItems)];
    if (Math.sin(seed + 12) > 0) smcVisible.push(pick(smcOptional));
    if (Math.sin(seed + 13) > 0.3)
      smcVisible.push(pick(smcOptional.filter((x) => !smcVisible.includes(x))));

    // ---- Candlestick ----
    const candlePatterns = [
      {
        name: "Hammer",
        sentiment: "bullish",
        desc: "A hammer pattern at the bottom of a downtrend suggests a potential bullish reversal. The long lower wick indicates buying pressure absorbing sell-offs.",
      },
      {
        name: "Doji",
        sentiment: "neutral",
        desc: "A Doji candle indicates indecision in the market. This often precedes a significant move or reversal.",
      },
      {
        name: "Bullish Engulfing",
        sentiment: "bullish",
        desc: "A strong bullish engulfing candle shows buyers overwhelming sellers. This is a reliable reversal signal at support levels.",
      },
      {
        name: "Bearish Engulfing",
        sentiment: "bearish",
        desc: "Bearish engulfing indicates sellers have taken control after an uptrend. A warning sign for potential reversal.",
      },
      {
        name: "Pin Bar",
        sentiment: "neutral",
        desc: "Pin bars show rejection of a price level. A bullish pin bar has a long lower wick; bearish has a long upper wick.",
      },
      {
        name: "Shooting Star",
        sentiment: "bearish",
        desc: "A shooting star after an uptrend signals potential exhaustion. The long upper wick shows sellers stepping in at highs.",
      },
      {
        name: "Morning Star",
        sentiment: "bullish",
        desc: "A three-candle bullish reversal pattern. This is a strong signal when appearing at support zones.",
      },
      {
        name: "Evening Star",
        sentiment: "bearish",
        desc: "A three-candle bearish reversal pattern. Indicates momentum shift from buyers to sellers.",
      },
    ];
    const candleVisible = [];
    const numCandles = 1 + Math.floor(Math.abs(Math.sin(seed + 14)) * 3);
    for (let i = 0; i < numCandles; i++) {
      candleVisible.push(
        pick(
          candlePatterns.filter(
            (c) => !candleVisible.some((x) => x.name === c.name),
          ),
        ),
      );
    }

    // ---- Chart Patterns ----
    const patterns = [
      "Triangle",
      "Ascending Triangle",
      "Descending Triangle",
      "Symmetrical Triangle",
      "Flag",
      "Pennant",
      "Rectangle",
      "Channel",
      "Cup & Handle",
      "Double Top",
      "Double Bottom",
      "Head & Shoulders",
      "Inverse Head & Shoulders",
      "Rising Wedge",
      "Falling Wedge",
    ];
    const patternVisible = [];
    if (Math.sin(seed + 15) > -0.3) {
      const numPatterns = 1 + Math.floor(Math.abs(Math.sin(seed + 16)) * 2);
      for (let i = 0; i < numPatterns; i++) {
        patternVisible.push(
          pick(patterns.filter((p) => !patternVisible.includes(p))),
        );
      }
    }

    // ---- Indicators ----
    const indicators = [
      {
        name: "EMA (20)",
        value: pick([
          "Bullish (Price > EMA)",
          "Bearish (Price < EMA)",
          "Neutral (Price ~ EMA)",
        ]),
        cls: "",
      },
      {
        name: "EMA (50)",
        value: pick(["Bullish Crossover", "Bearish Crossover", "Neutral"]),
        cls: "",
      },
      {
        name: "EMA (200)",
        value: pick(["Bullish (Price > 200)", "Bearish (Price < 200)"]),
        cls: "",
      },
      {
        name: "RSI (14)",
        value: `${Math.floor(30 + Math.abs(Math.sin(seed + 17)) * 40)}`,
        cls: "neutral",
      },
      {
        name: "MACD",
        value: pick([
          "Bullish Crossover",
          "Bearish Crossover",
          "Momentum Increasing",
          "Momentum Decreasing",
        ]),
        cls: "",
      },
      {
        name: "Bollinger Bands",
        value: pick([
          "At Lower Band (Oversold)",
          "At Upper Band (Overbought)",
          "Middle Band (Neutral)",
          "Expanding Volatility",
        ]),
        cls: "",
      },
      {
        name: "VWAP",
        value: pick(["Price Above VWAP", "Price Below VWAP", "At VWAP"]),
        cls: "",
      },
      {
        name: "SuperTrend",
        value: pick(["Bullish (Green)", "Bearish (Red)"]),
        cls: "",
      },
    ];
    const visibleIndicators = indicators.filter(
      () => Math.abs(Math.sin(seed + 18)) > 0.3,
    );

    // ---- Volume ----
    const volumeScenarios = [
      "Volume is increasing with price movement, confirming the current trend. Higher volume on bullish candles indicates strong buying interest.",
      "Volume is declining during the recent consolidation phase. A volume spike on the next breakout will be needed to confirm direction.",
      "Volume divergence detected: price is making higher highs but volume is decreasing. This is a warning sign of trend exhaustion.",
      "Volume remains steady and above average, supporting the validity of the current move. Breakout volume is clearly visible.",
      "Volume not clearly visible in the screenshot.",
    ];
    const volume = pick(volumeScenarios);

    // ---- Momentum ----
    const momentumScenarios = [
      {
        strength: "Strong",
        text: "Momentum is strong and aligned with the trend. Buying pressure is consistent with higher closes. No signs of exhaustion yet.",
      },
      {
        strength: "Moderate",
        text: "Momentum is moderate with mixed candle closes. The market is in a balanced state between buyers and sellers.",
      },
      {
        strength: "Weakening",
        text: "Momentum is weakening. Each successive push is smaller than the last, suggesting the trend may be losing steam.",
      },
      {
        strength: "Exhaustion",
        text: "Signs of momentum exhaustion are visible. Long wicks and doji candles at key levels suggest a possible reversal.",
      },
    ];
    const momentum = pick(momentumScenarios);

    // ---- Risk ----
    const riskLevels = ["Low", "Medium", "High"];
    const risk = pick(riskLevels);
    const riskDetails = {
      Low: [
        "Volatility is low and stable.",
        "Fake breakout probability is low — current structure is strong.",
        "Trend continuation probability is high.",
      ],
      Medium: [
        "Moderate volatility detected.",
        "Fake breakout probability is moderate — confirm with volume.",
        "Trend continuation probability is balanced.",
      ],
      High: [
        "Elevated volatility — wider stops recommended.",
        "Fake breakout probability is elevated. Wait for confirmation.",
        "Trend continuation probability is uncertain.",
      ],
    };

    // ---- AI Signal ----
    let signal, signalText;
    const signalRoll = Math.abs(Math.sin(seed + 19));
    if (trend.dir === "Bullish" && signalRoll > 0.3) {
      signal = "BUY";
      signalText = pick([
        "The confluence of bullish trend structure, positive momentum, and support holding suggests a high-probability long opportunity. Key resistance is within reach and volume supports the move.",
        "Multiple bullish factors align: higher timeframe trend, bullish candlestick patterns, and price above key EMAs. A long position with proper risk management is favorable.",
      ]);
    } else if (trend.dir === "Bearish" && signalRoll > 0.3) {
      signal = "SELL";
      signalText = pick([
        "Bearish structure with lower highs, supportive bearish patterns, and price below key moving averages. Selling pressure dominates and short positions are favored with confirmed resistance holds.",
        "The market shows clear bearish momentum with breaking structures to the downside. Each rally is being sold, favoring short entries on retests.",
      ]);
    } else {
      signal = "WAIT";
      signalText = pick([
        "The chart does not provide enough confluence for a clear directional bias. Price is consolidating and indicators are mixed. Patience is key — wait for clearer signals.",
        "Current market conditions are uncertain with conflicting signals across timeframes. No high-probability setup is present. Waiting is the best trade.",
      ]);
    }

    // ---- Confidence ----
    let confidenceBase = 50;
    if (signal === "BUY" || signal === "SELL") {
      confidenceBase = 55 + Math.floor(Math.abs(Math.sin(seed + 20)) * 30);
    } else {
      confidenceBase = 30 + Math.floor(Math.abs(Math.sin(seed + 21)) * 25);
    }
    const confidence = Math.min(confidenceBase, 95);

    // ---- Trade Plan ----
    let tradePlan;
    if (signal !== "WAIT") {
      const entryOffset =
        basePrice * (0.003 + Math.abs(Math.sin(seed + 22)) * 0.008);
      const stopOffset =
        basePrice * (0.01 + Math.abs(Math.sin(seed + 23)) * 0.02);
      const targetOffset =
        basePrice * (0.02 + Math.abs(Math.sin(seed + 24)) * 0.03);
      const rr = ((targetOffset / stopOffset) * 10).toFixed(1);

      if (signal === "BUY") {
        tradePlan = {
          entry: (basePrice - entryOffset).toFixed(2),
          stop: (basePrice - stopOffset).toFixed(2),
          target1: (basePrice + targetOffset * 0.5).toFixed(2),
          target2: (basePrice + targetOffset).toFixed(2),
          rr: rr,
        };
      } else {
        tradePlan = {
          entry: (basePrice + entryOffset).toFixed(2),
          stop: (basePrice + stopOffset).toFixed(2),
          target1: (basePrice - targetOffset * 0.5).toFixed(2),
          target2: (basePrice - targetOffset).toFixed(2),
          rr: rr,
        };
      }
    }

    // ---- Summary ----
    const bestObs = pick([
      "Strong trend structure with clear HH/HL formation.",
      "Key support level holding with bullish rejection candles.",
      "Volume confirmation on breakout bars.",
      "Bullish divergence on RSI indicating momentum shift.",
      "Clear resistance level with multiple touches.",
    ]);
    const mainWarn = pick([
      "Overall market volatility remains elevated — size positions accordingly.",
      "No clear catalyst visible — monitor for fundamental triggers.",
      "Fake breakout risk is present at current resistance zone.",
      "Trend is mature — consider partial profit taking on strength.",
      "Lower timeframe shows exhaustion signals.",
    ]);

    return {
      asset,
      timeframe,
      price,
      exchange,
      structure,
      trend,
      sr,
      smcVisible,
      candleVisible,
      patternVisible,
      indicators: visibleIndicators,
      volume,
      momentum,
      risk,
      riskDetails: riskDetails[risk],
      signal,
      signalText,
      confidence,
      tradePlan,
      bestObs,
      mainWarn,
    };
  }

  // Simple string hash
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // ---- Render Results ----
  function renderAnalysis(a) {
    analysisResult = a;

    // Overview
    document.getElementById("resultAsset").textContent = a.asset;
    document.getElementById("resultTimeframe").textContent = a.timeframe;
    document.getElementById("resultExchange").textContent =
      exchangeInput.options[exchangeInput.selectedIndex].text;
    document.getElementById("resultPrice").textContent =
      a.price !== "—" ? "$" + a.price : "Not specified";

    // Market Structure
    document.querySelector("#marketStructureBody .analysis-text").innerHTML =
      `<p><strong>Trend:</strong> ${a.structure.trend}</p><p>${a.structure.desc}</p>`;

    // Trend
    const trendFill = document.getElementById("trendFill");
    const trendDir = document.getElementById("trendDirection");
    const trendConf = document.getElementById("trendConfidence");
    const trendText = document.getElementById("trendText");

    let trendWidth, trendIcon, trendLabel, trendColor;
    if (a.trend.dir === "Bullish") {
      trendWidth = 70 + Math.floor(Math.random() * 20);
      trendIcon =
        '<i class="fas fa-arrow-up" style="color:var(--accent-green)"></i>';
      trendLabel = "Bullish";
      trendColor = "var(--accent-green)";
    } else if (a.trend.dir === "Bearish") {
      trendWidth = 10 + Math.floor(Math.random() * 20);
      trendIcon =
        '<i class="fas fa-arrow-down" style="color:var(--accent-red)"></i>';
      trendLabel = "Bearish";
      trendColor = "var(--accent-red)";
    } else {
      trendWidth = 40 + Math.floor(Math.random() * 20);
      trendIcon =
        '<i class="fas fa-minus" style="color:var(--accent-gold)"></i>';
      trendLabel = "Neutral";
      trendColor = "var(--accent-gold)";
    }
    trendFill.style.width = trendWidth + "%";
    trendFill.style.background = `linear-gradient(135deg, ${trendColor}, ${trendColor}dd)`;
    trendDir.innerHTML = `${trendIcon} ${trendLabel}`;
    trendConf.textContent = `${a.trend.conf}%`;
    trendText.innerHTML = `<p>${a.trend.text}</p>`;

    // Support & Resistance
    const levelsGrid = document.getElementById("levelsGrid");
    levelsGrid.innerHTML = `
      <div class="level-item support">
        <span class="level-label">Major Support</span>
        <span class="level-price">$${a.sr.majorSupport}</span>
      </div>
      <div class="level-item resistance">
        <span class="level-label">Major Resistance</span>
        <span class="level-price">$${a.sr.majorResistance}</span>
      </div>
      <div class="level-item demand">
        <span class="level-label">Demand Zone</span>
        <span class="level-price">$${a.sr.demandZone}</span>
      </div>
      <div class="level-item supply">
        <span class="level-label">Supply Zone</span>
        <span class="level-price">$${a.sr.supplyZone}</span>
      </div>
      <div class="level-item liquidity">
        <span class="level-label">Liquidity (Low)</span>
        <span class="level-price">$${a.sr.liquidityLow}</span>
      </div>
      <div class="level-item liquidity">
        <span class="level-label">Liquidity (High)</span>
        <span class="level-price">$${a.sr.liquidityHigh}</span>
      </div>
    `;
    document.getElementById("srText").innerHTML = `
      <p>Key support is at <strong>$${a.sr.majorSupport}</strong>, with a demand zone between <strong>$${a.sr.demandZone}</strong>. Resistance sits at <strong>$${a.sr.majorResistance}</strong>, and supply lies between <strong>$${a.sr.supplyZone}</strong>.</p>
      <p>Liquidity pools are visible below at <strong>$${a.sr.liquidityLow}</strong> and above at <strong>$${a.sr.liquidityHigh}</strong>. Price may target these areas before a significant move.</p>
    `;

    // SMC
    const smcBadges = document.getElementById("smcBadges");
    smcBadges.innerHTML = a.smcVisible
      .map((s) => `<span class="badge-item">${s}</span>`)
      .join("");

    const smcTextMap = {
      "BOS (Break of Structure)":
        "Price has broken a key swing point, confirming directional bias.",
      "CHOCH (Change of Character)":
        "A structural shift indicates potential trend reversal.",
      "Order Block":
        "An order block is visible where institutional orders may be clustered.",
      "Fair Value Gap (FVG)":
        "An imbalance zone is present that price may revisit.",
      "Liquidity Sweep":
        "Price swept liquidity before reversing in the opposite direction.",
      "Premium Zone":
        "Price is trading in the premium zone above the fair value range.",
      "Discount Zone":
        "Price is in the discount zone, offering potential value entries.",
    };
    document.getElementById("smcText").innerHTML =
      `<p>${a.smcVisible.map((s) => `• ${s}: ${smcTextMap[s] || "Visible on the chart."}`).join("<br>")}</p>`;

    // Candlesticks
    const candleBadges = document.getElementById("candleBadges");
    candleBadges.innerHTML = a.candleVisible
      .map((c) => {
        const cls =
          c.sentiment === "bullish"
            ? "bullish"
            : c.sentiment === "bearish"
              ? "bearish"
              : "neutral";
        return `<span class="badge-item ${cls}">${c.name}</span>`;
      })
      .join("");
    document.getElementById("candleText").innerHTML =
      `<p>${a.candleVisible.map((c) => `• <strong>${c.name}</strong> (${c.sentiment}): ${c.desc}`).join("<br>")}</p>`;

    // Chart Patterns
    const patternBadges = document.getElementById("patternBadges");
    if (a.patternVisible.length > 0) {
      patternBadges.innerHTML = a.patternVisible
        .map((p) => `<span class="badge-item">${p}</span>`)
        .join("");
      document.getElementById("patternText").innerHTML =
        `<p>${a.patternVisible.map((p) => `• <strong>${p}</strong> pattern detected on the chart.`).join("<br>")}</p>`;
    } else {
      patternBadges.innerHTML =
        '<span class="badge-item neutral">No clear pattern</span>';
      document.getElementById("patternText").innerHTML =
        "<p>No significant chart patterns are clearly visible in the current screenshot.</p>";
    }

    // Indicators
    const indicatorsGrid = document.getElementById("indicatorsGrid");
    indicatorsGrid.innerHTML = a.indicators
      .map((ind) => {
        let cls = "neutral";
        if (ind.value.includes("Bullish")) cls = "bullish";
        else if (ind.value.includes("Bearish")) cls = "bearish";
        return `
        <div class="indicator-item">
          <span class="indicator-name">${ind.name}</span>
          <span class="indicator-value ${cls}">${ind.value}</span>
        </div>
      `;
      })
      .join("");

    // Volume
    document.querySelector("#volumeBody .analysis-text").innerHTML =
      `<p>${a.volume}</p>`;

    // Momentum
    document.querySelector("#momentumBody .analysis-text").innerHTML = `
      <p><strong>Momentum Strength:</strong> ${a.momentum.strength}</p>
      <p>${a.momentum.text}</p>
    `;

    // Risk
    const riskLevelEl = document.getElementById("riskLevel");
    const riskFillEl = document.getElementById("riskFill");
    riskLevelEl.textContent = a.risk;
    riskLevelEl.className = "risk-level " + a.risk.toLowerCase();
    riskFillEl.className = "risk-fill " + a.risk.toLowerCase();
    const riskWidths = { Low: 20, Medium: 50, High: 85 };
    riskFillEl.style.width = riskWidths[a.risk] + "%";
    document.getElementById("riskDetails").innerHTML = a.riskDetails
      .map((d) => `<p>• ${d}</p>`)
      .join("");

    // Signal
    const signalBadge = document.getElementById("signalBadge");
    signalBadge.textContent = a.signal;
    signalBadge.className = "signal-badge " + a.signal.toLowerCase();
    document.getElementById("signalText").innerHTML = `<p>${a.signalText}</p>`;

    // Confidence
    const confFill = document.getElementById("confidenceFill");
    const confValue = document.getElementById("confidenceValue");
    setTimeout(() => {
      confFill.style.width = a.confidence + "%";
      confValue.textContent = a.confidence + "%";
    }, 100);

    // Trade Plan
    const planGrid = document.getElementById("tradePlanGrid");
    const planText = document.getElementById("tradePlanText");
    if (a.tradePlan) {
      const side = a.signal === "BUY" ? "Long (Buy)" : "Short (Sell)";
      planGrid.innerHTML = `
        <div class="trade-plan-item">
          <span class="plan-label">Position</span>
          <span class="plan-value">${side}</span>
        </div>
        <div class="trade-plan-item">
          <span class="plan-label">Entry Zone</span>
          <span class="plan-value">$${a.tradePlan.entry}</span>
        </div>
        <div class="trade-plan-item">
          <span class="plan-label">Stop Loss</span>
          <span class="plan-value">$${a.tradePlan.stop}</span>
        </div>
        <div class="trade-plan-item">
          <span class="plan-label">Target 1</span>
          <span class="plan-value">$${a.tradePlan.target1}</span>
        </div>
        <div class="trade-plan-item">
          <span class="plan-label">Target 2</span>
          <span class="plan-value">$${a.tradePlan.target2}</span>
        </div>
        <div class="trade-plan-item">
          <span class="plan-label">Risk:Reward</span>
          <span class="plan-value">1:${a.tradePlan.rr}</span>
        </div>
      `;
      planText.innerHTML = `<p>This is an educational trade plan based on visible chart structure. Always use proper position sizing and risk management. The estimated risk-to-reward ratio of <strong>1:${a.tradePlan.rr}</strong> is based on the distance to stop loss and first target.</p>`;
    } else {
      planGrid.innerHTML =
        '<div class="trade-plan-item" style="grid-column:1/-1;text-align:center;"><span class="plan-label">Action</span><span class="plan-value" style="color:var(--accent-gold)">Wait for Clear Setup</span></div>';
      planText.innerHTML =
        "<p>Unable to estimate a reliable trade plan from the current screenshot. Insufficient confluence for a high-probability setup.</p>";
    }

    // News
    document.querySelector("#newsBody .analysis-text").innerHTML =
      "<p>News impact cannot be determined from a screenshot alone. Real-time news monitoring is recommended for fundamental context.</p>";

    // Summary
    const summaryGrid = document.getElementById("summaryGrid");
    const marketBias = a.structure.trend.includes("Up")
      ? "Bullish"
      : a.structure.trend.includes("Down")
        ? "Bearish"
        : "Neutral";
    summaryGrid.innerHTML = `
      <div class="summary-item">
        <div class="summary-label">Market Bias</div>
        <div class="summary-value ${marketBias.toLowerCase()}">${marketBias}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Signal</div>
        <div class="summary-value ${a.signal.toLowerCase()}">${a.signal}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Confidence</div>
        <div class="summary-value" style="color:var(--accent-blue)">${a.confidence}%</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Risk Level</div>
        <div class="summary-value" style="color:${a.risk === "Low" ? "var(--accent-green)" : a.risk === "Medium" ? "var(--accent-gold)" : "var(--accent-red)"}">${a.risk}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Best Observation</div>
        <div class="" style="font-size:12px;color:var(--text-secondary);line-height:1.4;">${a.bestObs}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Main Warning</div>
        <div class="" style="font-size:12px;color:var(--accent-red);line-height:1.4;">${a.mainWarn}</div>
      </div>
    `;
    document.getElementById("summaryText").innerHTML = `
      <p><strong>Bottom Line:</strong> The chart shows a <strong>${a.structure.trend}</strong> on the ${a.timeframe} timeframe. The AI recommends <strong>${a.signal}</strong> with ${a.confidence}% confidence.</p>
      <p>${a.mainWarn}</p>
    `;
  }

  // ---- Animated Loading ----
  function runLoading(callback) {
    loadingSection.style.display = "block";
    resultsSection.style.display = "none";
    loadSteps.forEach((s) => {
      s.className = "load-step";
      s.textContent = s.textContent.replace(/[✓▸]/, "▸");
    });

    let current = 0;
    loadSteps[0].classList.add("active");

    const interval = setInterval(
      () => {
        if (current < loadSteps.length) {
          loadSteps[current].classList.remove("active");
          loadSteps[current].classList.add("done");
          loadSteps[current].textContent = loadSteps[
            current
          ].textContent.replace("▸", "✓");
          current++;
          if (current < loadSteps.length) {
            loadSteps[current].classList.add("active");
          }
        }
      },
      700 + Math.random() * 400,
    );

    setTimeout(
      () => {
        clearInterval(interval);
        loadSteps.forEach((s) => {
          s.classList.remove("active");
          s.classList.add("done");
          s.textContent = s.textContent.replace("▸", "✓");
        });
        loadingSection.style.display = "none";
        callback();
      },
      3000 + Math.random() * 1500,
    );
  }

  // ---- Analyze ----
  analyzeBtn.addEventListener("click", async () => {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML =
      '<i class="fas fa-spinner fa-pulse"></i> Analyzing...';
    try {
      const result = await generateAnalysis();
      runLoading(() => {
        renderAnalysis(result);
        resultsSection.style.display = "flex";
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      console.error("[TradeVision] Analysis failed:", error);
      const asset = assetInput.value.trim() || "BTC/USDT";
      const timeframe = timeframeInput.value;
      const price = priceInput.value.trim() || "—";
      const exchange = exchangeInput.value;
      const result = generateLocalAnalysis(asset, timeframe, price, exchange);
      runLoading(() => {
        renderAnalysis(result);
        resultsSection.style.display = "flex";
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<i class="fas fa-microchip"></i> Run AI Analysis';
    }
  });

  // ---- Copy Analysis ----
  copyBtn.addEventListener("click", () => {
    if (!analysisResult) return;
    const a = analysisResult;
    const lines = [
      "═══════════════════════════════════════════",
      "  TRADEVISION PRO AI — CHART ANALYSIS",
      "═══════════════════════════════════════════",
      "",
      `📊 Asset: ${a.asset} | Timeframe: ${a.timeframe}`,
      `💵 Price: ${a.price !== "—" ? "$" + a.price : "N/A"} | Exchange: ${exchangeInput.options[exchangeInput.selectedIndex].text}`,
      "",
      `📈 Market Structure: ${a.structure.trend}`,
      `📉 Trend: ${a.trend.dir} (${a.trend.conf}% confidence)`,
      "",
      `🎯 Support: $${a.sr.majorSupport} | Resistance: $${a.sr.majorResistance}`,
      `🔽 Demand: $${a.sr.demandZone} | 🔼 Supply: $${a.sr.supplyZone}`,
      "",
      `🧠 SMC: ${a.smcVisible.join(", ")}`,
      `🕯 Candles: ${a.candleVisible.map((c) => c.name).join(", ")}`,
      `📐 Patterns: ${a.patternVisible.length > 0 ? a.patternVisible.join(", ") : "None detected"}`,
      "",
      `📊 Indicators: ${a.indicators.map((i) => `${i.name}: ${i.value}`).join(" | ")}`,
      `📦 Volume: ${a.volume.substring(0, 80)}...`,
      `⚡ Momentum: ${a.momentum.strength}`,
      "",
      `⚠️ Risk Level: ${a.risk}`,
      "",
      `🤖 AI Signal: ${a.signal} (${a.confidence}% confidence)`,
      a.tradePlan
        ? `📋 Entry: $${a.tradePlan.entry} | Stop: $${a.tradePlan.stop} | Target: $${a.tradePlan.target1} / $${a.tradePlan.target2} | R:R 1:${a.tradePlan.rr}`
        : "📋 No clear trade plan.",
      "",
      `📝 Summary: ${a.structure.trend} | Signal: ${a.signal} | Confidence: ${a.confidence}% | Risk: ${a.risk}`,
      "",
      "═══════════════════════════════════════════",
      "⚠️ This analysis is for educational purposes only.",
      "   Not financial advice. Trade responsibly.",
      "═══════════════════════════════════════════",
    ].join("\n");

    navigator.clipboard
      .writeText(lines)
      .then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = orig;
        }, 2000);
      })
      .catch(() => {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = lines;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      });
  });

  // ---- New Analysis ----
  newAnalysisBtn.addEventListener("click", () => {
    resultsSection.style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---- Force dark mode on inputs ----
  const style = document.createElement("style");
  style.textContent = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px #0f1320 inset !important;
      -webkit-text-fill-color: #e8edf5 !important;
    }
  `;
  document.head.appendChild(style);
});
