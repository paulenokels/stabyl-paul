import type { OrderBookLevel, Trade } from '@/interfaces/database';
import { getDatabase } from '../index';

/**
 * Get top N bids for a market (sorted by price descending)
 */
export async function getTopBids(marketId: string, limit: number = 10): Promise<OrderBookLevel[]> {
  const database = await getDatabase();
  
  const bids = await database.getAllAsync<OrderBookLevel>(
    `SELECT *
    FROM orderBookLevels
    WHERE marketId = ? AND side = 'bid'
    ORDER BY price DESC
    LIMIT ?`,
    marketId,
    limit
  );
  
  return bids;
}

/**
 * Get top N asks for a market (sorted by price ascending)
 */
export async function getTopAsks(marketId: string, limit: number = 10): Promise<OrderBookLevel[]> {
  const database = await getDatabase();
  
  const asks = await database.getAllAsync<OrderBookLevel>(
    `SELECT marketId, side, price, size
    FROM orderBookLevels
    WHERE marketId = ? AND side = 'ask'
    ORDER BY price ASC
    LIMIT ?`,
    marketId,
    limit
  );
  
  return asks;
}

/**
 * Get recent trades for a market
 */
export async function getRecentTrades(marketId: string, limit: number = 20): Promise<Trade[]> {
  const database = await getDatabase();
  
  const trades = await database.getAllAsync<Trade>(
    `SELECT *
    FROM trades
    WHERE marketId = ?
    ORDER BY ts DESC
    LIMIT ?`,
    marketId,
    limit
  );
  
  return trades;
}
