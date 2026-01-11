/**
 * Utility functions for processing order book events
 * This module contains pure functions for determining order book update actions
 */

import type { StreamEvent } from './streamLoader';

export interface ProcessedOrderBookLevel {
  marketId: string;
  side: 'bid' | 'ask';
  price: number;
  size: number;
  seq?: number;
  ts: number;
}

export interface OrderBookEventResult {
  action: 'insert' | 'update' | 'delete' | 'noop';
  level: ProcessedOrderBookLevel;
  shouldDelete: boolean;
}

/**
 * Process an order book delta event and determine the action to take
 * @param existingLevels Array of existing order book levels for the same market/side/price
 * @param event The order book delta event
 * @returns The action to take and the level data
 */
export function processOrderBookEvent(
  existingLevels: ProcessedOrderBookLevel[],
  event: StreamEvent & { type: 'ob_delta' }
): OrderBookEventResult {
  const existingLevel = existingLevels.find(
    (level) =>
      level.marketId === event.market &&
      level.side === event.side &&
      level.price === event.price
  );

  const orderBookLevel: ProcessedOrderBookLevel = {
    marketId: event.market,
    side: event.side,
    price: event.price,
    size: event.size,
    seq: event.seq,
    ts: event.ts,
  };

  if (event.size === 0) {
    // Remove the level
    if (existingLevel) {
      return {
        action: 'delete',
        level: existingLevel, // Return existing level for deletion
        shouldDelete: true,
      };
    } else {
      return {
        action: 'noop',
        level: orderBookLevel,
        shouldDelete: false,
      };
    }
  } else {
    // Insert or update the level
    if (existingLevel) {
      return {
        action: 'update',
        level: orderBookLevel,
        shouldDelete: false,
      };
    } else {
      return {
        action: 'insert',
        level: orderBookLevel,
        shouldDelete: false,
      };
    }
  }
}
