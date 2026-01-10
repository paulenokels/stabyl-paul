import type { Market } from '@/interfaces/database';
import { getDatabase } from './index';

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
      m.market_id as marketId,
      m.base,
      m.quote,
      m.tick_size as tickSize,
      m.min_order_size as minOrderSize,
      m.initial_last_price as initialLastPrice,
      m.initial_change_24h as initialChange24h,
      COALESCE((
        SELECT price 
        FROM trades 
        WHERE market = m.market_id 
        ORDER BY ts DESC 
        LIMIT 1
      ), m.initial_last_price) as lastPrice,
      m.initial_change_24h as change24h
    FROM markets m
    ORDER BY m.market_id
  `);
  
  // Get favorites
  const favorites = await database.getAllAsync<{ market_id: string }>(`
    SELECT market_id FROM favorites
  `);
  
  const favoriteSet = new Set(favorites.map(f => f.market_id));
  
  return markets.map(market => ({
    ...market,
    isFavorite: favoriteSet.has(market.marketId),
  }));
}

/**
 * Toggle favorite status for a market
 */
export async function toggleFavorite(marketId: string): Promise<boolean> {
  const database = await getDatabase();
  
  // Check if already favorite
  const existing = await database.getFirstAsync<{ market_id: string }>(
    'SELECT market_id FROM favorites WHERE market_id = ?',
    marketId
  );
  
  if (existing) {
    // Remove from favorites
    await database.runAsync('DELETE FROM favorites WHERE market_id = ?', marketId);
    return false;
  } else {
    // Add to favorites
    await database.runAsync('INSERT INTO favorites (market_id) VALUES (?)', marketId);
    return true;
  }
}

/**
 * Check if a market is favorited
 */
export async function isFavorite(marketId: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorites WHERE market_id = ?',
    marketId
  );
  return result ? result.count > 0 : false;
}

/**
 * Get last price for a market
 */
export async function getLastPrice(marketId: string): Promise<number | null> {
  const database = await getDatabase();
  
  // Get the most recent trade price
  const trade = await database.getFirstAsync<{ price: number }>(
    'SELECT price FROM trades WHERE market = ? ORDER BY ts DESC LIMIT 1',
    marketId
  );
  
  if (trade) {
    return trade.price;
  }
  
  // Fallback to initial price
  const market = await database.getFirstAsync<{ initial_last_price: number }>(
    'SELECT initial_last_price FROM markets WHERE market_id = ?',
    marketId
  );
  
  return market ? market.initial_last_price : null;
}
