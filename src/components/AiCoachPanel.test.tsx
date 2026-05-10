import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiCoachPanel } from './AiCoachPanel';
import type { AiCoachReview } from '../domain/aiCoach';

const review: AiCoachReview = {
  headline: 'Good profit, weak journaling',
  summary: 'You closed green but need a clearer exit reason.',
  strengths: ['Took profit.'],
  mistakes: ['No exit reason was recorded.'],
  patterns: ['Wins are coming from quick exits.'],
  nextTradeRule: 'Write the exit before entering.',
  riskWarnings: ['Meme coins can move violently.']
};

describe('AiCoachPanel', () => {
  it('renders the coach result', () => {
    render(<AiCoachPanel review={review} loading={false} disabled={false} onReview={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Good profit, weak journaling' })).toBeTruthy();
    expect(screen.getByText('Write the exit before entering.')).toBeTruthy();
    expect(screen.getByText('Meme coins can move violently.')).toBeTruthy();
  });

  it('disables review while loading or unavailable', () => {
    render(<AiCoachPanel review={null} loading disabled onReview={vi.fn()} />);

    expect(screen.getByRole<HTMLButtonElement>('button', { name: /reviewing/i }).disabled).toBe(true);
  });
});
