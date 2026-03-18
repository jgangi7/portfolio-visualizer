import { StockPosition } from '../types/stock';

export interface ParseResult {
  positions: StockPosition[];
  skipped: string[];
}

function detectSeparator(content: string): string {
  const sample = content.slice(0, 2000);
  const tabs = (sample.match(/\t/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  return tabs > commas ? '\t' : ',';
}

// Handles quoted CSV fields (e.g. "BRK.B" or "1,234.56")
function splitRow(row: string, sep: string): string[] {
  if (sep !== ',') {
    return row.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
  }
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function parsePortfolioCSV(content: string): ParseResult {
  const sep = detectSeparator(content);
  const lines = content.split(/\r?\n/);
  const skipped: string[] = [];

  // Find the data header row — must start with "Symbol" AND contain "quantity" and "price paid"
  // (there can be a filter summary row earlier that also starts with "Symbol")
  let headerIdx = -1;
  let colHeaders: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const row = splitRow(lines[i], sep).map(norm);
    if (row[0] === 'symbol' && row.some(c => c.includes('quantity')) && row.some(c => c.includes('price paid'))) {
      headerIdx = i;
      colHeaders = row;
      break;
    }
  }

  if (headerIdx === -1) {
    return {
      positions: [],
      skipped: ['Could not find a "Symbol" column header. Make sure this is a valid portfolio export.'],
    };
  }

  // Locate required columns by partial name match (handles slight wording differences)
  const find = (needle: string) => colHeaders.findIndex(c => c.includes(needle));

  const symbolIdx    = 0; // always first
  const lastPriceIdx = find('last price');
  const qtyIdx       = find('quantity');
  const pricePaidIdx = find('price paid');
  // Disambiguate "total gain $" vs "total gain %" by checking for $ and %
  const gainDollarIdx = colHeaders.findIndex(c => c.includes('total gain') && c.includes('$'));
  const gainPctIdx    = colHeaders.findIndex(c => c.includes('total gain') && c.includes('%'));
  const valueIdx      = colHeaders.findIndex(c => c.includes('value') && c.includes('$'));

  const positions: StockPosition[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const row = splitRow(line, sep);
    const rawSymbol = row[symbolIdx]?.trim().replace(/^"|"$/g, '');
    const symbol = rawSymbol?.toUpperCase();

    // Stop-words and empties
    if (!symbol || symbol === 'CASH' || symbol === 'TOTAL') continue;
    // If every cell is blank it's a spacer row
    if (row.every(c => !c.trim())) continue;
    // If the symbol looks like a section header (contains spaces + no numeric data), skip
    if (/\s/.test(symbol) && isNaN(parseFloat(row[qtyIdx]))) continue;

    const shares       = parseFloat(row[qtyIdx]);
    const purchasePrice = parseFloat(row[pricePaidIdx]);

    if (isNaN(shares) || shares <= 0 || isNaN(purchasePrice) || purchasePrice <= 0) {
      skipped.push(symbol);
      continue;
    }

    const currentPrice      = parseFloat(row[lastPriceIdx]) || purchasePrice;
    const totalValue        = parseFloat(row[valueIdx])     || shares * currentPrice;
    const gainLoss          = parseFloat(row[gainDollarIdx]) || 0;
    const gainLossPercentage = parseFloat(row[gainPctIdx])  || 0;

    positions.push({
      ticker: symbol,
      shares,
      purchasePrice,
      currentPrice,
      totalValue,
      gainLoss,
      gainLossPercentage,
    });
  }

  return { positions, skipped };
}
