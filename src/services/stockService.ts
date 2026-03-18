import axios from 'axios';
import { DailyStockData, StockPosition } from '../types/stock';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// --- Hourly rate limit tracking (5 calls/hour on free tier) ---
const RATE_LIMIT_KEY = 'av_call_timestamps';
const MAX_CALLS_PER_HOUR = 5;

function getCallTimestamps(): number[] {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return [];
    const timestamps: number[] = JSON.parse(stored);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return timestamps.filter(t => t > oneHourAgo);
  } catch {
    return [];
  }
}

function recordApiCall() {
  const timestamps = getCallTimestamps();
  timestamps.push(Date.now());
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
}

export function getRemainingCalls(): number {
  return Math.max(0, MAX_CALLS_PER_HOUR - getCallTimestamps().length);
}

export function getMinutesUntilReset(): number {
  const timestamps = getCallTimestamps();
  if (timestamps.length < MAX_CALLS_PER_HOUR) return 0;
  const oldest = Math.min(...timestamps);
  const resetTime = oldest + 60 * 60 * 1000;
  return Math.ceil((resetTime - Date.now()) / 60000);
}

function checkRateLimit() {
  const timestamps = getCallTimestamps();
  if (timestamps.length >= MAX_CALLS_PER_HOUR) {
    const minutes = getMinutesUntilReset();
    throw new Error(`API rate limit reached (5/hour). Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
  }
}

// Queue system for API calls (sequential, no artificial delay needed — limit is hourly)
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
        checkRateLimit();

        const response = await axios.get(BASE_URL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: ticker,
            apikey: API_KEY,
          },
          timeout: 10000,
        });

        // Check for API limit message from server
        if (response.data.Note) {
          throw new Error('API call frequency limit reached');
        }

        if (response.data['Error Message']) {
          throw new Error(`Invalid ticker: ${ticker}`);
        }

        const quote = response.data['Global Quote'];
        if (!quote || !quote['05. price']) {
          throw new Error(`No price data available for ${ticker}`);
        }

        const price = parseFloat(quote['05. price']);
        if (isNaN(price) || price <= 0) {
          throw new Error('Invalid price value received');
        }

        recordApiCall();
        resolve(price);
      } catch (error) {
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