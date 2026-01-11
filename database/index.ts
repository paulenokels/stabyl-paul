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
  let currentVersion = 0;
  try {
    // For the first time, check if schemaVersion table exists
    const tableCheck = await database.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schemaVersion'"
    );
    
    if (tableCheck) {
      const result = await database.getFirstAsync<{ version: number }>(
        'SELECT version FROM schemaVersion ORDER BY version DESC LIMIT 1'
      );
      if (result) {
        currentVersion = result.version + 1;
      }
    }
  } catch (error) {
    // Schema version table doesn't exist yet, will be created in migrations
    console.error('Error checking schema version:', error);
  }
  
  // Run migrations
  const updateVersion = currentVersion + 1;
  await runMigrations(updateVersion);
  // Seed database 
  await seedDatabase();
}

export { getDatabase, initializeDatabase };
