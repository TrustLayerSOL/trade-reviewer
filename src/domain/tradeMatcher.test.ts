import { describe, expect, it } from 'vitest';
import { matchCompletedTrades } from './tradeMatcher';
import type { TradeEvent } from './trades';

const events: TradeEvent[] = [
  {
    id: 'buy-1',
    signature: 'sig-buy',
    tokenMint: 'MintA',
    symbol: 'MOON',
    tokenName: 'Moon Runner',
    tokenImageUrl: 'https://example.com/moon.png',
    side: 'buy',
    timestamp: '2026-05-09T10:00:00.000Z',
    tokenAmount: 1000,
    solAmount: 1.4,
    feeSol: 0.01,
    source: 'csv'
  },
  {
    id: 'sell-1',
    signature: 'sig-sell',
    tokenMint: 'MintA',
    symbol: 'MOON',
    side: 'sell',
    timestamp: '2026-05-09T10:22:00.000Z',
    tokenAmount: 1000,
    solAmount: 2,
    feeSol: 0.01,
    source: 'csv'
  }
];

describe('matchCompletedTrades', () => {
  it('pairs buys and sells for the same mint into a completed trade', () => {
    const trades = matchCompletedTrades(events);

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({
      tokenMint: 'MintA',
      symbol: 'MOON',
      tokenName: 'Moon Runner',
      tokenImageUrl: 'https://example.com/moon.png',
      entryTime: '2026-05-09T10:00:00.000Z',
      exitTime: '2026-05-09T10:22:00.000Z',
      solInvested: 1.4,
      solReturned: 2,
      feesSol: 0.02
    });
  });

  it('keeps unsold buys open instead of pretending they are finished', () => {
    const trades = matchCompletedTrades(events.slice(0, 1));

    expect(trades).toHaveLength(1);
    expect(trades[0].exitTime).toBeUndefined();
    expect(trades[0].solReturned).toBe(0);
  });

  it('orders trades with the most recent activity first', () => {
    const trades = matchCompletedTrades([
      ...events,
      {
        id: 'newer-buy',
        signature: 'newer-buy',
        tokenMint: 'MintB',
        symbol: 'FAST',
        side: 'buy',
        timestamp: '2026-05-09T11:00:00.000Z',
        tokenAmount: 100,
        solAmount: 0.5,
        feeSol: 0.01,
        source: 'csv'
      },
      {
        id: 'newer-sell',
        signature: 'newer-sell',
        tokenMint: 'MintB',
        symbol: 'FAST',
        side: 'sell',
        timestamp: '2026-05-09T11:10:00.000Z',
        tokenAmount: 100,
        solAmount: 0.65,
        feeSol: 0.01,
        source: 'csv'
      }
    ]);

    expect(trades.map((trade) => trade.symbol)).toEqual(['FAST', 'MOON']);
  });
});
