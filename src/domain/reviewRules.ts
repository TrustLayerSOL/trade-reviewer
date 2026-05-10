import type { CompletedTrade, TradeOutcome, TradeReview } from './trades';

const round = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export function reviewTrade(trade: CompletedTrade): TradeReview {
  const pnlSol = round(trade.solReturned - trade.solInvested - trade.feesSol);
  const pnlPct = trade.solInvested > 0 ? round((pnlSol / trade.solInvested) * 100, 2) : 0;
  const outcome = getOutcome(trade, pnlPct);
  const didRight = getRightMoves(trade, outcome, pnlPct);
  const didWrong = getWrongMoves(trade, outcome);

  return {
    trade,
    outcome,
    pnlSol,
    pnlPct,
    didRight,
    didWrong,
    nextAction: getNextAction(trade, outcome, didWrong)
  };
}

function getOutcome(trade: CompletedTrade, pnlPct: number): TradeOutcome {
  if (!trade.exitTime) return 'open';
  if (pnlPct >= 2) return 'win';
  if (pnlPct <= -2) return 'loss';
  return 'breakeven';
}

function getRightMoves(trade: CompletedTrade, outcome: TradeOutcome, pnlPct: number) {
  const notes: string[] = [];

  if (trade.entryReason.trim()) {
    notes.push('Had a clear entry reason recorded.');
  }

  if (outcome === 'win' && pnlPct >= 15) {
    notes.push('Took profit instead of letting the full move round-trip.');
  }

  if (trade.maxDrawdownPct > -20) {
    notes.push('Kept drawdown contained while the trade developed.');
  }

  if (outcome === 'loss' && trade.maxDrawdownPct > -25) {
    notes.push('Loss stayed inside a manageable range.');
  }

  return notes.length > 0 ? notes : ['Trade has enough data to review objectively.'];
}

function getWrongMoves(trade: CompletedTrade, outcome: TradeOutcome) {
  const notes: string[] = [];

  if (!trade.exitReason.trim() && outcome !== 'open') {
    notes.push('No exit reason was recorded.');
  }

  if (trade.maxDrawdownPct <= -35) {
    notes.push('Held through a deep drawdown before exiting.');
  }

  if (outcome === 'loss' && trade.peakGainPct >= 25) {
    notes.push('The trade had meaningful profit available before closing red.');
  }

  if (trade.feesSol > trade.solInvested * 0.04) {
    notes.push('Fees took too much of the position size.');
  }

  return notes;
}

function getNextAction(trade: CompletedTrade, outcome: TradeOutcome, didWrong: string[]) {
  if (didWrong.includes('Held through a deep drawdown before exiting.')) {
    return 'Define the invalidation level before entering and exit when it breaks.';
  }

  if (didWrong.includes('The trade had meaningful profit available before closing red.')) {
    return 'Scale out part of the position when the trade gives a strong early move.';
  }

  if (outcome === 'win') {
    return 'Repeat the setup, but write down the exit plan before buying.';
  }

  if (outcome === 'open') {
    return 'Decide the target and invalidation before adding more size.';
  }

  if (!trade.exitReason.trim()) {
    return 'Record the exit reason immediately after closing the trade.';
  }

  return 'Keep position size small until this setup shows repeatable results.';
}
