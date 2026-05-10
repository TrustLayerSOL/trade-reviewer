import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHeliusTransactions } from './helius';

describe('fetchHeliusTransactions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests wallet token-account history and paginates by signature', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => Array.from({ length: 100 }, (_, index) => ({ signature: `sig-${index}` }))
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ signature: 'sig-100' }]
      });
    vi.stubGlobal('fetch', fetch);

    const transactions = await fetchHeliusTransactions('Wallet111', 'helius-key', 101);

    expect(transactions).toHaveLength(101);
    const firstUrl = new URL(fetch.mock.calls[0][0]);
    expect(firstUrl.searchParams.get('token-accounts')).toBe('balanceChanged');
    expect(firstUrl.searchParams.get('sort-order')).toBe('desc');
    expect(firstUrl.searchParams.get('type')).toBe('SWAP');
    expect(firstUrl.searchParams.get('limit')).toBe('100');

    const secondUrl = new URL(fetch.mock.calls[1][0]);
    expect(secondUrl.searchParams.get('before-signature')).toBe('sig-99');
    expect(secondUrl.searchParams.get('limit')).toBe('1');
  });

  it('keeps paginating when Helius returns a short non-empty page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ signature: 'sig-0' }, { signature: 'sig-1' }]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
    vi.stubGlobal('fetch', fetch);

    const transactions = await fetchHeliusTransactions('Wallet111', 'helius-key', 10);

    expect(transactions).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
    const secondUrl = new URL(fetch.mock.calls[1][0]);
    expect(secondUrl.searchParams.get('before-signature')).toBe('sig-1');
  });
});
