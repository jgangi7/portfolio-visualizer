export interface StockPosition {
  ticker: string;
  shares: number;
  purchasePrice: number;
  currentPrice?: number;
  totalValue?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
  sector?: string; // user-assigned when ticker isn't in the built-in sector map
}

export interface DailyStockData {
  date: string;
  close: number;
}

export interface StockFormData {
  ticker: string;
  shares: number;
  purchasePrice: number;
} 