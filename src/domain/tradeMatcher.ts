import type { CompletedTrade, TradeEvent } from './trades';

interface PositionBucket {
  tokenMint: string;
  symbol: string;
  entryTime: string;
  lastSource: TradeEvent['source'];
  tokenBought: number;
  tokenSold: number;
  solInvested: number;
  solReturned: number;
  feesSol: number;
  exitTime?: string;
}

export function matchCompletedTrades(events: TradeEvent[]): CompletedTrade[] {
  const buckets = new Map<string, PositionBucket>();

  for (const event of [...events].sort(byTimestamp)) {
    const bucket = buckets.get(event.tokenMint) ?? createBucket(event);
    buckets.set(event.tokenMint, bucket);

    bucket.symbol = event.symbol || bucket.symbol;
    bucket.lastSource = event.source;
    bucket.feesSol += event.feeSol;

    if (event.side === 'buy') {
      bucket.tokenBought += event.tokenAmount;
      bucket.solInvested += event.solAmount;
      if (event.timestamp < bucket.entryTime) bucket.entryTime = event.timestamp;
    } else {
      bucket.tokenSold += event.tokenAmount;
      bucket.solReturned += event.solAmount;
      bucket.exitTime = event.timestamp;
    }
  }

  return [...buckets.values()].map(toCompletedTrade);
}

function createBucket(event: TradeEvent): PositionBucket {
  return {
    tokenMint: event.tokenMint,
    symbol: event.symbol,
    entryTime: event.timestamp,
    lastSource: event.source,
    tokenBought: 0,
    tokenSold: 0,
    solInvested: 0,
    solReturned: 0,
    feesSol: 0
  };
}

function toCompletedTrade(bucket: PositionBucket): CompletedTrade {
  const isClosed = bucket.tokenBought > 0 && bucket.tokenSold >= bucket.tokenBought * 0.95;

  return {
    id: `${bucket.tokenMint}-${bucket.entryTime}`,
    tokenMint: bucket.tokenMint,
    symbol: bucket.symbol,
    entryTime: bucket.entryTime,
    exitTime: isClosed ? bucket.exitTime : undefined,
    solInvested: round(bucket.solInvested),
    solReturned: round(bucket.solReturned),
    feesSol: round(bucket.feesSol),
    maxDrawdownPct: 0,
    peakGainPct: bucket.solInvested > 0 ? round(((bucket.solReturned - bucket.solInvested) / bucket.solInvested) * 100, 2) : 0,
    entryReason: '',
    exitReason: '',
    source: bucket.lastSource
  };
}

function byTimestamp(a: TradeEvent, b: TradeEvent) {
  return Date.parse(a.timestamp) - Date.parse(b.timestamp);
}

function round(value: number, decimals = 6) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
