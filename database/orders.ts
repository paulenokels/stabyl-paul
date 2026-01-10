import type { Order } from '@/interfaces/database';
import { getDatabase } from './index';

/**
 * Create a new limit order
 */
export async function createOrder(
  market: string,
  side: 'buy' | 'sell',
  price: number,
  amount: number
): Promise<Order> {
  const database = await getDatabase();
  
  // Generate unique order ID
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = Date.now();
  
  await database.runAsync(
    `INSERT INTO orders (order_id, market, side, price, amount, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    orderId,
    market,
    side,
    price,
    amount,
    createdAt
  );
  
  return {
    orderId,
    market,
    side,
    price,
    amount,
    status: 'open',
    createdAt,
  };
}

/**
 * Get all open orders
 */
export async function getOpenOrders(): Promise<Order[]> {
  const database = await getDatabase();
  
  const orders = await database.getAllAsync<{
    orderId: string;
    market: string;
    side: string;
    price: number;
    amount: number;
    status: string;
    createdAt: number;
  }>(
    `SELECT order_id as orderId, market, side, price, amount, status, created_at as createdAt
     FROM orders
     WHERE status = 'open'
     ORDER BY created_at DESC`
  );
  
  return orders.map(o => ({
    orderId: o.orderId,
    market: o.market,
    side: o.side as 'buy' | 'sell',
    price: o.price,
    amount: o.amount,
    status: o.status as 'open' | 'cancelled' | 'filled',
    createdAt: o.createdAt,
  }));
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<boolean> {
  const database = await getDatabase();
  
  const result = await database.runAsync(
    `UPDATE orders SET status = 'cancelled' WHERE order_id = ? AND status = 'open'`,
    orderId
  );
  
  return result.changes > 0;
}

/**
 * Get orders by market
 */
export async function getOrdersByMarket(marketId: string): Promise<Order[]> {
  const database = await getDatabase();
  
  const orders = await database.getAllAsync<{
    orderId: string;
    market: string;
    side: string;
    price: number;
    amount: number;
    status: string;
    createdAt: number;
  }>(
    `SELECT order_id as orderId, market, side, price, amount, status, created_at as createdAt
     FROM orders
     WHERE market = ? AND status = 'open'
     ORDER BY created_at DESC`,
    marketId
  );
  
  return orders.map(o => ({
    orderId: o.orderId,
    market: o.market,
    side: o.side as 'buy' | 'sell',
    price: o.price,
    amount: o.amount,
    status: o.status as 'open' | 'cancelled' | 'filled',
    createdAt: o.createdAt,
  }));
}
