import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAiCoachReview } from './openaiCoach';
import type { AiCoachPayload } from '../domain/aiCoach';

const payload: AiCoachPayload = {
  summary: {
    totalTrades: 1,
    wins: 1,
    losses: 0,
    open: 0,
    winRate: 100,
    netPnlSol: 0.39,
    averagePnlPct: 39
  },
  trades: [
    {
      token: 'Moon Runner',
      symbol: 'MOON',
      outcome: 'win',
      pnlSol: 0.39,
      pnlPct: 39,
      solInvested: 1,
      solReturned: 1.4,
      feesSol: 0.01,
      entryTime: '2026-05-09T10:00:00.000Z',
      exitTime: '2026-05-09T10:20:00.000Z',
      didRight: ['Took profit.'],
      didWrong: [],
      nextAction: 'Repeat it.'
    }
  ]
};

const coachJson = {
  headline: 'Good profit, weak journaling',
  summary: 'You closed green but need a clearer exit reason.',
  strengths: ['Took profit.'],
  mistakes: ['No exit reason was recorded.'],
  patterns: ['Wins are coming from quick exits.'],
  nextTradeRule: 'Write the exit before entering.',
  riskWarnings: ['This is a high-volatility meme coin workflow.']
};

describe('fetchAiCoachReview', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the native macOS OpenAI bridge when it is available', async () => {
    const nativeRequest = vi.fn().mockResolvedValue({ output_text: JSON.stringify(coachJson) });
    vi.stubGlobal('window', {
      __TRADE_REVIEWER_OPENAI_REQUEST__: nativeRequest
    });

    const review = await fetchAiCoachReview(payload, 'stored-openai-key');

    expect(review).toEqual(coachJson);
    expect(nativeRequest).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5.4-mini',
      text: expect.objectContaining({
        format: expect.objectContaining({ type: 'json_schema' })
      })
    }));
  });

  it('falls back to the OpenAI Responses API in browser/dev mode', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: JSON.stringify(coachJson) })
    });
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', fetch);

    const review = await fetchAiCoachReview(payload, 'openai-key');

    expect(review.headline).toBe('Good profit, weak journaling');
    expect(String(fetch.mock.calls[0][0])).toBe('https://api.openai.com/v1/responses');
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer openai-key');
  });
});
