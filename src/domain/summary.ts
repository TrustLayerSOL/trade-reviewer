import type { TradeReview } from './trades';

export interface ReviewSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  open: number;
  winRate: number;
  netPnlSol: number;
  averagePnlPct: number;
  bestTrade?: TradeReview;
  worstTrade?: TradeReview;
}

export function summarizeReviews(reviews: TradeReview[]): ReviewSummary {
  const totalTrades = reviews.length;
  const wins = reviews.filter((review) => review.outcome === 'win').length;
  const losses = reviews.filter((review) => review.outcome === 'loss').length;
  const open = reviews.filter((review) => review.outcome === 'open').length;
  const closed = reviews.filter((review) => review.outcome !== 'open');
  const netPnlSol = round(reviews.reduce((sum, review) => sum + review.pnlSol, 0));
  const averagePnlPct = closed.length
    ? round(closed.reduce((sum, review) => sum + review.pnlPct, 0) / closed.length, 2)
    : 0;

  return {
    totalTrades,
    wins,
    losses,
    open,
    winRate: closed.length ? round((wins / closed.length) * 100, 1) : 0,
    netPnlSol,
    averagePnlPct,
    bestTrade: [...reviews].sort((a, b) => b.pnlSol - a.pnlSol)[0],
    worstTrade: [...reviews].sort((a, b) => a.pnlSol - b.pnlSol)[0]
  };
}

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
