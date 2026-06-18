import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';

const app = express();
app.use(cors());

// Instantiate Yahoo Finance v3
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// ==========================================
// CENT OPTION RADAR — LIVE YAHOO FINANCE ENGINE
// ==========================================

// Large-cap US equities universe (>$10B market cap)
const UNIVERSE = [
  'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK-B',
  'JPM', 'V', 'UNH', 'XOM', 'JNJ', 'MA', 'PG', 'AVGO', 'HD', 'MRK',
  'COST', 'ABBV', 'CRM', 'PEP', 'KO', 'AMD', 'NFLX', 'TMO', 'LIN',
  'ADBE', 'WMT', 'CSCO', 'ACN', 'MCD', 'ABT', 'DHR', 'TXN', 'QCOM',
  'INTC', 'INTU', 'CMCSA', 'VZ', 'NEE', 'PM', 'HON', 'UNP', 'UPS',
  'BA', 'AMGN', 'RTX', 'LOW', 'SPGI', 'GS', 'BLK', 'CAT', 'DE',
  'ISRG', 'MDLZ', 'GILD', 'ADP', 'SYK', 'REGN', 'BKNG', 'CB',
  'PLTR', 'COIN', 'MSTR', 'SMCI', 'ARM', 'PANW', 'SNOW', 'CRWD',
  'UBER', 'ABNB', 'SQ', 'SHOP', 'MELI', 'SE', 'RIVN', 'LCID',
  'SOFI', 'AFRM', 'RBLX', 'DKNG', 'HOOD', 'MARA', 'RIOT',
  // Major ETFs
  'SPY', 'QQQ', 'IWM', 'DIA', 'XLF', 'XLE', 'XLK', 'ARKK', 'GLD', 'SLV',
  'TLT', 'HYG', 'EEM', 'FXI', 'KWEB', 'SOXL', 'TQQQ'
];

// Tickers to exclude from results — add any ticker here to filter it out
const EXCLUDED_TICKERS = new Set(['SPY']);

// Sector mapping for display
const SECTOR_MAP = {
  'NVDA': 'Semiconductors', 'AAPL': 'Consumer Electronics', 'MSFT': 'Software',
  'GOOGL': 'Internet', 'AMZN': 'E-Commerce', 'META': 'Social Media',
  'TSLA': 'Auto Manufacturers', 'BRK-B': 'Conglomerate', 'JPM': 'Banking',
  'V': 'Payments', 'UNH': 'Healthcare', 'XOM': 'Oil & Gas',
  'JNJ': 'Pharmaceuticals', 'MA': 'Payments', 'PG': 'Consumer Staples',
  'AVGO': 'Semiconductors', 'HD': 'Retail', 'MRK': 'Pharmaceuticals',
  'COST': 'Retail', 'ABBV': 'Pharmaceuticals', 'CRM': 'Software',
  'PEP': 'Consumer Staples', 'KO': 'Consumer Staples', 'AMD': 'Semiconductors',
  'NFLX': 'Entertainment', 'TMO': 'Life Sciences', 'LIN': 'Chemicals',
  'ADBE': 'Software', 'WMT': 'Retail', 'CSCO': 'Networking',
  'ACN': 'IT Consulting', 'MCD': 'Restaurants', 'ABT': 'Medical Devices',
  'DHR': 'Life Sciences', 'TXN': 'Semiconductors', 'QCOM': 'Semiconductors',
  'INTC': 'Semiconductors', 'INTU': 'Software', 'CMCSA': 'Telecom',
  'VZ': 'Telecom', 'NEE': 'Utilities', 'PM': 'Tobacco',
  'HON': 'Industrials', 'UNP': 'Railroads', 'UPS': 'Logistics',
  'BA': 'Aerospace', 'AMGN': 'Biotech', 'RTX': 'Defense',
  'LOW': 'Retail', 'SPGI': 'Financial Data', 'GS': 'Banking',
  'BLK': 'Asset Management', 'CAT': 'Heavy Equipment', 'DE': 'Agriculture',
  'ISRG': 'Medical Devices', 'MDLZ': 'Consumer Staples', 'GILD': 'Biotech',
  'ADP': 'HR Services', 'SYK': 'Medical Devices', 'REGN': 'Biotech',
  'BKNG': 'Travel', 'CB': 'Insurance', 'PLTR': 'Software',
  'COIN': 'Crypto Exchange', 'MSTR': 'Software/Bitcoin', 'SMCI': 'Computer Hardware',
  'ARM': 'Semiconductors', 'PANW': 'Cybersecurity', 'SNOW': 'Cloud Data',
  'CRWD': 'Cybersecurity', 'UBER': 'Ride-Sharing', 'ABNB': 'Travel',
  'SQ': 'Fintech', 'SHOP': 'E-Commerce', 'MELI': 'E-Commerce',
  'SE': 'Internet', 'RIVN': 'EV Manufacturer', 'LCID': 'EV Manufacturer',
  'SOFI': 'Fintech', 'AFRM': 'Fintech', 'RBLX': 'Gaming',
  'DKNG': 'Sports Betting', 'HOOD': 'Fintech', 'MARA': 'Bitcoin Mining',
  'RIOT': 'Bitcoin Mining',
  'SPY': 'ETF - S&P 500', 'QQQ': 'ETF - Nasdaq 100', 'IWM': 'ETF - Small Cap',
  'DIA': 'ETF - Dow 30', 'XLF': 'ETF - Financials', 'XLE': 'ETF - Energy',
  'XLK': 'ETF - Technology', 'ARKK': 'ETF - Innovation', 'GLD': 'ETF - Gold',
  'SLV': 'ETF - Silver', 'TLT': 'ETF - Bonds', 'HYG': 'ETF - High Yield',
  'EEM': 'ETF - Emerging Mkts', 'FXI': 'ETF - China', 'KWEB': 'ETF - China Internet',
  'SOXL': 'ETF - Semis 3x', 'TQQQ': 'ETF - Nasdaq 3x'
};

// ==========================================
// HORIZON CONFIGURATIONS
// ==========================================
// Each horizon defines its own expiration window, price range, strike range, and target label
const HORIZONS = {
  short: {
    label: 'Short-Term (3-5 Days)',
    minDays: 0,
    maxDays: 10,
    maxExpirations: 2,        // fetch up to 2 nearest expirations
    priceMin: 0.01,
    priceMax: 0.05,
    strikeRange: 0.10,        // ±10% of stock price
    minVolume: 0,
    minOI: 50,
    targetMultiplier: 100,    // target = price * 100x
    targetLabel: '3-5D'
  },
  medium: {
    label: 'Medium-Term (2-4 Weeks)',
    minDays: 14,
    maxDays: 35,
    maxExpirations: 3,        // fetch up to 3 expirations in the window
    priceMin: 0.01,
    priceMax: 0.20,
    strikeRange: 0.15,        // ±15% of stock price
    minVolume: 0,
    minOI: 20,
    targetMultiplier: 50,
    targetLabel: '2-4W'
  },
  long: {
    label: 'Long-Term (Macro / LEAPs)',
    minDays: 60,
    maxDays: 365,
    maxExpirations: 2,        // fetch up to 2 expirations in the window
    priceMin: 0.01,
    priceMax: 0.50,
    strikeRange: 0.20,        // ±20% of stock price
    minVolume: 0,
    minOI: 10,
    targetMultiplier: 20,
    targetLabel: '60-365D'
  }
};

function formatMarketCap(num) {
  if (!num) return 'N/A';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
  return `$${num}`;
}

// Score a penny option candidate for asymmetric potential
function scoreCandidate(option) {
  let score = 0;
  const vol = option.volume || 0;
  const oi = option.openInterest || 0;
  const iv = option.impliedVolatility || 0;

  // Volume anomaly scoring (higher volume relative to OI = unusual activity)
  const volOiRatio = oi > 0 ? vol / oi : 0;
  if (volOiRatio > 5) score += 30;
  else if (volOiRatio > 2) score += 20;
  else if (volOiRatio > 1) score += 10;

  // Raw volume scoring
  if (vol > 5000) score += 30;
  else if (vol > 1000) score += 25;
  else if (vol > 500) score += 15;
  else if (vol > 100) score += 10;
  else if (vol > 0) score += 5;

  // Open Interest scoring (higher = more liquid)
  if (oi > 10000) score += 20;
  else if (oi > 5000) score += 15;
  else if (oi > 1000) score += 10;
  else if (oi > 500) score += 5;

  // IV scoring — higher IV = bigger potential moves
  if (iv > 2.0) score += 25;
  else if (iv > 1.5) score += 20;
  else if (iv > 1.0) score += 15;
  else if (iv > 0.5) score += 10;

  // Penalize zero-volume contracts heavily
  if (vol === 0) score -= 30;

  return score;
}

function generateCatalyst(ticker, type, option, quote, horizonConfig) {
  const stockPrice = quote?.regularMarketPrice || 0;
  const strike = option.strike;
  const iv = ((option.impliedVolatility || 0) * 100).toFixed(0);
  const vol = option.volume || 0;
  const oi = option.openInterest || 0;
  const volOiRatio = oi > 0 ? (vol / oi).toFixed(1) : 'N/A';

  if (type === 'call') {
    const pctOTM = stockPrice > 0 ? (((strike - stockPrice) / stockPrice) * 100).toFixed(1) : 'N/A';
    return `Strike is ${pctOTM}% OTM from current $${stockPrice.toFixed(2)}. ` +
      `Vol/OI ratio of ${volOiRatio}x with ${iv}% IV suggests unusual call activity — ` +
      `a catalyst-driven move could push this contract into profit within the ${horizonConfig.targetLabel} window.`;
  } else {
    const pctOTM = stockPrice > 0 ? (((stockPrice - strike) / stockPrice) * 100).toFixed(1) : 'N/A';
    return `Strike is ${pctOTM}% OTM below current $${stockPrice.toFixed(2)}. ` +
      `Vol/OI ratio of ${volOiRatio}x with ${iv}% IV indicates aggressive put accumulation — ` +
      `a sharp downside move could deliver outsized returns within the ${horizonConfig.targetLabel} window.`;
  }
}

// ==========================================
// PER-HORIZON CACHES
// ==========================================
const cache = {};     // { short: { result, time }, medium: {...}, long: {...} }
const CACHE_DURATION_MS = 120000; // 2 minute cache

// ==========================================
// UNIFIED SCAN ENDPOINT
// ==========================================
// Usage: GET /api/scan?horizon=short|medium|long
app.get('/api/scan', async (req, res) => {
  const horizon = req.query.horizon || 'short';
  const config = HORIZONS[horizon];
  if (!config) {
    return res.status(400).json({ error: `Invalid horizon: ${horizon}. Use short, medium, or long.` });
  }

  // Return cached results if fresh enough
  const now = Date.now();
  if (cache[horizon] && (now - cache[horizon].time) < CACHE_DURATION_MS) {
    console.log(`[CACHE HIT] ${horizon} — returning cached results from ${Math.round((now - cache[horizon].time) / 1000)}s ago`);
    return res.json(cache[horizon].result);
  }

  console.log(`\n[${new Date().toISOString()}] SCAN STARTED — Horizon: ${config.label} — ${UNIVERSE.length} tickers`);
  const allCandidates = [];
  let tickersScanned = 0;
  let tickersWithOptions = 0;
  const errors = [];

  for (const ticker of UNIVERSE) {
    tickersScanned++;

    // Skip excluded tickers
    if (EXCLUDED_TICKERS.has(ticker)) {
      continue;
    }

    try {
      // Fetch quote data for market cap and current price
      const quote = await yahooFinance.quote(ticker);
      const marketCap = quote?.marketCap || 0;
      const stockPrice = quote?.regularMarketPrice || 0;

      // Skip if under $10B market cap (except ETFs which may not have marketCap)
      const isETF = SECTOR_MAP[ticker]?.startsWith('ETF');
      if (!isETF && marketCap < 10e9) {
        continue;
      }

      // Fetch options chain (default = nearest expiration)
      const optionsResult = await yahooFinance.options(ticker);
      if (!optionsResult || !optionsResult.options || optionsResult.options.length === 0) {
        continue;
      }

      const allExpirations = optionsResult.expirationDates || [];

      // Filter expirations based on horizon config
      const nowDate = new Date();
      const minDate = new Date(nowDate);
      minDate.setDate(minDate.getDate() + config.minDays);
      const maxDate = new Date(nowDate);
      maxDate.setDate(maxDate.getDate() + config.maxDays);

      const horizonExps = allExpirations.filter(d => {
        const exp = new Date(d);
        return exp >= minDate && exp <= maxDate;
      });

      // Take up to maxExpirations
      const expsToScan = horizonExps.slice(0, config.maxExpirations);

      // For short-term: fallback to nearest future expiration if none in window
      if (expsToScan.length === 0 && horizon === 'short' && allExpirations.length > 0) {
        const futureExps = allExpirations.filter(d => new Date(d) > nowDate);
        if (futureExps.length > 0) expsToScan.push(futureExps[0]);
      }

      if (expsToScan.length === 0) continue;

      // Strike price boundaries based on horizon
      const strikeLow = stockPrice * (1 - config.strikeRange);
      const strikeHigh = stockPrice * (1 + config.strikeRange);

      for (const expDate of expsToScan) {
        let chainData;
        try {
          chainData = await yahooFinance.options(ticker, { date: expDate });
        } catch {
          continue;
        }

        if (!chainData?.options?.[0]) continue;
        const chain = chainData.options[0];
        tickersWithOptions++;

        const processContracts = (contracts, type) => {
          if (!contracts) return;
          for (const opt of contracts) {
            const price = opt.lastPrice ?? opt.ask ?? 999;
            // Filter by price range, strike range, and minimum activity
            if (
              price >= config.priceMin &&
              price <= config.priceMax &&
              opt.strike >= strikeLow &&
              opt.strike <= strikeHigh &&
              ((opt.volume || 0) > config.minVolume || (opt.openInterest || 0) > config.minOI)
            ) {
              const targetVal = Math.max(1.0, price * config.targetMultiplier);
              allCandidates.push({
                ticker,
                company: quote?.shortName || quote?.longName || ticker,
                sector: SECTOR_MAP[ticker] || 'Unknown',
                marketCap: formatMarketCap(marketCap),
                type,
                strike: `$${opt.strike.toFixed(2)}`,
                strikeRaw: opt.strike,
                expiration: new Date(expDate).toISOString().split('T')[0],
                currentPrice: `$${price.toFixed(2)}`,
                currentPriceRaw: price,
                targetPrice: `$${targetVal.toFixed(2)}`,
                iv: `${((opt.impliedVolatility || 0) * 100).toFixed(0)}%`,
                ivRaw: opt.impliedVolatility || 0,
                volume: opt.volume || 0,
                openInterest: opt.openInterest || 0,
                volumeSpike: opt.openInterest > 0
                  ? `${(((opt.volume || 0) / opt.openInterest) * 100).toFixed(0)}%`
                  : 'N/A',
                oiChange: `${opt.openInterest || 0}`,
                bid: opt.bid || 0,
                ask: opt.ask || 0,
                stockPrice: stockPrice,
                score: scoreCandidate(opt),
                catalyst: generateCatalyst(ticker, type, opt, quote, config),
                horizonLabel: config.targetLabel
              });
            }
          }
        };

        processContracts(chain.calls, 'call');
        processContracts(chain.puts, 'put');
      }

      // Rate limiting — Yahoo Finance is sensitive
      await new Promise(r => setTimeout(r, 250));
      if (tickersScanned % 10 === 0) {
        console.log(`  [${horizon.toUpperCase()}] ${tickersScanned}/${UNIVERSE.length} scanned, ${allCandidates.length} contracts found`);
      }

    } catch (err) {
      errors.push({ ticker, error: err.message });
    }
  }

  // Split into calls and puts, sort each by score, take top 10 of each
  const allCalls = allCandidates.filter(c => c.type === 'call');
  const allPuts = allCandidates.filter(c => c.type === 'put');
  allCalls.sort((a, b) => b.score - a.score);
  allPuts.sort((a, b) => b.score - a.score);
  const top10Calls = allCalls.slice(0, 10).map((c, i) => ({ ...c, id: i + 1 }));
  const top10Puts = allPuts.slice(0, 10).map((c, i) => ({ ...c, id: i + 1 }));

  console.log(`\n[${new Date().toISOString()}] ${horizon.toUpperCase()} SCAN COMPLETE`);
  console.log(`  Tickers scanned: ${tickersScanned}`);
  console.log(`  Tickers w/ options: ${tickersWithOptions}`);
  console.log(`  Total contracts: ${allCandidates.length} (${allCalls.length} calls, ${allPuts.length} puts)`);
  console.log(`  Errors: ${errors.length}`);

  const result = {
    horizon,
    horizonLabel: config.label,
    scanTime: new Date().toISOString(),
    tickersScanned,
    totalCandidates: allCandidates.length,
    totalCalls: allCalls.length,
    totalPuts: allPuts.length,
    errorDetails: errors.slice(0, 5),
    errors: errors.length,
    topCalls: top10Calls,
    topPuts: top10Puts
  };

  // Cache results
  cache[horizon] = { result, time: Date.now() };

  res.json(result);
});

// Lightweight status/health endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    universe: UNIVERSE.length,
    horizons: Object.keys(HORIZONS),
    serverTime: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`  CENT OPTION RADAR — BACKEND LIVE`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Universe: ${UNIVERSE.length} tickers`);
  console.log(`  Horizons: short, medium, long`);
  console.log(`  Endpoint: http://localhost:${PORT}/api/scan?horizon=short`);
  console.log(`=========================================\n`);
});
