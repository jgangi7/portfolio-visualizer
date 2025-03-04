import axios from 'axios';
import { DailyStockData, StockPosition } from '../types/stock';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export const fetchStockPrice = async (ticker: string): Promise<number> => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: API_KEY,
      },
    });

    const price = parseFloat(response.data['Global Quote']['05. price']);
    return price;
  } catch (error) {
    console.error(`Error fetching stock price for ${ticker}:`, error);
    throw error;
  }
};

export const fetchDailyData = async (ticker: string): Promise<DailyStockData[]> => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: ticker,
        outputsize: 'compact',
        apikey: API_KEY,
      },
    });

    const timeSeries = response.data['Time Series (Daily)'];
    return Object.entries(timeSeries).map(([date, data]: [string, any]) => ({
      date,
      close: parseFloat(data['4. close']),
    }));
  } catch (error) {
    console.error(`Error fetching daily data for ${ticker}:`, error);
    throw error;
  }
};

const calculatePositionMetrics = (
  shares: number,
  purchasePrice: number,
  currentPrice: number
) => {
  const totalValue = shares * currentPrice;
  const costBasis = shares * purchasePrice;
  const gainLoss = totalValue - costBasis;
  const gainLossPercentage = (gainLoss / costBasis) * 100;

  return {
    totalValue,
    gainLoss,
    gainLossPercentage,
  };
};

export const updatePositionPrices = async (positions: StockPosition[]): Promise<StockPosition[]> => {
  try {
    const updatedPositions = await Promise.all(
      positions.map(async (position) => {
        const currentPrice = await fetchStockPrice(position.ticker);
        const { totalValue, gainLoss, gainLossPercentage } = calculatePositionMetrics(
          position.shares,
          position.purchasePrice,
          currentPrice
        );

        return {
          ...position,
          currentPrice,
          totalValue,
          gainLoss,
          gainLossPercentage,
        };
      })
    );

    return updatedPositions;
  } catch (error) {
    console.error('Error updating position prices:', error);
    throw error;
  }
}; 