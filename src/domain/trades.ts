export type TradeSource = 'helius' | 'csv' | 'sample';

export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'open';

export interface CompletedTrade {
  id: string;
  tokenMint: string;
  symbol: string;
  entryTime: string;
  exitTime?: string;
  solInvested: number;
  solReturned: number;
  feesSol: number;
  maxDrawdownPct: number;
  peakGainPct: number;
  entryReason: string;
  exitReason: string;
  source: TradeSource;
}

export interface TradeReview {
  trade: CompletedTrade;
  outcome: TradeOutcome;
  pnlSol: number;
  pnlPct: number;
  didRight: string[];
  didWrong: string[];
  nextAction: string;
}
