import type { TradeEvent } from '../domain/trades';

export const defaultWalletAddress = 'GvLED9AJquasBJ9Jb4zFsrpkib8pkRBHdeUK7hTtMhGj';

export const sampleEvents: TradeEvent[] = [
  {
    id: 'sample-buy-1',
    signature: 'sample-buy-1',
    tokenMint: 'SampleMoonMint111111111111111111111111',
    symbol: 'MOON',
    side: 'buy',
    timestamp: '2026-05-09T16:00:00.000Z',
    tokenAmount: 1500000,
    solAmount: 1.8,
    feeSol: 0.012,
    source: 'sample'
  },
  {
    id: 'sample-sell-1',
    signature: 'sample-sell-1',
    tokenMint: 'SampleMoonMint111111111111111111111111',
    symbol: 'MOON',
    side: 'sell',
    timestamp: '2026-05-09T16:31:00.000Z',
    tokenAmount: 1500000,
    solAmount: 2.72,
    feeSol: 0.014,
    source: 'sample'
  },
  {
    id: 'sample-buy-2',
    signature: 'sample-buy-2',
    tokenMint: 'SampleRugMint2222222222222222222222222',
    symbol: 'RUG',
    side: 'buy',
    timestamp: '2026-05-09T17:05:00.000Z',
    tokenAmount: 900000,
    solAmount: 1.2,
    feeSol: 0.011,
    source: 'sample'
  },
  {
    id: 'sample-sell-2',
    signature: 'sample-sell-2',
    tokenMint: 'SampleRugMint2222222222222222222222222',
    symbol: 'RUG',
    side: 'sell',
    timestamp: '2026-05-09T17:44:00.000Z',
    tokenAmount: 900000,
    solAmount: 0.68,
    feeSol: 0.01,
    source: 'sample'
  }
];
