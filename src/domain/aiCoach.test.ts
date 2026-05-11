import { describe, expect, it } from 'vitest';
import { buildAiCoachPayload } from './aiCoach';
import type { ReviewSummary } from './summary';
import type { TradeReview } from './trades';

const review: TradeReview = {
  trade: {
    id: 'mint-a',
    tokenMint: 'MintA',
    symbol: 'MOON',
    tokenName: 'Moon Runner',
    entryTime: '2026-05-09T10:00:00.000Z',
    exitTime: '2026-05-09T10:20:00.000Z',
    solInvested: 1,
    solReturned: 1.4,
    feesSol: 0.01,
    maxDrawdownPct: 0,
    peakGainPct: 0,
    entryReason: '',
    exitReason: '',
    source: 'helius'
  },
  outcome: 'win',
  pnlSol: 0.39,
  pnlPct: 39,
  didRight: ['Took profit.'],
  didWrong: ['No exit reason was recorded.'],
  nextAction: 'Write an exit plan.'
};

const summary: ReviewSummary = {
  totalTrades: 1,
  wins: 1,
  losses: 0,
  open: 0,
  winRate: 100,
  netPnlSol: 0.39,
  averagePnlPct: 39,
  bestTrade: review,
  worstTrade: review
};

describe('buildAiCoachPayload', () => {
  it('keeps the AI payload focused on trade facts', () => {
    const payload = buildAiCoachPayload([review], summary);

    expect(payload.summary).toMatchObject({
      totalTrades: 1,
      netPnlSol: 0.39
    });
    expect(payload.trades[0]).toMatchObject({
      token: 'Moon Runner',
      symbol: 'MOON',
      outcome: 'win',
      pnlPct: 39,
      didWrong: ['No exit reason was recorded.']
    });
    expect(JSON.stringify(payload)).not.toContain('MintA');
  });

  it('includes trader entry and exit reasons for selected trade coaching', () => {
    const payload = buildAiCoachPayload([
      {
        ...review,
        trade: {
          ...review.trade,
          entryReason: 'Bought because volume was accelerating.',
          exitReason: 'Sold because momentum stalled.'
        }
      }
    ], summary);

    expect(payload.trades[0]).toMatchObject({
      entryReason: 'Bought because volume was accelerating.',
      exitReason: 'Sold because momentum stalled.'
    });
  });
});
