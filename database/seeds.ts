import assets from '@/data/seed/assets.json';
import balances from '@/data/seed/balances.json';
import markets from '@/data/seed/markets.json';
import orderBookUSDC from '@/data/seed/orderbooks/USDC-NGN.json';
import orderBookUSDT from '@/data/seed/orderbooks/USDT-NGN.json';
import tradesUSDC from '@/data/seed/trades/USDC-NGN.json';
import tradesUSDT from '@/data/seed/trades/USDT-NGN.json';
import { getDatabase } from './index';

/**
 * Check if database has been seeded
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  const database = await getDatabase();
  try {
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM markets'
    );
    if (result && result.count > 0) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

/**
 * Seed database with initial data from JSON files
 */
export async function seedDatabase(): Promise<void> {
  if (await isDatabaseSeeded()) {
    return;
  }
  const database = await getDatabase();
  
  
  // Use transaction for atomicity
  try {
    await database.execAsync('BEGIN TRANSACTION');
    // Insert markets
    for (const market of markets) {
      await database.runAsync(
        'INSERT INTO markets (id, base, quote, tickSize, minOrderSize, initialLastPrice, initialChange24h) VALUES (?, ?, ?, ?, ?, ?, ?)',
        market.marketId,
        market.base,
        market.quote,
        market.tickSize,
        market.minOrderSize,
        market.initialLastPrice,
        market.initialChange24h
      );
    }
    
    // Insert assets
    for (const asset of assets) {
      await database.runAsync(
        'INSERT INTO assets (id, decimals, description) VALUES (?, ?, ?)',
        asset.assetId,
        asset.decimals,
        asset.description
      );
    }
    
    // Insert balances
    for (const balance of balances) {
      await database.runAsync(
        'INSERT INTO balances (assetId, available, locked) VALUES (?, ?, ?)',
        balance.asset,
        balance.available,
        balance.locked
      );
    }
  
    
    // Insert USDC-NGN order book
    for (const [price, size] of orderBookUSDC.bids) {
      await database.runAsync(
        'INSERT INTO orderBookLevels (marketId, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookUSDC.market,
        'bid',
        price,
        size
      );
    }
    for (const [price, size] of orderBookUSDC.asks) {
      await database.runAsync(
        'INSERT INTO orderBookLevels (marketId, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookUSDC.market,
        'ask',
        price,
        size
      );
    }
    
    // Insert USDT-NGN order book
    for (const [price, size] of orderBookUSDT.bids) {
      await database.runAsync(
        'INSERT INTO orderBookLevels (marketId, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookUSDT.market,
        'bid',
        price,
        size
      );
    }
    for (const [price, size] of orderBookUSDT.asks) {
      await database.runAsync(
        'INSERT INTO orderBookLevels (marketId, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookUSDT.market,
        'ask',
        price,
        size
      );
    }
    
      // Insert initial trades
    
    // Insert USDC-NGN trades
    for (const trade of tradesUSDC) {
      await database.runAsync(
        'INSERT OR IGNORE INTO trades (id, marketId, price, size, side, ts) VALUES (?, ?, ?, ?, ?, ?)',
        trade.tradeId,
        trade.market,
        trade.price,
        trade.size,
        trade.side,
        trade.ts
      );
    }
    
    // Insert USDT-NGN trades
    for (const trade of tradesUSDT) {
      await database.runAsync(
        'INSERT OR IGNORE INTO trades (id, marketId, price, size, side, ts) VALUES (?, ?, ?, ?, ?, ?)',
        trade.tradeId,
        trade.market,
        trade.price,
        trade.size,
        trade.side,
        trade.ts
      );
    }
    
    await database.execAsync('COMMIT');
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
}
