import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { fetchAiCoachReview } from './services/googleAiCoach';

vi.mock('./services/googleAiCoach', () => ({
  fetchAiCoachReview: vi.fn().mockResolvedValue({
    headline: 'Focused readout',
    summary: 'One selected trade reviewed.',
    strengths: [],
    mistakes: [],
    patterns: [],
    nextTradeRule: 'Write the exit before entry.',
    riskWarnings: []
  })
}));

describe('App AI trade selection', () => {
  beforeEach(() => {
    vi.mocked(fetchAiCoachReview).mockClear();
  });

  it('sends only selected trades to the AI coach', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select MOON for AI review' }));
    fireEvent.click(screen.getByRole('button', { name: /Review with AI/ }));

    await waitFor(() => expect(fetchAiCoachReview).toHaveBeenCalled());

    const [payload] = vi.mocked(fetchAiCoachReview).mock.calls[0];
    expect(payload.trades).toHaveLength(1);
    expect(payload.trades[0].symbol).toBe('MOON');
  });
});
