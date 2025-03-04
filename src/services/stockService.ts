import axios from 'axios';
import { DailyStockData, StockPosition } from '../types/stock';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Queue system for API calls
class ApiQueue {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;

  async add(task: () => Promise<void>) {
    this.queue.push(task);
    if (!this.processing) {
      this.processing = true;
      await this.processQueue();
    }
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
        // Alpha Vantage free tier allows 5 API calls per minute
        await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds between calls
      }
    }
    this.processing = false;
  }
}

const apiQueue = new ApiQueue();

export const fetchStockPrice = async (ticker: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    apiQueue.add(async () => {
      try {
        const response = await axios.get(BASE_URL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: ticker,
            apikey: API_KEY,
          },
          timeout: 10000,
        });

        // Check for API limit message
        if (response.data.Note) {
          console.warn('API rate limit message:', response.data.Note);
          throw new Error('API call frequency limit reached');
        }

        // Check for error messages
        if (response.data['Error Message']) {
          throw new Error(response.data['Error Message']);
        }

        const quote = response.data['Global Quote'];
        if (!quote || !quote['05. price']) {
          throw new Error('No price data available');
        }

        const price = parseFloat(quote['05. price']);
        if (isNaN(price) || price <= 0) {
          throw new Error('Invalid price value received');
        }

        console.log(`Successfully fetched price for ${ticker}: $${price}`);
        resolve(price);
      } catch (error) {
        console.error(`Failed to fetch price for ${ticker}:`, error);
        reject(error);
      }
    });
  });
};

export const fetchDailyData = async (ticker: string): Promise<DailyStockData[]> => {
  return new Promise((resolve, reject) => {
    apiQueue.add(async () => {
      try {
        const response = await axios.get(BASE_URL, {
          params: {
            function: 'TIME_SERIES_DAILY',
            symbol: ticker,
            outputsize: 'compact',
            apikey: API_KEY,
          },
          timeout: 10000,
        });

        // Check for API limit message
        if (response.data.Note) {
          throw new Error('API call frequency limit reached');
        }

        // Check for error messages
        if (response.data['Error Message']) {
          throw new Error(response.data['Error Message']);
        }

        const timeSeries = response.data['Time Series (Daily)'];
        if (!timeSeries) {
          throw new Error('No daily data available');
        }

        const dailyData = Object.entries(timeSeries).map(([date, data]: [string, any]) => ({
          date,
          close: parseFloat(data['4. close']),
        }));

        resolve(dailyData);
      } catch (error) {
        console.error(`Error fetching daily data for ${ticker}:`, error);
        reject(error);
      }
    });
  });
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
  const updatedPositions: StockPosition[] = [];

  // Process positions sequentially to respect API rate limits
  for (const position of positions) {
    try {
      const currentPrice = await fetchStockPrice(position.ticker);
      const { totalValue, gainLoss, gainLossPercentage } = calculatePositionMetrics(
        position.shares,
        position.purchasePrice,
        currentPrice
      );

      updatedPositions.push({
        ...position,
        currentPrice,
        totalValue,
        gainLoss,
        gainLossPercentage,
      });
    } catch (error) {
      console.warn(`Using fallback price for ${position.ticker}`);
      const fallbackPrice = position.currentPrice || position.purchasePrice;
      const { totalValue, gainLoss, gainLossPercentage } = calculatePositionMetrics(
        position.shares,
        position.purchasePrice,
        fallbackPrice
      );

      updatedPositions.push({
        ...position,
        currentPrice: fallbackPrice,
        totalValue,
        gainLoss,
        gainLossPercentage,
      });
    }
  }

  return updatedPositions;
}; 