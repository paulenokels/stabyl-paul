import { getDatabase } from '.';

/**
 * Run database migrations
 */
export async function runMigrations(currentVersion: number): Promise<void> {
  // Migration 1: Initial schema
  const database = await getDatabase();

  if (currentVersion === 1) {
    await database.execAsync(`
      -- Schema version tracking
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      
      -- Markets table
      CREATE TABLE IF NOT EXISTS markets (
        market_id TEXT PRIMARY KEY,
        base TEXT NOT NULL,
        quote TEXT NOT NULL,
        tick_size REAL NOT NULL,
        min_order_size REAL NOT NULL,
        initial_last_price REAL NOT NULL,
        initial_change_24h REAL NOT NULL
      );
      
      -- Assets table
      CREATE TABLE IF NOT EXISTS assets (
        asset_id TEXT PRIMARY KEY,
        decimals INTEGER NOT NULL,
        description TEXT NOT NULL
      );
      
      -- Balances table
      CREATE TABLE IF NOT EXISTS balances (
        asset TEXT PRIMARY KEY,
        available REAL NOT NULL,
        locked REAL NOT NULL
      );
      
      -- Order book levels table
      CREATE TABLE IF NOT EXISTS order_book_levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        market TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('bid', 'ask')),
        price REAL NOT NULL,
        size REAL NOT NULL,
        UNIQUE(market, side, price),
        FOREIGN KEY (market) REFERENCES markets(market_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_order_book_market_side ON order_book_levels(market, side);
      CREATE INDEX IF NOT EXISTS idx_order_book_price ON order_book_levels(price);
      
      -- Trades table
      CREATE TABLE IF NOT EXISTS trades (
        trade_id TEXT PRIMARY KEY,
        market TEXT NOT NULL,
        price REAL NOT NULL,
        size REAL NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
        ts INTEGER NOT NULL,
        FOREIGN KEY (market) REFERENCES markets(market_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_trades_market ON trades(market);
      CREATE INDEX IF NOT EXISTS idx_trades_ts ON trades(ts);
      
      -- Insert schema version
      INSERT INTO schema_version (version) VALUES (1);
    `);
  }
  
  // Future migrations would go here
  // if (currentVersion === 2) { ... }
}

