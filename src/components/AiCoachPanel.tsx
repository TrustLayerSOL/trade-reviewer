import { BrainCircuit } from 'lucide-react';
import type { AiCoachReview } from '../domain/aiCoach';

interface AiCoachPanelProps {
  review: AiCoachReview | null;
  loading: boolean;
  disabled: boolean;
  error?: string;
  selectionCount: number;
  onReview: () => void;
}

export function AiCoachPanel({ review, loading, disabled, error, selectionCount, onReview }: AiCoachPanelProps) {
  const selectionLabel = selectionCount === 1 ? '1 selected trade' : `${selectionCount} selected trades`;

  return (
    <section className="panel ai-coach-panel" aria-label="AI coach review">
      <div className="ai-coach-header">
        <div>
          <span className="section-label">
            <BrainCircuit size={16} />
            AI coach
          </span>
          <h2>{review?.headline ?? 'Session readout'}</h2>
          <p className="ai-selection-count">{selectionLabel}</p>
        </div>
        <button type="button" onClick={onReview} disabled={disabled || loading}>
          <BrainCircuit size={17} />
          {loading ? 'Reviewing' : 'Review with AI'}
        </button>
      </div>

      {error ? <p className="ai-error" role="alert">{error}</p> : null}

      {review ? (
        <div className="ai-coach-body">
          <p>{review.summary}</p>
          <CoachList title="Pattern" items={review.patterns} />
          <CoachList title="Right" items={review.strengths} />
          <CoachList title="Wrong" items={review.mistakes} />
          <p className="next-action">{review.nextTradeRule}</p>
          <CoachList title="Risk" items={review.riskWarnings} />
        </div>
      ) : (
        <p className="ai-placeholder">
          Select one or more trades, then run the AI coach for a focused readout.
        </p>
      )}
    </section>
  );
}

function CoachList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="ai-coach-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
