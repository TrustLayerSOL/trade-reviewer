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
    vi.stubGlobal('localStorage', createMemoryStorage());
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

  it('sends edited exit reasons to the AI coach', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Exit reason for MOON'), {
      target: { value: 'Sold because the volume died.' }
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select MOON for AI review' }));
    fireEvent.click(screen.getByRole('button', { name: /Review with AI/ }));

    await waitFor(() => expect(fetchAiCoachReview).toHaveBeenCalled());

    const [payload] = vi.mocked(fetchAiCoachReview).mock.calls[0];
    expect(payload.trades[0].exitReason).toBe('Sold because the volume died.');
  });

  it('keeps edited trade reasons after the app is reopened', () => {
    const { unmount } = render(<App />);

    fireEvent.change(screen.getByLabelText('Exit reason for MOON'), {
      target: { value: 'Sold because the volume died.' }
    });
    unmount();

    render(<App />);

    expect(screen.getByLabelText<HTMLInputElement>('Exit reason for MOON').value).toBe('Sold because the volume died.');
  });

  it('keeps edited trade reasons when the same trades are loaded again', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Exit reason for MOON'), {
      target: { value: 'Sold because the volume died.' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sample' }));

    expect(screen.getByLabelText<HTMLInputElement>('Exit reason for MOON').value).toBe('Sold because the volume died.');
  });
});

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    }
  };
}
