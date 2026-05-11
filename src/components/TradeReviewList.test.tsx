import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TradeReviewList } from './TradeReviewList';
import type { TradeReview } from '../domain/trades';

const baseReview: TradeReview = {
  trade: {
    id: 'mint-a',
    tokenMint: 'MintA',
    symbol: 'MOON',
    tokenName: 'Moon Runner',
    tokenImageUrl: 'https://example.com/moon.png',
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
  didWrong: [],
  nextAction: 'Repeat the setup.'
};

describe('TradeReviewList', () => {
  it('renders token metadata when available', () => {
    render(<TradeReviewList reviews={[baseReview]} />);

    expect(screen.getByRole('heading', { name: 'Moon Runner' })).toBeTruthy();
    expect(screen.getByText(/MOON/)).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Moon Runner token image' }).getAttribute('src')).toBe(
      'https://example.com/moon.png'
    );
  });

  it('falls back to the symbol when metadata is missing', () => {
    render(
      <TradeReviewList
        reviews={[
          {
            ...baseReview,
            trade: {
              ...baseReview.trade,
              tokenName: undefined,
              tokenImageUrl: undefined
            }
          }
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'MOON' })).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('lets a trade be selected for AI review', () => {
    const onSelectionChange = vi.fn();
    render(
      <TradeReviewList
        reviews={[baseReview]}
        selectedTradeIds={new Set()}
        onTradeSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Moon Runner for AI review' }));

    expect(onSelectionChange).toHaveBeenCalledWith('mint-a', true);
  });

  it('lets entry and exit reasons be edited', () => {
    const onTradeReasonChange = vi.fn();
    render(
      <TradeReviewList
        reviews={[baseReview]}
        onTradeReasonChange={onTradeReasonChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Entry reason for Moon Runner'), {
      target: { value: 'Bought because volume was accelerating.' }
    });
    fireEvent.change(screen.getByLabelText('Exit reason for Moon Runner'), {
      target: { value: 'Sold because momentum stalled.' }
    });

    expect(onTradeReasonChange).toHaveBeenCalledWith('mint-a', 'entryReason', 'Bought because volume was accelerating.');
    expect(onTradeReasonChange).toHaveBeenCalledWith('mint-a', 'exitReason', 'Sold because momentum stalled.');
  });
});
