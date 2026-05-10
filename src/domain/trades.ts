export type TradeSource = 'helius' | 'csv' | 'sample';

export type TradeOutcome = 'win' | 'loss' | 'breakeven' | 'open';

export interface CompletedTrade {
  id: string;
  tokenMint: string;
  symbol: string;
  tokenName?: string;
  tokenImageUrl?: string;
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

export type TradeSide = 'buy' | 'sell';

export interface TradeEvent {
  id: string;
  signature: string;
  tokenMint: string;
  symbol: string;
  tokenName?: string;
  tokenImageUrl?: string;
  side: TradeSide;
  timestamp: string;
  tokenAmount: number;
  solAmount: number;
  feeSol: number;
  source: TradeSource;
}
