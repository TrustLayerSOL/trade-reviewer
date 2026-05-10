import type { TradeEvent, TradeSide } from './trades';

const requiredHeaders = [
  'timestamp',
  'side',
  'symbol',
  'tokenMint',
  'tokenAmount',
  'solAmount',
  'feeSol',
  'signature'
];

export function parseTradeCsv(csv: string): TradeEvent[] {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .filter((row) => row.trim().length > 0);

  if (rows.length < 2) return [];

  const headers = splitCsvRow(rows[0]).map((header) => header.trim());
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`CSV is missing required column "${header}"`);
    }
  }

  return rows.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    const values = splitCsvRow(row);
    const record = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex]?.trim() ?? '']));
    const side = parseSide(record.side, rowNumber);

    return {
      id: record.signature || `${record.tokenMint}-${record.timestamp}-${side}`,
      signature: record.signature,
      tokenMint: requiredString(record.tokenMint, 'tokenMint', rowNumber),
      symbol: requiredString(record.symbol, 'symbol', rowNumber).toUpperCase(),
      side,
      timestamp: requiredString(record.timestamp, 'timestamp', rowNumber),
      tokenAmount: requiredNumber(record.tokenAmount, 'tokenAmount', rowNumber),
      solAmount: requiredNumber(record.solAmount, 'solAmount', rowNumber),
      feeSol: requiredNumber(record.feeSol, 'feeSol', rowNumber),
      source: 'csv'
    };
  });
}

function parseSide(value: string, rowNumber: number): TradeSide {
  if (value === 'buy' || value === 'sell') return value;
  throw new Error(`Row ${rowNumber} has invalid side "${value}"`);
}

function requiredString(value: string, field: string, rowNumber: number) {
  if (value.trim()) return value.trim();
  throw new Error(`Row ${rowNumber} is missing ${field}`);
}

function requiredNumber(value: string, field: string, rowNumber: number) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  throw new Error(`Row ${rowNumber} has invalid ${field}`);
}

function splitCsvRow(row: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}
