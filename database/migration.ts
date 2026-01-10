import { getDatabase } from '.';

/**
 * Run database migrations
 */
export async function runMigrations(nextVersion: number): Promise<void> {
  // Migration 1: Initial schema
  const database = await getDatabase();

  if (nextVersion === 1) {
    await database.execAsync(`
      -- Schema version tracking
      CREATE TABLE IF NOT EXISTS schemaVersion (
        version INTEGER PRIMARY KEY,
        appliedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      
      -- Markets table
      CREATE TABLE IF NOT EXISTS markets (
        id TEXT PRIMARY KEY,
        base TEXT NOT NULL,
        quote TEXT NOT NULL,
        tickSize REAL NOT NULL,
        minOrderSize REAL NOT NULL,
        initialLastPrice REAL NOT NULL,
        initialChange24h REAL NOT NULL
      );
      
      -- Assets table
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        decimals INTEGER NOT NULL,
        description TEXT NOT NULL
      );
      
      -- Balances table
      CREATE TABLE IF NOT EXISTS balances (
        assetId TEXT PRIMARY KEY,
        available REAL NOT NULL,
        locked REAL NOT NULL
      );
      
      -- Order book levels table
      CREATE TABLE IF NOT EXISTS orderBookLevels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marketId TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('bid', 'ask')),
        price REAL NOT NULL,
        size REAL NOT NULL,
        UNIQUE(marketId, side, price),
        FOREIGN KEY (marketId) REFERENCES markets(id)
      );
      
      CREATE INDEX IF NOT EXISTS idxOrderBookMarketSide ON orderBookLevels(marketId, side);
      CREATE INDEX IF NOT EXISTS idxOrderBookPrice ON orderBookLevels(price);
      
      -- Trades table
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        marketId TEXT NOT NULL,
        price REAL NOT NULL,
        size REAL NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
        ts INTEGER NOT NULL,
        FOREIGN KEY (marketId) REFERENCES markets(id)
      );
      
      CREATE INDEX IF NOT EXISTS idxTradesMarket ON trades(marketId);
      CREATE INDEX IF NOT EXISTS idxTradesTs ON trades(ts);

      -- Favorites table
      CREATE TABLE IF NOT EXISTS favorites (
        marketId TEXT PRIMARY KEY,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (marketId) REFERENCES markets(id)
      );
      
      CREATE INDEX IF NOT EXISTS idxFavoritesMarket ON favorites(marketId);
      
      -- Orders table (user's limit orders)
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        marketId TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
        price REAL NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('open', 'cancelled', 'filled')) DEFAULT 'open',
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (marketId) REFERENCES markets(id)
      );
      
      CREATE INDEX IF NOT EXISTS idxOrdersMarket ON orders(marketId);
      CREATE INDEX IF NOT EXISTS idxOrdersStatus ON orders(status);
      CREATE INDEX IF NOT EXISTS idxOrdersCreatedAt ON orders(createdAt);
      
      -- Preferences table (user preferences)
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
      
      CREATE INDEX IF NOT EXISTS idxPreferencesKey ON preferences(key);
      
      -- Insert schema version (only if it doesn't exist)
      INSERT OR IGNORE INTO schemaVersion (version) VALUES (1);
    `);
  }
  
  // Future migrations would go here
  // if (currentVersion === 2) { ... }
}

