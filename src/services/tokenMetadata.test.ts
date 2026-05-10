import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTokenMetadata } from './tokenMetadata';

describe('fetchTokenMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps Helius asset metadata into token metadata', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: '2.0',
        result: [
          {
            id: 'MintA',
            content: {
              metadata: { name: 'Moon Runner', symbol: 'MOON' },
              links: { image: 'https://example.com/moon.png' }
            }
          }
        ]
      })
    });
    vi.stubGlobal('fetch', fetch);

    const metadata = await fetchTokenMetadata(['MintA'], 'helius-key');

    expect(metadata).toEqual([
      {
        tokenMint: 'MintA',
        symbol: 'MOON',
        tokenName: 'Moon Runner',
        tokenImageUrl: 'https://example.com/moon.png'
      }
    ]);
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toContain('https://mainnet.helius-rpc.com/');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      method: 'getAssetBatch',
      params: {
        ids: ['MintA'],
        options: { showFungible: true }
      }
    });
  });
});
