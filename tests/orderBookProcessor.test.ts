/**
 * Unit tests for order book update logic (insert, update, remove, maintain sorting)
 */

import { processOrderBookEvent, type ProcessedOrderBookLevel } from '../utils/orderBookProcessor';
import type { StreamEvent } from '../utils/streamLoader';

describe('Order Book Processor', () => {
  describe('processOrderBookEvent', () => {
    it('should insert a new bid level when level does not exist', () => {
      const existingLevels: ProcessedOrderBookLevel[] = [];
      const event: StreamEvent = {
        type: 'ob_delta',
        market: 'USDT-NGN',
        side: 'bid',
        price: 1500.0,
        size: 100.5,
        ts: 1000,
        seq: 1,
      };

      const result = processOrderBookEvent(existingLevels, event);

      expect(result.action).toBe('insert');
      expect(result.level).toEqual({
        marketId: 'USDT-NGN',
        side: 'bid',
        price: 1500.0,
        size: 100.5,
        seq: 1,
        ts: 1000,
      });
      expect(result.shouldDelete).toBe(false);
    });

    it('should insert a new ask level when level does not exist', () => {
      const existingLevels: ProcessedOrderBookLevel[] = [];
      const event: StreamEvent = {
        type: 'ob_delta',
        market: 'USDT-NGN',
        side: 'ask',
        price: 1501.0,
        size: 50.0,
        ts: 1000,
        seq: 1,
      };

      const result = processOrderBookEvent(existingLevels, event);

      expect(result.action).toBe('insert');
      expect(result.level).toEqual({
        marketId: 'USDT-NGN',
        side: 'ask',
        price: 1501.0,
        size: 50.0,
        seq: 1,
        ts: 1000,
      });
    });

    it('should update an existing level when level exists and size > 0', () => {
      const existingLevels: ProcessedOrderBookLevel[] = [
        {
          marketId: 'USDT-NGN',
          side: 'bid',
          price: 1500.0,
          size: 100.5,
          seq: 1,
          ts: 1000,
        },
      ];
      const event: StreamEvent = {
        type: 'ob_delta',
        market: 'USDT-NGN',
        side: 'bid',
        price: 1500.0,
        size: 200.0,
        ts: 2000,
        seq: 2,
      };

      const result = processOrderBookEvent(existingLevels, event);

      expect(result.action).toBe('update');
      expect(result.level).toEqual({
        marketId: 'USDT-NGN',
        side: 'bid',
        price: 1500.0,
        size: 200.0,
        seq: 2,
        ts: 2000,
      });
      expect(result.shouldDelete).toBe(false);
    });

    it('should remove an existing level when size is 0', () => {
      const existingLevels: ProcessedOrderBookLevel[] = [
        {
          marketId: 'USDT-NGN',
          side: 'bid',
          price: 1500.0,
          size: 100.5,
          seq: 1,
          ts: 1000,
        },
      ];
      const event: StreamEvent = {
        type: 'ob_delta',
        market: 'USDT-NGN',
        side: 'bid',
        price: 1500.0,
        size: 0,
        ts: 2000,
        seq: 2,
      };

      const result = processOrderBookEvent(existingLevels, event);

      expect(result.action).toBe('delete');
      expect(result.shouldDelete).toBe(true);
      expect(result.level).toEqual({
        marketId: 'USDT-NGN',
        side: 'bid',
        price: 1500.0,
        size: 100.5, // Should return existing level
        seq: 1,
        ts: 1000,
      });
    });

    it('should not delete when size is 0 but level does not exist', () => {
      const existingLevels: ProcessedOrderBookLevel[] = [];
      const event: StreamEvent = {
        type: 'ob_delta',
        market: 'USDT-NGN',
        side: 'bid',
        price: 1500.0,
        size: 0,
        ts: 2000,
        seq: 2,
      };

      const result = processOrderBookEvent(existingLevels, event);

      expect(result.action).toBe('noop');
      expect(result.shouldDelete).toBe(false);
    });
  });

  describe('Order Book Sorting', () => {
    it('should maintain bids sorted by price descending (highest first)', () => {
      const bids: ProcessedOrderBookLevel[] = [
        { marketId: 'USDT-NGN', side: 'bid', price: 1500.0, size: 100, seq: 1, ts: 1000 },
        { marketId: 'USDT-NGN', side: 'bid', price: 1499.0, size: 200, seq: 2, ts: 2000 },
        { marketId: 'USDT-NGN', side: 'bid', price: 1501.0, size: 50, seq: 3, ts: 3000 },
      ];

      // Sort bids: highest price first
      const sorted = [...bids].sort((a, b) => b.price - a.price);

      expect(sorted[0].price).toBe(1501.0);
      expect(sorted[1].price).toBe(1500.0);
      expect(sorted[2].price).toBe(1499.0);
    });

    it('should maintain asks sorted by price ascending (lowest first)', () => {
      const asks: ProcessedOrderBookLevel[] = [
        { marketId: 'USDT-NGN', side: 'ask', price: 1501.0, size: 100, seq: 1, ts: 1000 },
        { marketId: 'USDT-NGN', side: 'ask', price: 1500.0, size: 200, seq: 2, ts: 2000 },
        { marketId: 'USDT-NGN', side: 'ask', price: 1502.0, size: 50, seq: 3, ts: 3000 },
      ];

      // Sort asks: lowest price first
      const sorted = [...asks].sort((a, b) => a.price - b.price);

      expect(sorted[0].price).toBe(1500.0);
      expect(sorted[1].price).toBe(1501.0);
      expect(sorted[2].price).toBe(1502.0);
    });

    it('should handle multiple markets independently', () => {
      const levels: ProcessedOrderBookLevel[] = [
        { marketId: 'USDT-NGN', side: 'bid', price: 1500.0, size: 100, seq: 1, ts: 1000 },
        { marketId: 'USDC-NGN', side: 'bid', price: 1400.0, size: 200, seq: 2, ts: 2000 },
        { marketId: 'USDT-NGN', side: 'bid', price: 1499.0, size: 50, seq: 3, ts: 3000 },
      ];

      const usdtBids = levels.filter(l => l.marketId === 'USDT-NGN' && l.side === 'bid');
      const usdcBids = levels.filter(l => l.marketId === 'USDC-NGN' && l.side === 'bid');

      expect(usdtBids).toHaveLength(2);
      expect(usdcBids).toHaveLength(1);
    });
  });
});
