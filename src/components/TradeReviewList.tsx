import type { TradeReview } from '../domain/trades';

interface TradeReviewListProps {
  reviews: TradeReview[];
  selectedTradeIds?: ReadonlySet<string>;
  onTradeSelectionChange?: (tradeId: string, selected: boolean) => void;
}

export function TradeReviewList({ reviews, selectedTradeIds, onTradeSelectionChange }: TradeReviewListProps) {
  if (reviews.length === 0) {
    return (
      <section className="empty-state">
        <h2>No trades loaded</h2>
        <p>Fetch the wallet, import a CSV, or load the sample set to see the review.</p>
      </section>
    );
  }

  return (
    <section className="trade-list" aria-label="Trade reviews">
      {reviews.map((review) => {
        const displayName = tokenDisplayName(review.trade);
        const selected = selectedTradeIds?.has(review.trade.id) ?? false;

        return (
        <article className={`trade-card${selected ? ' selected' : ''}`} key={review.trade.id}>
          <div className="trade-card-header">
            <div className="token-title">
              {review.trade.tokenImageUrl ? (
                <img
                  src={review.trade.tokenImageUrl}
                  alt={`${displayName} token image`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div>
                <h2>{displayName}</h2>
                <p>
                  {review.trade.tokenName ? `${review.trade.symbol} · ` : ''}
                  {formatDate(review.trade.entryTime)}
                </p>
              </div>
            </div>
            <div className="trade-card-actions">
              {onTradeSelectionChange ? (
                <label className="trade-select">
                  <input
                    type="checkbox"
                    checked={selected}
                    aria-label={`Select ${displayName} for AI review`}
                    onChange={(event) => onTradeSelectionChange(review.trade.id, event.currentTarget.checked)}
                  />
                  AI
                </label>
              ) : null}
              <span className={`outcome ${review.outcome}`}>{review.outcome}</span>
            </div>
          </div>
          <div className="trade-numbers">
            <span>In: {review.trade.solInvested.toFixed(3)} SOL</span>
            <span>Out: {review.trade.solReturned.toFixed(3)} SOL</span>
            <strong className={review.pnlSol >= 0 ? 'positive' : 'negative'}>
              {review.pnlSol >= 0 ? '+' : ''}
              {review.pnlSol.toFixed(3)} SOL
            </strong>
          </div>
          <div className="review-columns">
            <ReviewColumn title="Right" items={review.didRight} />
            <ReviewColumn title="Wrong" items={review.didWrong.length ? review.didWrong : ['No major mistake found in the available data.']} />
          </div>
          <p className="next-action">{review.nextAction}</p>
        </article>
        );
      })}
    </section>
  );
}

function ReviewColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function tokenDisplayName(trade: TradeReview['trade']) {
  return trade.tokenName || trade.symbol;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}
