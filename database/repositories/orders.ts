import type { Order } from '@/interfaces/database';
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../index';

/**
 * Create a new limit order
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const database = await getDatabase();
  
  // Generate unique order ID
  const id =  Crypto.randomUUID();
  const createdAt = Date.now();
  
   await database.runAsync(
    `INSERT INTO orders (id, marketId, side, price, amount, status, createdAt)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    id,
    order.marketId,
    order.side,
    order.price,
    order.amount,
    createdAt
  );
  
  return {
    id,
    ...order,
    createdAt,
  } as Order;
}

/**
 * Get all open orders
 */
export async function getOpenOrders(): Promise<Order[]> {
  const database = await getDatabase();
  
  const orders = await database.getAllAsync<Order>(
    `SELECT *
     FROM orders
     WHERE status = 'open'
     ORDER BY createdAt DESC`
  ) as Order[];
  
  return orders
}

/**
 * Cancel an order
 */
export async function cancelOrder(id: string): Promise<boolean> {
  const database = await getDatabase();
  
  const result = await database.runAsync(
    `UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'open'`,
    id
  );
  
  return result.changes > 0;
}

/**
 * Get orders by market
 */
export async function getOrdersByMarket(marketId: string): Promise<Order[]> {
  const database = await getDatabase();
  
  const orders = await database.getAllAsync<Order>(
    `SELECT *
     FROM orders
     WHERE marketId = ? AND status = 'open'
     ORDER BY createdAt DESC`,
    marketId
  );
  
  return orders as Order[];
}
