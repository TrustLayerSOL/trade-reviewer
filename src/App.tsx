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
import type { CompletedTrade, TradeEvent } from './domain/trades';
import { fetchHeliusTransactions } from './services/helius';
import { fetchAiCoachReview } from './services/googleAiCoach';
import { fetchTokenMetadata } from './services/tokenMetadata';

const heliusStoredKey = 'trade-reviewer-helius-key';
const googleAiStoredKey = 'trade-reviewer-google-ai-key';
const groqStoredKey = 'trade-reviewer-groq-key';

export function App() {
  const [walletAddress, setWalletAddress] = useState(defaultWalletAddress);
  const [heliusApiKey, setHeliusApiKeyState] = useState(() => readStoredApiKey('helius'));
  const [googleAiApiKey, setGoogleAiApiKeyState] = useState(() => readStoredApiKey('googleAi'));
  const [groqApiKey, setGroqApiKeyState] = useState(() => readStoredApiKey('groq'));
  const [events, setEvents] = useState<TradeEvent[]>(sampleEvents);
  const [selectedTradeIds, setSelectedTradeIds] = useState<ReadonlySet<string>>(() => new Set());
  const [tradeReasons, setTradeReasons] = useState<Record<string, Partial<Pick<CompletedTrade, 'entryReason' | 'exitReason'>>>>({});
  const [aiCoachReview, setAiCoachReview] = useState<AiCoachReview | null>(null);
  const [status, setStatus] = useState('Sample review loaded.');
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const reviews = useMemo(
    () => matchCompletedTrades(events).map((trade) => reviewTrade({
      ...trade,
      ...tradeReasons[trade.id]
    })),
    [events, tradeReasons]
  );
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);
  const selectedReviews = useMemo(
    () => reviews.filter((review) => selectedTradeIds.has(review.trade.id)),
    [reviews, selectedTradeIds]
  );
  const selectedSummary = useMemo(() => summarizeReviews(selectedReviews), [selectedReviews]);

  const setHeliusApiKey = (value: string) => {
    setHeliusApiKeyState(value);
    writeStoredApiKey('helius', value);
  };

  const setGoogleAiApiKey = (value: string) => {
    setGoogleAiApiKeyState(value);
    writeStoredApiKey('googleAi', value);
    setAiError('');
  };

  const setGroqApiKey = (value: string) => {
    setGroqApiKeyState(value);
    writeStoredApiKey('groq', value);
    setAiError('');
  };

  const replaceEvents = (nextEvents: TradeEvent[], nextStatus: string) => {
    setEvents(nextEvents);
    setSelectedTradeIds(new Set());
    setTradeReasons({});
    setAiCoachReview(null);
    setAiError('');
    setStatus(nextStatus);
  };

  const setTradeSelected = (tradeId: string, selected: boolean) => {
    setSelectedTradeIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(tradeId);
      } else {
        next.delete(tradeId);
      }
      return next;
    });
    setAiCoachReview(null);
    setAiError('');
  };

  const setTradeReason = (tradeId: string, field: 'entryReason' | 'exitReason', value: string) => {
    setTradeReasons((current) => ({
      ...current,
      [tradeId]: {
        ...current[tradeId],
        [field]: value
      }
    }));
    setAiCoachReview(null);
    setAiError('');
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
      if (selectedReviews.length === 0) {
        throw new Error('Select one or more trades before running the AI coach.');
      }

      const payload = buildAiCoachPayload(selectedReviews, selectedSummary);
      const coachReview = await fetchAiCoachReview(payload, { googleAiApiKey, groqApiKey });
      setAiCoachReview(coachReview);
      setStatus(`AI coach review updated for ${selectedReviews.length} selected trade${selectedReviews.length === 1 ? '' : 's'}.`);
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
            googleAiApiKey={googleAiApiKey}
            groqApiKey={groqApiKey}
            onWalletAddressChange={setWalletAddress}
            onHeliusApiKeyChange={setHeliusApiKey}
            onGoogleAiApiKeyChange={setGoogleAiApiKey}
            onGroqApiKeyChange={setGroqApiKey}
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
            disabled={selectedReviews.length === 0 || loading}
            error={aiError}
            selectionCount={selectedReviews.length}
            onReview={runAiCoachReview}
          />
          <TradeReviewList
            reviews={reviews}
            selectedTradeIds={selectedTradeIds}
            onTradeSelectionChange={setTradeSelected}
            onTradeReasonChange={setTradeReason}
          />
        </div>
      </div>
    </main>
  );
}

function readStoredApiKey(key: 'helius' | 'googleAi' | 'groq') {
  const nativeKey = nativeStoredApiKey(key);
  if (typeof nativeKey === 'string' && nativeKey.length > 0) {
    return nativeKey;
  }

  try {
    return localStorage.getItem(localStorageKey(key)) ?? '';
  } catch {
    return '';
  }
}

function writeStoredApiKey(key: 'helius' | 'googleAi' | 'groq', value: string) {
  window.webkit?.messageHandlers?.tradeReviewerStorage?.postMessage({
    type: 'saveApiKey',
    key,
    value
  });

  try {
    localStorage.setItem(localStorageKey(key), value);
  } catch {
    // WKWebView can disable localStorage for bundled file URLs. The typed key
    // still works for the current app session when persistence is unavailable.
  }
}

function nativeStoredApiKey(key: 'helius' | 'googleAi' | 'groq') {
  if (key === 'helius') return window.__TRADE_REVIEWER_API_KEY__;
  if (key === 'googleAi') return window.__TRADE_REVIEWER_GOOGLE_AI_API_KEY__;
  return window.__TRADE_REVIEWER_GROQ_API_KEY__;
}

function localStorageKey(key: 'helius' | 'googleAi' | 'groq') {
  if (key === 'helius') return heliusStoredKey;
  if (key === 'googleAi') return googleAiStoredKey;
  return groqStoredKey;
}
