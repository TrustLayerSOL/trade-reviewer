import type { HeliusTransaction } from '../domain/heliusMapper';

const DEFAULT_LIMIT = 100;

export async function fetchHeliusTransactions(walletAddress: string, apiKey: string, limit = DEFAULT_LIMIT) {
  if (!apiKey.trim()) {
    throw new Error('Add a Helius API key before fetching wallet history.');
  }

  const url = new URL(`https://api-mainnet.helius-rpc.com/v0/addresses/${walletAddress}/transactions`);
  url.searchParams.set('api-key', apiKey.trim());
  url.searchParams.set('type', 'SWAP');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Helius request failed with status ${response.status}`);
  }

  return (await response.json()) as HeliusTransaction[];
}
