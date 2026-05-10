import type { HeliusTransaction } from '../domain/heliusMapper';

const PAGE_LIMIT = 100;
const DEFAULT_MAX_TRANSACTIONS = 300;

export async function fetchHeliusTransactions(walletAddress: string, apiKey: string, maxTransactions = DEFAULT_MAX_TRANSACTIONS) {
  if (!apiKey.trim()) {
    throw new Error('Add a Helius API key before fetching wallet history.');
  }

  const transactions: HeliusTransaction[] = [];
  let beforeSignature = '';

  while (transactions.length < maxTransactions) {
    const pageLimit = Math.min(PAGE_LIMIT, maxTransactions - transactions.length);
    const page = await fetchHeliusTransactionPage(walletAddress, apiKey, pageLimit, beforeSignature);
    if (page.length === 0) break;

    transactions.push(...page);
    const nextBeforeSignature = page.at(-1)?.signature ?? '';
    if (!nextBeforeSignature || nextBeforeSignature === beforeSignature) break;
    beforeSignature = nextBeforeSignature;
  }

  return transactions.slice(0, maxTransactions);
}

async function fetchHeliusTransactionPage(
  walletAddress: string,
  apiKey: string,
  limit: number,
  beforeSignature: string
) {
  const url = new URL(`https://api-mainnet.helius-rpc.com/v0/addresses/${walletAddress}/transactions`);
  url.searchParams.set('api-key', apiKey.trim());
  url.searchParams.set('type', 'SWAP');
  url.searchParams.set('token-accounts', 'balanceChanged');
  url.searchParams.set('sort-order', 'desc');
  url.searchParams.set('limit', String(limit));
  if (beforeSignature) {
    url.searchParams.set('before-signature', beforeSignature);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Helius request failed with status ${response.status}`);
  }

  return (await response.json()) as HeliusTransaction[];
}
