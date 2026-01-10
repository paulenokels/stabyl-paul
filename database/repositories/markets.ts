import type { Market } from '@/interfaces/database';
import { getDatabase } from '../index';

export interface MarketWithPrice extends Market {
  lastPrice: number | null;
  change24h: number;
  isFavorite: boolean;
}

/**
 * Get all markets with their last price and 24h change
 */
export async function getMarketsWithPrice(): Promise<MarketWithPrice[]> {
  const database = await getDatabase();
  
  // Get all markets with their last trade price and initial change
  const markets = await database.getAllAsync<Market & { lastPrice: number | null; change24h: number }>(`
    SELECT 
      m.id as id,
      m.base,
      m.quote,
      m.tickSize,
      m.minOrderSize,
      m.initialLastPrice,
      m.initialChange24h,
      COALESCE((
        SELECT price 
        FROM trades 
        WHERE marketId = m.id 
        ORDER BY ts DESC 
        LIMIT 1
      ), m.initialLastPrice) as lastPrice,
      m.initialChange24h as change24h
    FROM markets m
    ORDER BY m.id
  `);
  
  // Get favorites
  const favorites = await database.getAllAsync<{ marketId: string }>(`
    SELECT marketId FROM favorites
  `);
  
  const favoriteSet = new Set(favorites.map(f => f.marketId));
  
  return markets.map(market => ({
    ...market,
    isFavorite: favoriteSet.has(market.id),
  }));
}

/**
 * Toggle favorite status for a market
 */
export async function toggleFavorite(marketId: string): Promise<boolean> {
  const database = await getDatabase();
  
  // Check if already favorite
  const existing = await database.getFirstAsync<{ marketId: string }>(
    'SELECT marketId FROM favorites WHERE marketId = ?',
    marketId
  );
  
  if (existing) {
    // Remove from favorites
    await database.runAsync('DELETE FROM favorites WHERE marketId = ?', marketId);
    return false;
  } else {
    // Add to favorites
    await database.runAsync('INSERT INTO favorites (marketId) VALUES (?)', marketId);
    return true;
  }
}

/**
 * Check if a market is favorited
 */
export async function isFavorite(marketId: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorites WHERE marketId = ?',
    marketId
  );
  return result?.count && result.count > 0 ? true : false;
}

/**
 * Get last price for a market
 */
export async function getLastPrice(marketId: string): Promise<number | null> {
  const database = await getDatabase();
  
  // Get the most recent trade price
  const trade = await database.getFirstAsync<{ price: number }>(
    'SELECT price FROM trades WHERE marketId = ? ORDER BY ts DESC LIMIT 1',
    marketId
  );
  
  if (trade) {
    return trade.price;
  }
  
  // Fallback to initial price
  const market = await database.getFirstAsync<{ initialLastPrice: number }>(
    'SELECT initialLastPrice FROM markets WHERE id = ?',
    marketId
  );
  
  return market ? market.initialLastPrice : null;
}
