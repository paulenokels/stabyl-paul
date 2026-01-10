import assets from '@/data/seed/assets.json';
import balances from '@/data/seed/balances.json';
import markets from '@/data/seed/markets.json';
import type { Asset, Balance, Market, Trade } from '@/interfaces/database';
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
  
  // Import seed data files
  const marketsData = markets as Market[];
  const assetsData = assets as Asset[];
  const balancesData = balances as Balance[];
  
  // Use transaction for atomicity
  try {
    await database.execAsync('BEGIN TRANSACTION');
    // Insert markets
    for (const market of marketsData) {
      await database.runAsync(
        'INSERT INTO markets (market_id, base, quote, tick_size, min_order_size, initial_last_price, initial_change_24h) VALUES (?, ?, ?, ?, ?, ?, ?)',
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
    for (const asset of assetsData) {
      await database.runAsync(
        'INSERT INTO assets (asset_id, decimals, description) VALUES (?, ?, ?)',
        asset.assetId,
        asset.decimals,
        asset.description
      );
    }
    
    // Insert balances
    for (const balance of balancesData) {
      await database.runAsync(
        'INSERT INTO balances (asset, available, locked) VALUES (?, ?, ?)',
        balance.asset,
        balance.available,
        balance.locked
      );
    }
    
    // Insert order book snapshots
    const orderBookDataUSDC = require('../../data/seed/orderbooks/USDC-NGN.json') as { market: string; bids: [number, number][]; asks: [number, number][] };
    const orderBookDataUSDT = require('../../data/seed/orderbooks/USDT-NGN.json') as { market: string; bids: [number, number][]; asks: [number, number][] };
    
    // Insert USDC-NGN order book
    for (const [price, size] of orderBookDataUSDC.bids) {
      await database.runAsync(
        'INSERT INTO order_book_levels (market, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookDataUSDC.market,
        'bid',
        price,
        size
      );
    }
    for (const [price, size] of orderBookDataUSDC.asks) {
      await database.runAsync(
        'INSERT INTO order_book_levels (market, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookDataUSDC.market,
        'ask',
        price,
        size
      );
    }
    
    // Insert USDT-NGN order book
    for (const [price, size] of orderBookDataUSDT.bids) {
      await database.runAsync(
        'INSERT INTO order_book_levels (market, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookDataUSDT.market,
        'bid',
        price,
        size
      );
    }
    for (const [price, size] of orderBookDataUSDT.asks) {
      await database.runAsync(
        'INSERT INTO order_book_levels (market, side, price, size) VALUES (?, ?, ?, ?)',
        orderBookDataUSDT.market,
        'ask',
        price,
        size
      );
    }
    
    // Insert initial trades
    const tradesDataUSDC = require('../../data/seed/trades/USDC-NGN.json') as Trade[];
    const tradesDataUSDT = require('../../data/seed/trades/USDT-NGN.json') as Trade[];
    
    // Insert USDC-NGN trades
    for (const trade of tradesDataUSDC) {
      await database.runAsync(
        'INSERT OR IGNORE INTO trades (trade_id, market, price, size, side, ts) VALUES (?, ?, ?, ?, ?, ?)',
        trade.tradeId,
        trade.market,
        trade.price,
        trade.size,
        trade.side,
        trade.ts
      );
    }
    
    // Insert USDT-NGN trades
    for (const trade of tradesDataUSDT) {
      await database.runAsync(
        'INSERT OR IGNORE INTO trades (trade_id, market, price, size, side, ts) VALUES (?, ?, ?, ?, ?, ?)',
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
