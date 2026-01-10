import type { Balance } from '@/interfaces/database';
import { getDatabase } from '../index';

/**
 * Get all balances
 */
export async function getBalances(): Promise<Balance[]> {
  const database = await getDatabase();
  
  const balances = await database.getAllAsync<Balance>(
    `SELECT * FROM balances ORDER BY assetId`
  );
  
  return balances;
}

/**
 * Get a preference value
 */
export async function getPreference(key: string): Promise<string | null> {
  const database = await getDatabase();
  
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM preferences WHERE key = ?',
    key
  );
  
  return result ? result.value : null;
}

/**
 * Set a preference value
 */
export async function setPreference(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  
  await database.runAsync(
    `INSERT INTO preferences (key, value, updatedAt) 
     VALUES (?, ?, ?) 
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
    key,
    value,
    Date.now()
  );
}

/**
 * Get hide small balances preference
 */
export async function getHideSmallBalances(): Promise<boolean> {
  const value = await getPreference('hideSmallBalances');
  return value === 'true';
}

/**
 * Set hide small balances preference
 */
export async function setHideSmallBalances(hide: boolean): Promise<void> {
  await setPreference('hideSmallBalances', hide ? 'true' : 'false');
}
