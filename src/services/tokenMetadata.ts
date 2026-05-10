import type { TokenMetadata } from '../domain/tokenMetadata';

interface HeliusAsset {
  id?: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
    links?: {
      image?: string;
    };
    files?: Array<{
      cdn_uri?: string;
      uri?: string;
    }>;
  };
}

interface HeliusAssetBatchResponse {
  result?: HeliusAsset[];
}

const METADATA_BATCH_SIZE = 100;

export async function fetchTokenMetadata(tokenMints: string[], apiKey: string): Promise<TokenMetadata[]> {
  const uniqueMints = [...new Set(tokenMints.filter(Boolean))];
  if (uniqueMints.length === 0) return [];
  if (!apiKey.trim()) return [];

  const batches = chunk(uniqueMints, METADATA_BATCH_SIZE);
  const results = await Promise.all(batches.map((batch) => fetchMetadataBatch(batch, apiKey)));
  return results.flat();
}

async function fetchMetadataBatch(tokenMints: string[], apiKey: string): Promise<TokenMetadata[]> {
  const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'trade-reviewer-token-metadata',
      method: 'getAssetBatch',
      params: {
        ids: tokenMints,
        options: { showFungible: true }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Helius metadata request failed with status ${response.status}`);
  }

  const data = (await response.json()) as HeliusAssetBatchResponse;
  return (data.result ?? []).flatMap(toTokenMetadata);
}

function toTokenMetadata(asset: HeliusAsset): TokenMetadata[] {
  if (!asset.id) return [];

  const metadata = asset.content?.metadata;
  return [
    {
      tokenMint: asset.id,
      symbol: metadata?.symbol?.trim() || undefined,
      tokenName: metadata?.name?.trim() || undefined,
      tokenImageUrl: imageUrl(asset)
    }
  ];
}

function imageUrl(asset: HeliusAsset) {
  return (
    asset.content?.links?.image ||
    asset.content?.files?.find((file) => file.cdn_uri)?.cdn_uri ||
    asset.content?.files?.find((file) => file.uri)?.uri ||
    undefined
  );
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
