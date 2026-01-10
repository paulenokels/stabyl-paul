import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migration';
import { seedDatabase } from './seeds';

const DB_NAME = 'stabyl.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database connection
 */
 async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return db;
}


/**
 * Initialize database schema with migrations and seeds
 */
 async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();
  
  // Enable foreign keys
  await database.execAsync('PRAGMA foreign_keys = ON');
  
  // Check current schema version
  let currentVersion = 1;
  try {
    const result = await database.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );
    if (result) {
      currentVersion = result.version;
    }
  } catch (error) {
    // Schema version table doesn't exist yet, will be created in migrations
    console.error('Error checking schema version:', error);
  }
  
  // Run migrations
  await runMigrations(currentVersion);
  // Seed database 
  await seedDatabase();
}

export { getDatabase, initializeDatabase };
