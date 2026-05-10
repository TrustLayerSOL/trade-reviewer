import type { ReviewSummary } from '../domain/summary';

interface SummaryCardsProps {
  summary: ReviewSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="summary-grid" aria-label="Review summary">
      <Metric label="Net PnL" value={`${summary.netPnlSol.toFixed(3)} SOL`} tone={summary.netPnlSol >= 0 ? 'good' : 'bad'} />
      <Metric label="Win rate" value={`${summary.winRate.toFixed(1)}%`} />
      <Metric label="Trades" value={String(summary.totalTrades)} />
      <Metric label="Avg PnL" value={`${summary.averagePnlPct.toFixed(1)}%`} />
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return (
    <div className={`metric ${tone ?? ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
