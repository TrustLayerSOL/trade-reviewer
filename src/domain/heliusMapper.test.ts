import { describe, expect, it } from 'vitest';
import { mapHeliusTransactions } from './heliusMapper';

const wallet = 'Wallet111';

describe('mapHeliusTransactions', () => {
  it('maps a SOL-to-token swap as a buy', () => {
    const events = mapHeliusTransactions(wallet, [
      {
        signature: 'buy-sig',
        timestamp: 1770000000,
        fee: 5000,
        events: {
          swap: {
            nativeInput: { account: wallet, amount: '1500000000' },
            tokenOutputs: [
              {
                userAccount: wallet,
                mint: 'MintBuy',
                rawTokenAmount: { tokenAmount: '2500000000', decimals: 6 }
              }
            ]
          }
        }
      }
    ]);

    expect(events).toEqual([
      expect.objectContaining({
        signature: 'buy-sig',
        tokenMint: 'MintBuy',
        side: 'buy',
        tokenAmount: 2500,
        solAmount: 1.5,
        feeSol: 0.000005,
        source: 'helius'
      })
    ]);
  });

  it('maps a token-to-SOL swap as a sell', () => {
    const events = mapHeliusTransactions(wallet, [
      {
        signature: 'sell-sig',
        timestamp: 1770000300,
        fee: 7000,
        events: {
          swap: {
            nativeOutput: { account: wallet, amount: '2100000000' },
            tokenInputs: [
              {
                userAccount: wallet,
                mint: 'MintSell',
                rawTokenAmount: { tokenAmount: '1000000000', decimals: 6 }
              }
            ]
          }
        }
      }
    ]);

    expect(events[0]).toMatchObject({
      signature: 'sell-sig',
      tokenMint: 'MintSell',
      side: 'sell',
      tokenAmount: 1000,
      solAmount: 2.1,
      feeSol: 0.000007
    });
  });
});
