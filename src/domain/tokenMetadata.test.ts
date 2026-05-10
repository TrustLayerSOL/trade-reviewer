import { describe, expect, it } from 'vitest';
import { enrichTradeEventsWithMetadata } from './tokenMetadata';
import type { TradeEvent } from './trades';

const baseEvent: TradeEvent = {
  id: 'buy-1',
  signature: 'sig-buy',
  tokenMint: 'MintA',
  symbol: 'MINT...INTA',
  side: 'buy',
  timestamp: '2026-05-09T10:00:00.000Z',
  tokenAmount: 1000,
  solAmount: 1.4,
  feeSol: 0.01,
  source: 'helius'
};

describe('enrichTradeEventsWithMetadata', () => {
  it('adds token name image and symbol metadata by mint', () => {
    const events = enrichTradeEventsWithMetadata([baseEvent], [
      {
        tokenMint: 'MintA',
        symbol: 'MOON',
        tokenName: 'Moon Runner',
        tokenImageUrl: 'https://example.com/moon.png'
      }
    ]);

    expect(events[0]).toMatchObject({
      symbol: 'MOON',
      tokenName: 'Moon Runner',
      tokenImageUrl: 'https://example.com/moon.png'
    });
  });

  it('keeps the original fallback display when metadata is missing', () => {
    const events = enrichTradeEventsWithMetadata([baseEvent], []);

    expect(events[0].symbol).toBe('MINT...INTA');
    expect(events[0].tokenName).toBeUndefined();
    expect(events[0].tokenImageUrl).toBeUndefined();
  });
});
