import type { TradeEvent } from './trades';

const LAMPORTS_PER_SOL = 1_000_000_000;

interface RawTokenAmount {
  tokenAmount: string;
  decimals: number;
}

interface HeliusTokenSwapItem {
  userAccount?: string;
  mint: string;
  rawTokenAmount: RawTokenAmount;
}

interface HeliusNativeSwapItem {
  account?: string;
  amount: string;
}

interface HeliusSwapEvent {
  nativeInput?: HeliusNativeSwapItem;
  nativeOutput?: HeliusNativeSwapItem;
  tokenInputs?: HeliusTokenSwapItem[];
  tokenOutputs?: HeliusTokenSwapItem[];
}

export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  fee?: number;
  events?: {
    swap?: HeliusSwapEvent;
  };
}

export function mapHeliusTransactions(walletAddress: string, transactions: HeliusTransaction[]): TradeEvent[] {
  return transactions.flatMap((transaction) => mapHeliusTransaction(walletAddress, transaction));
}

function mapHeliusTransaction(walletAddress: string, transaction: HeliusTransaction): TradeEvent[] {
  const swap = transaction.events?.swap;
  if (!swap) return [];

  const buyToken = swap.tokenOutputs?.find((token) => token.userAccount === walletAddress);
  const sellToken = swap.tokenInputs?.find((token) => token.userAccount === walletAddress);
  const solSpent = amountToSol(swap.nativeInput?.amount ?? '0');
  const solReceived = amountToSol(swap.nativeOutput?.amount ?? '0');

  if (buyToken && solSpent > 0) {
    return [toEvent(transaction, buyToken, 'buy', solSpent)];
  }

  if (sellToken && solReceived > 0) {
    return [toEvent(transaction, sellToken, 'sell', solReceived)];
  }

  return [];
}

function toEvent(
  transaction: HeliusTransaction,
  token: HeliusTokenSwapItem,
  side: TradeEvent['side'],
  solAmount: number
): TradeEvent {
  return {
    id: `${transaction.signature}-${token.mint}-${side}`,
    signature: transaction.signature,
    tokenMint: token.mint,
    symbol: shortSymbol(token.mint),
    side,
    timestamp: new Date(transaction.timestamp * 1000).toISOString(),
    tokenAmount: rawTokenToNumber(token.rawTokenAmount),
    solAmount,
    feeSol: amountToSol(String(transaction.fee ?? 0)),
    source: 'helius'
  };
}

function rawTokenToNumber(raw: RawTokenAmount) {
  return Number(raw.tokenAmount) / 10 ** raw.decimals;
}

function amountToSol(lamports: string) {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

function shortSymbol(mint: string) {
  return `${mint.slice(0, 4).toUpperCase()}...${mint.slice(-4).toUpperCase()}`;
}
