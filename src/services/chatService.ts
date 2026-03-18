import Anthropic from '@anthropic-ai/sdk';
import { StockPosition } from '../types/stock';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function buildPortfolioSystemPrompt(positions: StockPosition[]): string {
  const totalValue = positions.reduce((s, p) => s + (p.totalValue ?? p.shares * p.purchasePrice), 0);
  const totalCost = positions.reduce((s, p) => s + p.shares * p.purchasePrice, 0);
  const gainLoss = totalValue - totalCost;
  const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

  const rows = positions.map(p => {
    const value = p.totalValue ?? p.shares * p.purchasePrice;
    const pct = p.gainLossPercentage ?? 0;
    const currentPrice = p.currentPrice ?? p.purchasePrice;
    const sector = p.sector ? ` [${p.sector}]` : '';
    return `- ${p.ticker}${sector}: ${p.shares} shares, avg cost $${p.purchasePrice.toFixed(2)}, current $${currentPrice.toFixed(2)}, value $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
  }).join('\n');

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `You are a knowledgeable financial assistant helping a user analyze their stock portfolio.

Current portfolio as of today:

Total Value: $${fmt(totalValue)}
Total Gain/Loss: $${fmt(gainLoss)} (${gainLossPct >= 0 ? '+' : ''}${gainLossPct.toFixed(2)}%)
Positions (${positions.length}):
${rows}

Help with portfolio analysis, diversification, risk, sector exposure, or general finance questions. Reference their holdings when relevant. Be concise and direct. For major financial decisions, remind users to consult a licensed financial advisor.`;
}

export async function streamChatMessage(
  messages: Anthropic.MessageParam[],
  systemPrompt: string,
  onDelta: (text: string) => void,
): Promise<void> {
  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onDelta(event.delta.text);
    }
  }
}
