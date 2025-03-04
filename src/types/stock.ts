export interface StockPosition {
  ticker: string;
  shares: number;
  purchasePrice: number;
  currentPrice?: number;
  totalValue?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
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