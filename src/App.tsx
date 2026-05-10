import { useMemo, useState } from 'react';
import { AiCoachPanel } from './components/AiCoachPanel';
import { ImportPanel } from './components/ImportPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SummaryCards } from './components/SummaryCards';
import { TradeReviewList } from './components/TradeReviewList';
import { defaultWalletAddress, sampleEvents } from './data/sampleTrades';
import { parseTradeCsv } from './domain/csv';
import type { AiCoachReview } from './domain/aiCoach';
import { buildAiCoachPayload } from './domain/aiCoach';
import { mapHeliusTransactions } from './domain/heliusMapper';
import { reviewTrade } from './domain/reviewRules';
import { summarizeReviews } from './domain/summary';
import { enrichTradeEventsWithMetadata } from './domain/tokenMetadata';
import { matchCompletedTrades } from './domain/tradeMatcher';
import type { TradeEvent } from './domain/trades';
import { fetchHeliusTransactions } from './services/helius';
import { fetchAiCoachReview } from './services/openaiCoach';
import { fetchTokenMetadata } from './services/tokenMetadata';

const heliusStoredKey = 'trade-reviewer-helius-key';
const openAiStoredKey = 'trade-reviewer-openai-key';

export function App() {
  const [walletAddress, setWalletAddress] = useState(defaultWalletAddress);
  const [heliusApiKey, setHeliusApiKeyState] = useState(() => readStoredApiKey('helius'));
  const [openAiApiKey, setOpenAiApiKeyState] = useState(() => readStoredApiKey('openai'));
  const [events, setEvents] = useState<TradeEvent[]>(sampleEvents);
  const [aiCoachReview, setAiCoachReview] = useState<AiCoachReview | null>(null);
  const [status, setStatus] = useState('Sample review loaded.');
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const reviews = useMemo(
    () => matchCompletedTrades(events).map((trade) => reviewTrade(trade)),
    [events]
  );
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);

  const setHeliusApiKey = (value: string) => {
    setHeliusApiKeyState(value);
    writeStoredApiKey('helius', value);
  };

  const setOpenAiApiKey = (value: string) => {
    setOpenAiApiKeyState(value);
    writeStoredApiKey('openai', value);
    setAiError('');
  };

  const replaceEvents = (nextEvents: TradeEvent[], nextStatus: string) => {
    setEvents(nextEvents);
    setAiCoachReview(null);
    setAiError('');
    setStatus(nextStatus);
  };

  const loadSample = () => {
    replaceEvents(sampleEvents, 'Sample review loaded.');
    setError('');
  };

  const importCsv = (csv: string) => {
    try {
      const parsed = parseTradeCsv(csv);
      replaceEvents(parsed, `Imported ${parsed.length} CSV trade events.`);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'CSV import failed.');
    }
  };

  const fetchWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const transactions = await fetchHeliusTransactions(walletAddress, heliusApiKey);
      const parsed = mapHeliusTransactions(walletAddress, transactions);
      const metadata = await fetchTokenMetadata(
        parsed.map((event) => event.tokenMint),
        heliusApiKey
      );
      const enriched = enrichTradeEventsWithMetadata(parsed, metadata);
      replaceEvents(enriched, `Fetched ${parsed.length} wallet swap events from Helius.`);
      if (parsed.length === 0) {
        setError('No wallet swap events were found in the fetched Helius history.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Wallet fetch failed.');
    } finally {
      setLoading(false);
    }
  };

  const runAiCoachReview = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const payload = buildAiCoachPayload(reviews, summary);
      const coachReview = await fetchAiCoachReview(payload, openAiApiKey);
      setAiCoachReview(coachReview);
      setStatus('AI coach review updated.');
    } catch (caught) {
      setAiError(caught instanceof Error ? caught.message : 'AI coach review failed.');
    } finally {
      setAiLoading(false);
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
            heliusApiKey={heliusApiKey}
            openAiApiKey={openAiApiKey}
            onWalletAddressChange={setWalletAddress}
            onHeliusApiKeyChange={setHeliusApiKey}
            onOpenAiApiKeyChange={setOpenAiApiKey}
          />
          <ImportPanel loading={loading} onLoadSample={loadSample} onFetchWallet={fetchWallet} onImportCsv={importCsv} />
          <section className="panel status-panel">
            <strong>{status}</strong>
            {error ? <p role="alert">{error}</p> : <p>API keys stay local. This app never asks for signing access.</p>}
          </section>
        </div>
        <div className="review-stack">
          <SummaryCards summary={summary} />
          <AiCoachPanel
            review={aiCoachReview}
            loading={aiLoading}
            disabled={reviews.length === 0 || loading}
            error={aiError}
            onReview={runAiCoachReview}
          />
          <TradeReviewList reviews={reviews} />
        </div>
      </div>
    </main>
  );
}

function readStoredApiKey(key: 'helius' | 'openai') {
  const nativeKey = key === 'helius'
    ? window.__TRADE_REVIEWER_API_KEY__
    : window.__TRADE_REVIEWER_OPENAI_API_KEY__;
  if (typeof nativeKey === 'string' && nativeKey.length > 0) {
    return nativeKey;
  }

  try {
    return localStorage.getItem(key === 'helius' ? heliusStoredKey : openAiStoredKey) ?? '';
  } catch {
    return '';
  }
}

function writeStoredApiKey(key: 'helius' | 'openai', value: string) {
  window.webkit?.messageHandlers?.tradeReviewerStorage?.postMessage({
    type: 'saveApiKey',
    key,
    value
  });

  try {
    localStorage.setItem(key === 'helius' ? heliusStoredKey : openAiStoredKey, value);
  } catch {
    // WKWebView can disable localStorage for bundled file URLs. The typed key
    // still works for the current app session when persistence is unavailable.
  }
}
