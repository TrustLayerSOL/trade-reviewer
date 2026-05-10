import { useMemo, useState } from 'react';
import { ImportPanel } from './components/ImportPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SummaryCards } from './components/SummaryCards';
import { TradeReviewList } from './components/TradeReviewList';
import { defaultWalletAddress, sampleEvents } from './data/sampleTrades';
import { parseTradeCsv } from './domain/csv';
import { mapHeliusTransactions } from './domain/heliusMapper';
import { reviewTrade } from './domain/reviewRules';
import { summarizeReviews } from './domain/summary';
import { enrichTradeEventsWithMetadata } from './domain/tokenMetadata';
import { matchCompletedTrades } from './domain/tradeMatcher';
import type { TradeEvent } from './domain/trades';
import { fetchHeliusTransactions } from './services/helius';
import { fetchTokenMetadata } from './services/tokenMetadata';

const storedKey = 'trade-reviewer-helius-key';

export function App() {
  const [walletAddress, setWalletAddress] = useState(defaultWalletAddress);
  const [apiKey, setApiKeyState] = useState(readStoredApiKey);
  const [events, setEvents] = useState<TradeEvent[]>(sampleEvents);
  const [status, setStatus] = useState('Sample review loaded.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reviews = useMemo(
    () => matchCompletedTrades(events).map((trade) => reviewTrade(trade)),
    [events]
  );
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);

  const setApiKey = (value: string) => {
    setApiKeyState(value);
    writeStoredApiKey(value);
  };

  const loadSample = () => {
    setEvents(sampleEvents);
    setError('');
    setStatus('Sample review loaded.');
  };

  const importCsv = (csv: string) => {
    try {
      const parsed = parseTradeCsv(csv);
      setEvents(parsed);
      setError('');
      setStatus(`Imported ${parsed.length} CSV trade events.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'CSV import failed.');
    }
  };

  const fetchWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const transactions = await fetchHeliusTransactions(walletAddress, apiKey);
      const parsed = mapHeliusTransactions(walletAddress, transactions);
      const metadata = await fetchTokenMetadata(
        parsed.map((event) => event.tokenMint),
        apiKey
      );
      const enriched = enrichTradeEventsWithMetadata(parsed, metadata);
      setEvents(enriched);
      setStatus(`Fetched ${parsed.length} wallet swap events from Helius.`);
      if (parsed.length === 0) {
        setError('No wallet swap events were found in the fetched Helius history.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Wallet fetch failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Read-only wallet review</p>
        <h1>Trade Reviewer</h1>
        <p>
          Review Solana meme coin trades, see what went right, spot what went
          wrong, and tighten the next entry.
        </p>
      </section>
      <div className="workspace">
        <div className="control-stack">
          <SettingsPanel
            walletAddress={walletAddress}
            apiKey={apiKey}
            onWalletAddressChange={setWalletAddress}
            onApiKeyChange={setApiKey}
          />
          <ImportPanel loading={loading} onLoadSample={loadSample} onFetchWallet={fetchWallet} onImportCsv={importCsv} />
          <section className="panel status-panel">
            <strong>{status}</strong>
            {error ? <p role="alert">{error}</p> : <p>API keys stay local. This app never asks for signing access.</p>}
          </section>
        </div>
        <div className="review-stack">
          <SummaryCards summary={summary} />
          <TradeReviewList reviews={reviews} />
        </div>
      </div>
    </main>
  );
}

function readStoredApiKey() {
  const nativeKey = window.__TRADE_REVIEWER_API_KEY__;
  if (typeof nativeKey === 'string' && nativeKey.length > 0) {
    return nativeKey;
  }

  try {
    return localStorage.getItem(storedKey) ?? '';
  } catch {
    return '';
  }
}

function writeStoredApiKey(value: string) {
  window.webkit?.messageHandlers?.tradeReviewerStorage?.postMessage({
    type: 'saveApiKey',
    value
  });

  try {
    localStorage.setItem(storedKey, value);
  } catch {
    // WKWebView can disable localStorage for bundled file URLs. The typed key
    // still works for the current app session when persistence is unavailable.
  }
}
