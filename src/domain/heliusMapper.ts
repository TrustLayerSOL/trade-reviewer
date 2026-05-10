import type { TradeEvent } from './trades';

const LAMPORTS_PER_SOL = 1_000_000_000;
const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';

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

interface HeliusNativeTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  amount: number;
}

interface HeliusTokenBalanceChange {
  userAccount?: string;
  tokenAccount?: string;
  mint: string;
  rawTokenAmount: RawTokenAmount;
}

interface HeliusAccountData {
  account: string;
  nativeBalanceChange?: number;
  tokenBalanceChanges?: HeliusTokenBalanceChange[];
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
  type?: string;
  nativeTransfers?: HeliusNativeTransfer[];
  accountData?: HeliusAccountData[];
  events?: {
    swap?: HeliusSwapEvent;
  };
}

export function mapHeliusTransactions(walletAddress: string, transactions: HeliusTransaction[]): TradeEvent[] {
  return transactions.flatMap((transaction) => mapHeliusTransaction(walletAddress, transaction));
}

function mapHeliusTransaction(walletAddress: string, transaction: HeliusTransaction): TradeEvent[] {
  const swap = transaction.events?.swap;
  if (!swap) return mapTransferListSwap(walletAddress, transaction);

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

function mapTransferListSwap(walletAddress: string, transaction: HeliusTransaction): TradeEvent[] {
  const tokenChange = findLargestWalletTokenChange(walletAddress, transaction.accountData ?? []);
  if (!tokenChange) return [];

  const tokenAmount = rawTokenToNumber(tokenChange.rawTokenAmount);
  const solAmount = Math.abs(nativeTransferNetSol(walletAddress, transaction.nativeTransfers ?? []));
  if (tokenAmount === 0 || solAmount === 0) return [];

  return [
    toEvent(
      transaction,
      tokenChange,
      tokenAmount > 0 ? 'buy' : 'sell',
      solAmount
    )
  ];
}

function findLargestWalletTokenChange(walletAddress: string, accountData: HeliusAccountData[]) {
  const changes = accountData
    .flatMap((account) => account.tokenBalanceChanges ?? [])
    .filter((change) => change.userAccount === walletAddress)
    .filter((change) => change.mint !== WRAPPED_SOL_MINT)
    .filter((change) => rawTokenToNumber(change.rawTokenAmount) !== 0);

  return changes.sort(
    (left, right) =>
      Math.abs(rawTokenToNumber(right.rawTokenAmount)) - Math.abs(rawTokenToNumber(left.rawTokenAmount))
  )[0];
}

function nativeTransferNetSol(walletAddress: string, transfers: HeliusNativeTransfer[]) {
  const lamports = transfers.reduce((net, transfer) => {
    if (transfer.toUserAccount === walletAddress) return net + transfer.amount;
    if (transfer.fromUserAccount === walletAddress) return net - transfer.amount;
    return net;
  }, 0);

  return lamports / LAMPORTS_PER_SOL;
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
    tokenAmount: Math.abs(rawTokenToNumber(token.rawTokenAmount)),
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
