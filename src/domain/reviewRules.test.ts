import { describe, expect, it } from 'vitest';
import { reviewTrade } from './reviewRules';
import type { CompletedTrade } from './trades';

const baseTrade: CompletedTrade = {
  id: 'bonk-1',
  tokenMint: 'BonkMint111',
  symbol: 'BONK',
  entryTime: '2026-05-09T12:00:00.000Z',
  exitTime: '2026-05-09T12:35:00.000Z',
  solInvested: 2,
  solReturned: 2.7,
  feesSol: 0.02,
  maxDrawdownPct: -18,
  peakGainPct: 52,
  entryReason: 'Fresh volume with wallet cluster confirmation',
  exitReason: 'Scaled out into strength',
  source: 'sample'
};

describe('reviewTrade', () => {
  it('labels profitable trades as wins and credits taking profit', () => {
    const review = reviewTrade(baseTrade);

    expect(review.outcome).toBe('win');
    expect(review.pnlSol).toBeCloseTo(0.68);
    expect(review.pnlPct).toBeCloseTo(34);
    expect(review.didRight).toContain('Took profit instead of letting the full move round-trip.');
    expect(review.didWrong).not.toContain('No exit reason was recorded.');
  });

  it('labels losing trades and flags oversized drawdown plus missing exit reason', () => {
    const review = reviewTrade({
      ...baseTrade,
      id: 'loss-1',
      solReturned: 1.25,
      maxDrawdownPct: -41,
      peakGainPct: 6,
      exitReason: ''
    });

    expect(review.outcome).toBe('loss');
    expect(review.pnlSol).toBeCloseTo(-0.77);
    expect(review.pnlPct).toBeCloseTo(-38.5);
    expect(review.didWrong).toContain('Held through a deep drawdown before exiting.');
    expect(review.didWrong).toContain('No exit reason was recorded.');
    expect(review.nextAction).toBe('Define the invalidation level before entering and exit when it breaks.');
  });
});
