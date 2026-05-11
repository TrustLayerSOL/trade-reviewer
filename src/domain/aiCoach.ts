import type { ReviewSummary } from './summary';
import type { TradeReview } from './trades';

export interface AiCoachReview {
  headline: string;
  summary: string;
  strengths: string[];
  mistakes: string[];
  patterns: string[];
  nextTradeRule: string;
  riskWarnings: string[];
}

export interface AiCoachPayload {
  summary: {
    totalTrades: number;
    wins: number;
    losses: number;
    open: number;
    winRate: number;
    netPnlSol: number;
    averagePnlPct: number;
  };
  trades: Array<{
    token: string;
    symbol: string;
    outcome: TradeReview['outcome'];
    pnlSol: number;
    pnlPct: number;
    solInvested: number;
    solReturned: number;
    feesSol: number;
    entryTime: string;
    exitTime?: string;
    entryReason: string;
    exitReason: string;
    didRight: string[];
    didWrong: string[];
    nextAction: string;
  }>;
}

export function buildAiCoachPayload(reviews: TradeReview[], summary: ReviewSummary): AiCoachPayload {
  return {
    summary: {
      totalTrades: summary.totalTrades,
      wins: summary.wins,
      losses: summary.losses,
      open: summary.open,
      winRate: summary.winRate,
      netPnlSol: summary.netPnlSol,
      averagePnlPct: summary.averagePnlPct
    },
    trades: reviews.slice(0, 50).map((review) => ({
      token: review.trade.tokenName || review.trade.symbol,
      symbol: review.trade.symbol,
      outcome: review.outcome,
      pnlSol: review.pnlSol,
      pnlPct: review.pnlPct,
      solInvested: review.trade.solInvested,
      solReturned: review.trade.solReturned,
      feesSol: review.trade.feesSol,
      entryTime: review.trade.entryTime,
      exitTime: review.trade.exitTime,
      entryReason: review.trade.entryReason,
      exitReason: review.trade.exitReason,
      didRight: review.didRight,
      didWrong: review.didWrong,
      nextAction: review.nextAction
    }))
  };
}
