import type { TradeEvent } from './trades';

export interface TokenMetadata {
  tokenMint: string;
  symbol?: string;
  tokenName?: string;
  tokenImageUrl?: string;
}

export function enrichTradeEventsWithMetadata(events: TradeEvent[], metadata: TokenMetadata[]) {
  const metadataByMint = new Map(metadata.map((item) => [item.tokenMint, item]));

  return events.map((event) => {
    const token = metadataByMint.get(event.tokenMint);
    if (!token) return event;

    return {
      ...event,
      symbol: token.symbol || event.symbol,
      tokenName: token.tokenName || event.tokenName,
      tokenImageUrl: token.tokenImageUrl || event.tokenImageUrl
    };
  });
}
