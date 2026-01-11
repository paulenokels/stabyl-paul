/**
 * Unit tests for orders repository
 */

// Mock the database module - must be before imports  
jest.mock('../database/index');

import { getDatabase } from '../database/index';
import { cancelOrder, createOrder, getOpenOrders } from '../database/repositories/orders';
import type { Order } from '../interfaces/database';

// Get the mocked function
const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe('Orders Repository', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };
    mockGetDatabase.mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order with generated ID and timestamp', async () => {
      const orderData = {
        marketId: 'USDT-NGN',
        side: 'buy' as const,
        price: 1500.0,
        amount: 100.5,
        status: 'open',
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const order = await createOrder(orderData);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        'test-uuid-123',
        'USDT-NGN',
        'buy',
        1500.0,
        100.5,
        expect.any(Number) // createdAt timestamp
      );

      expect(order.id).toBe('test-uuid-123');
      expect(order.marketId).toBe('USDT-NGN');
      expect(order.side).toBe('buy');
      expect(order.price).toBe(1500.0);
      expect(order.amount).toBe(100.5);
      expect(order.status).toBe('open');
      expect(order.createdAt).toBeGreaterThan(0);
    });

    it('should create a sell order', async () => {
      const orderData = {
        marketId: 'USDC-NGN',
        side: 'sell',
        price: 1400.0,
        amount: 50.0,
        status: 'open',
      };

      mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });

      const order = await createOrder(orderData);

      expect(order.side).toBe('sell');
      expect(order.marketId).toBe('USDC-NGN');
    });
  });

  describe('getOpenOrders', () => {
    it('should return all open orders sorted by createdAt descending', async () => {
      const mockOrders: Order[] = [
        {
          id: 'order-1',
          marketId: 'USDT-NGN',
          side: 'buy',
          price: 1500.0,
          amount: 100.0,
          status: 'open',
          createdAt: 2000,
        },
        {
          id: 'order-2',
          marketId: 'USDC-NGN',
          side: 'sell',
          price: 1400.0,
          amount: 50.0,
          status: 'open',
          createdAt: 1000,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockOrders);

      const orders = await getOpenOrders();

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'open'")
      );

      expect(orders).toHaveLength(2);
      expect(orders[0].id).toBe('order-1');
      expect(orders[1].id).toBe('order-2');
    });

    it('should return empty array when no open orders exist', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const orders = await getOpenOrders();

      expect(orders).toEqual([]);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an existing open order', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      const result = await cancelOrder('order-1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE orders SET status = 'cancelled'"),
        'order-1'
      );

      expect(result).toBe(true);
    });

    it('should return false when order does not exist or is not open', async () => {
      mockDb.runAsync.mockResolvedValue({ changes: 0 });

      const result = await cancelOrder('non-existent-order');

      expect(result).toBe(false);
    });
  });
});
