import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAiCoachReview } from './googleAiCoach';
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
      entryReason: '',
      exitReason: '',
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

  it('uses the native macOS Google AI bridge when it is available', async () => {
    const nativeRequest = vi.fn().mockResolvedValue({
      candidates: [{ content: { parts: [{ text: JSON.stringify(coachJson) }] } }]
    });
    vi.stubGlobal('window', {
      __TRADE_REVIEWER_GOOGLE_AI_REQUEST__: nativeRequest
    });

    const review = await fetchAiCoachReview(payload, {
      googleAiApiKey: 'stored-google-ai-key',
      groqApiKey: ''
    });

    expect(review).toEqual(coachJson);
    expect(nativeRequest).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.any(Array),
      generationConfig: expect.objectContaining({
        responseMimeType: 'application/json',
        responseSchema: expect.objectContaining({ type: 'OBJECT' })
      })
    }));
  });

  it('falls back to the Google AI generateContent API in browser/dev mode', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify(coachJson) }] } }]
      })
    });
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', fetch);

    const review = await fetchAiCoachReview(payload, {
      googleAiApiKey: 'google-ai-key',
      groqApiKey: ''
    });

    expect(review.headline).toBe('Good profit, weak journaling');
    expect(String(fetch.mock.calls[0][0])).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    expect(fetch.mock.calls[0][1].headers['x-goog-api-key']).toBe('google-ai-key');
  });

  it('uses Groq when Google AI fails because of a rate or quota limit', async () => {
    const googleRequest = vi.fn().mockRejectedValue(Object.assign(new Error('Quota exceeded.'), { statusCode: 429 }));
    const groqRequest = vi.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(coachJson) } }]
    });
    vi.stubGlobal('window', {
      __TRADE_REVIEWER_GOOGLE_AI_REQUEST__: googleRequest,
      __TRADE_REVIEWER_GROQ_REQUEST__: groqRequest
    });

    const review = await fetchAiCoachReview(payload, {
      googleAiApiKey: 'stored-google-ai-key',
      groqApiKey: 'stored-groq-key'
    });

    expect(review).toEqual(coachJson);
    expect(groqRequest).toHaveBeenCalledWith(expect.objectContaining({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    }));
  });

  it('does not use Groq for non-limit Google AI failures', async () => {
    const googleRequest = vi.fn().mockRejectedValue(Object.assign(new Error('Invalid API key.'), { statusCode: 401 }));
    const groqRequest = vi.fn();
    vi.stubGlobal('window', {
      __TRADE_REVIEWER_GOOGLE_AI_REQUEST__: googleRequest,
      __TRADE_REVIEWER_GROQ_REQUEST__: groqRequest
    });

    await expect(fetchAiCoachReview(payload, {
      googleAiApiKey: 'bad-google-ai-key',
      groqApiKey: 'stored-groq-key'
    })).rejects.toThrow('Invalid API key.');

    expect(groqRequest).not.toHaveBeenCalled();
  });

  it('asks for a Groq key when Google AI is limited and no fallback key is saved', async () => {
    const googleRequest = vi.fn().mockRejectedValue(Object.assign(new Error('Rate limit reached.'), { statusCode: 429 }));
    vi.stubGlobal('window', {
      __TRADE_REVIEWER_GOOGLE_AI_REQUEST__: googleRequest
    });

    await expect(fetchAiCoachReview(payload, {
      googleAiApiKey: 'stored-google-ai-key',
      groqApiKey: ''
    })).rejects.toThrow('Add a Groq API key');
  });
});
