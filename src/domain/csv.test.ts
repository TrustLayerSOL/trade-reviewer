import { describe, expect, it } from 'vitest';
import { parseTradeCsv } from './csv';

describe('parseTradeCsv', () => {
  it('parses simple buy and sell rows into normalized events', () => {
    const csv = [
      'timestamp,side,symbol,tokenMint,tokenAmount,solAmount,feeSol,signature',
      '2026-05-09T10:00:00.000Z,buy,MOON,MintA,1000,1.4,0.01,buySig',
      '2026-05-09T10:20:00.000Z,sell,MOON,MintA,1000,2.0,0.01,sellSig'
    ].join('\n');

    const events = parseTradeCsv(csv);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      side: 'buy',
      symbol: 'MOON',
      tokenMint: 'MintA',
      tokenAmount: 1000,
      solAmount: 1.4
    });
  });

  it('rejects rows with invalid trade sides', () => {
    const csv = [
      'timestamp,side,symbol,tokenMint,tokenAmount,solAmount,feeSol,signature',
      '2026-05-09T10:00:00.000Z,hold,MOON,MintA,1000,1.4,0.01,buySig'
    ].join('\n');

    expect(() => parseTradeCsv(csv)).toThrow('Row 2 has invalid side "hold"');
  });
});
