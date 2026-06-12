import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, Zap, ArrowRight, Clock, Target, RefreshCw, AlertTriangle, Loader2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import './index.css';

// Reusable card component for a single option recommendation
function OptionCard({ rec }) {
  return (
    <div className={`card glass-panel ${rec.type}`}>
      <div className="card-header">
        <div className="ticker-info">
          <div className="ticker-rank">#{rec.id}</div>
          <span className="ticker-symbol">{rec.ticker}</span>
          <div>
            <div className="company-name">{rec.company}</div>
            <span className="sector-tag">{rec.sector} | {rec.marketCap}</span>
          </div>
        </div>
        <div className="contract-type">
          <span className={`type-badge ${rec.type}`}>
            {rec.type === 'call' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {rec.type}
          </span>
          <span className="naked-flag">⚠ Naked Strategy</span>
        </div>
      </div>

      <div className="contract-details">
        <div className="detail-item">
          <span className="detail-label">Strike</span>
          <span className="detail-value">{rec.strike}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Exp</span>
          <span className="detail-value">{rec.expiration}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Stock Price</span>
          <span className="detail-value">${rec.stockPrice?.toFixed(2)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Bid/Ask</span>
          <span className="detail-value">${rec.bid?.toFixed(2)} / ${rec.ask?.toFixed(2)}</span>
        </div>
      </div>

      <div className="pricing">
        <div className="price-item">
          <div className="label">Current Prem.</div>
          <div className="value current-price">{rec.currentPrice}</div>
        </div>
        <ArrowRight className="price-arrow" size={20} />
        <div className="price-item" style={{ textAlign: 'right' }}>
          <div className="label">Target ({rec.horizonLabel || '3-5D'})</div>
          <div className="value target-price">{rec.targetPrice}</div>
        </div>
      </div>

      <div className="metrics-panel">
        <div className="metric">
          <div className="metric-label">IV</div>
          <div className={`metric-value ${rec.ivRaw > 1 ? 'positive' : 'neutral'}`}>{rec.iv}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Volume</div>
          <div className="metric-value positive">{rec.volume?.toLocaleString()}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Open Interest</div>
          <div className="metric-value neutral">{rec.openInterest?.toLocaleString()}</div>
        </div>
      </div>

      <div className="metrics-panel" style={{ marginTop: '-0.5rem' }}>
        <div className="metric">
          <div className="metric-label">Vol/OI Ratio</div>
          <div className="metric-value positive">{rec.volumeSpike}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Score</div>
          <div className="metric-value" style={{ color: 'var(--accent-purple)' }}>{rec.score}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Premium</div>
          <div className="metric-value neutral">${rec.currentPriceRaw?.toFixed(2)}</div>
        </div>
      </div>

      <div className="catalyst-section">
        <div className="catalyst-header">
          <Activity />
          <h4>The Catalyst</h4>
        </div>
        <p className="catalyst-text">{rec.catalyst}</p>
      </div>
    </div>
  );
}

// Section component that renders the calls/puts grid for a given horizon
function HorizonSection({ topCalls, topPuts, loading, error, scanMeta, onRetry, horizonKey }) {
  const hasResults = topCalls.length > 0 || topPuts.length > 0;

  const HORIZON_LABELS = {
    short: { calls: 'Top 10 Calls', puts: 'Top 10 Puts', callSub: 'Highest-scoring bullish penny call options (3-5 days)', putSub: 'Highest-scoring bearish penny put options (3-5 days)' },
    medium: { calls: 'Top 10 Calls', puts: 'Top 10 Puts', callSub: 'Highest-scoring bullish swing call options (2-4 weeks)', putSub: 'Highest-scoring bearish swing put options (2-4 weeks)' },
    long: { calls: 'Top 10 Calls', puts: 'Top 10 Puts', callSub: 'Highest-scoring bullish LEAP call options (60-365 days)', putSub: 'Highest-scoring bearish LEAP put options (60-365 days)' }
  };

  const labels = HORIZON_LABELS[horizonKey] || HORIZON_LABELS.short;

  return (
    <>
      {/* Loading State */}
      {loading && (
        <div className="glass-panel loading-state">
          <Loader2 size={48} className="spin-icon" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
          <h2>Scanning Options Chains...</h2>
          <p>Fetching live data from Yahoo Finance for 100+ large-cap tickers.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            This may take 1-2 minutes due to API rate limits.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-panel error-state">
          <AlertTriangle size={48} style={{ color: 'var(--accent-red)', marginBottom: '1rem' }} />
          <h2>Scan Failed</h2>
          <p>{error}</p>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Make sure the backend server is running on port 3001.</p>
          <button className="scan-button" onClick={onRetry} style={{ marginTop: '1rem' }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !hasResults && (
        <div className="glass-panel empty-state">
          <Target size={48} style={{ color: 'var(--accent-cyan)', opacity: 0.5, marginBottom: '1rem' }} />
          <h2>No Options Found</h2>
          <p>The scan completed but didn't find contracts matching the filters for this horizon. Markets may be closed or no contracts meet criteria.</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && hasResults && (
        <>
          <div className="section-header call-section">
            <div className="section-icon call-icon">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2>{labels.calls}</h2>
              <p>{labels.callSub}</p>
            </div>
          </div>
          {topCalls.length > 0 ? (
            <div className="radar-grid">
              {topCalls.map((rec) => (
                <OptionCard key={`call-${rec.id}`} rec={rec} />
              ))}
            </div>
          ) : (
            <div className="glass-panel empty-state" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <p>No call options matched the current filters for this horizon.</p>
            </div>
          )}

          <div className="section-divider"></div>

          <div className="section-header put-section">
            <div className="section-icon put-icon">
              <TrendingDown size={20} />
            </div>
            <div>
              <h2>{labels.puts}</h2>
              <p>{labels.putSub}</p>
            </div>
          </div>
          {topPuts.length > 0 ? (
            <div className="radar-grid">
              {topPuts.map((rec) => (
                <OptionCard key={`put-${rec.id}`} rec={rec} />
              ))}
            </div>
          ) : (
            <div className="glass-panel empty-state" style={{ padding: '2rem' }}>
              <p>No put options matched the current filters for this horizon.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('short');
  const [time, setTime] = useState('');

  // Per-horizon state
  const [horizonData, setHorizonData] = useState({
    short:  { topCalls: [], topPuts: [], loading: false, error: null, scanMeta: null },
    medium: { topCalls: [], topPuts: [], loading: false, error: null, scanMeta: null },
    long:   { topCalls: [], topPuts: [], loading: false, error: null, scanMeta: null }
  });

  // Track which horizons have been fetched to avoid re-fetching
  const fetched = useRef({ short: false, medium: false, long: false });

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const runScan = useCallback(async (horizon) => {
    setHorizonData(prev => ({
      ...prev,
      [horizon]: { ...prev[horizon], loading: true, error: null }
    }));

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_BASE}/api/scan?horizon=${horizon}`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();

      setHorizonData(prev => ({
        ...prev,
        [horizon]: {
          topCalls: data.topCalls || [],
          topPuts: data.topPuts || [],
          loading: false,
          error: null,
          scanMeta: {
            scanTime: data.scanTime,
            tickersScanned: data.tickersScanned,
            totalCandidates: data.totalCandidates,
            totalCalls: data.totalCalls || 0,
            totalPuts: data.totalPuts || 0,
            errors: data.errors,
            horizonLabel: data.horizonLabel
          }
        }
      }));
      fetched.current[horizon] = true;
    } catch (err) {
      setHorizonData(prev => ({
        ...prev,
        [horizon]: { ...prev[horizon], loading: false, error: err.message }
      }));
    }
  }, []);

  // Auto-scan on mount for the active tab
  useEffect(() => {
    runScan('short');
  }, [runScan]);

  // Fetch data when switching to a tab for the first time
  useEffect(() => {
    if (!fetched.current[activeTab]) {
      runScan(activeTab);
    }
  }, [activeTab, runScan]);

  const currentData = horizonData[activeTab];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <div className="logo-icon">
            <Zap size={24} />
          </div>
          <div className="logo-text">
            <h1>CENT OPTION RADAR</h1>
            <p>High-Velocity Asymmetric Screener</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="scan-button" onClick={() => { fetched.current[activeTab] = false; runScan(activeTab); }} disabled={currentData.loading}>
            {currentData.loading ? <Loader2 size={16} className="spin-icon" /> : <RefreshCw size={16} />}
            {currentData.loading ? 'Scanning...' : 'Re-Scan'}
          </button>
          <div className="time-container">
            <div className="pulse-dot"></div>
            <span>LIVE • {time} PST</span>
          </div>
        </div>
      </header>

      {/* Scan metadata bar */}
      {currentData.scanMeta && !currentData.loading && (
        <div className="scan-meta-bar">
          <div className="meta-chip">
            <BarChart3 size={14} />
            <span>{currentData.scanMeta.tickersScanned} tickers scanned</span>
          </div>
          <div className="meta-chip">
            <Target size={14} />
            <span>{currentData.scanMeta.totalCandidates} contracts found</span>
          </div>
          <div className="meta-chip call-chip">
            <TrendingUp size={14} />
            <span>{currentData.scanMeta.totalCalls} calls</span>
          </div>
          <div className="meta-chip put-chip">
            <TrendingDown size={14} />
            <span>{currentData.scanMeta.totalPuts} puts</span>
          </div>
          <div className="meta-chip">
            <Clock size={14} />
            <span>Last scan: {new Date(currentData.scanMeta.scanTime).toLocaleTimeString()}</span>
          </div>
          {currentData.scanMeta.errors > 0 && (
            <div className="meta-chip warning">
              <AlertTriangle size={14} />
              <span>{currentData.scanMeta.errors} ticker errors</span>
            </div>
          )}
        </div>
      )}

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'short' ? 'active' : ''}`}
          onClick={() => setActiveTab('short')}
        >
          Daily Radar (3-5 Days)
        </button>
        <button
          className={`tab ${activeTab === 'medium' ? 'active' : ''}`}
          onClick={() => setActiveTab('medium')}
        >
          Medium-Term (2-4 Weeks)
        </button>
        <button
          className={`tab ${activeTab === 'long' ? 'active' : ''}`}
          onClick={() => setActiveTab('long')}
        >
          Long-Term (Macro)
        </button>
      </div>

      <HorizonSection
        topCalls={currentData.topCalls}
        topPuts={currentData.topPuts}
        loading={currentData.loading}
        error={currentData.error}
        scanMeta={currentData.scanMeta}
        onRetry={() => runScan(activeTab)}
        horizonKey={activeTab}
      />
    </div>
  );
}

export default App;
