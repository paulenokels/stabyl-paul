import { getDatabase } from '@/database';
import type { OrderBookLevel, Trade } from '@/interfaces/database';
import { loadStreamFile, type StreamEvent } from '@/utils/streamLoader';
import * as SQLite from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'finished';

export type StreamUpdate = 
  | { type: 'trade'; data: Trade }
  | { type: 'orderbook_added'; data: OrderBookLevel }
  | { type: 'orderbook_updated'; data: OrderBookLevel }
  | { type: 'orderbook_deleted'; data: OrderBookLevel };

interface MarketStreamPlayerContextValue {
  status: PlaybackStatus;
  processedEvents: number;
  totalEvents: number;
  isLoading: boolean;
  startPlayback: () => Promise<void>;
  pausePlayback: () => void;
  resumePlayback: () => Promise<void>;
  restartPlayback: () => Promise<void>;
  subscribeToUpdates: (callback: (updates: StreamUpdate[]) => void) => () => void;
}

const MarketStreamPlayerContext = createContext<MarketStreamPlayerContextValue | null>(null);

// Singleton service to manage player state (persists across component unmounts)
class MarketStreamPlayerService {
  private status: PlaybackStatus = 'idle';
  private processedEvents = 0;
  private totalEvents = 0;
  private isLoading = false;
  private eventQueue: StreamEvent[] = [];
  private processing = false;
  private paused = false;
  private cancelled = false;
  private batchProcessingTimeout: NodeJS.Timeout | null = null;
  private subscribers: Set<() => void> = new Set();
  private updateSubscribers: Set<(updates: StreamUpdate[]) => void> = new Set();
  private playbackSpeed = 100; // events per second

  // Subscribe to state changes
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Subscribe to update events
  subscribeToUpdates(callback: (updates: StreamUpdate[]) => void): () => void {
    this.updateSubscribers.add(callback);
    return () => {
      this.updateSubscribers.delete(callback);
    };
  }

  // Notify all subscribers
  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  // Notify update subscribers
  private notifyUpdates(updates: StreamUpdate[]) {
    if (updates.length > 0) {
      this.updateSubscribers.forEach(callback => callback(updates));
    }
  }

  // Get current state
  getState() {
    return {
      status: this.status,
      processedEvents: this.processedEvents,
      totalEvents: this.totalEvents,
      isLoading: this.isLoading,
    };
  }

  // Set playback speed
  setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
  }

  // Update status
  private setStatus(status: PlaybackStatus) {
    this.status = status;
    this.notify();
  }

  // Process a batch of events
  private async processEventBatch(database: SQLite.SQLiteDatabase, batch: StreamEvent[]): Promise<StreamUpdate[]> {
    const updates: StreamUpdate[] = [];
    
    try {
      await database.execAsync('BEGIN TRANSACTION');
      
      for (const event of batch) {
        if (this.cancelled) {
          await database.execAsync('ROLLBACK');
          return [];
        }

        if (event.type === 'ob_delta') {
          // Check if the level already exists - using getAllAsync and taking first result to avoid type issues
          const existingLevels = await database.getAllAsync<OrderBookLevel>(
            'SELECT marketId, side, price, size FROM orderBookLevels WHERE marketId = ? AND side = ? AND price = ?',
            event.market,
            event.side,
            event.price
          );
          const existingLevel = existingLevels.length > 0 ? existingLevels[0] : null;

          const orderBookLevel: OrderBookLevel = {
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
                console.log('Deleting level', event.market, event.side, event.price);
              await database.runAsync(
                'DELETE FROM orderBookLevels WHERE marketId = ? AND side = ? AND price = ?',
                event.market,
                event.side,
                event.price
              );
              updates.push({ type: 'orderbook_deleted', data: existingLevel });
            }
          } else {
            // Insert or update the level
            if (existingLevel) {
                console.log('Updating level', event.market, event.side, event.price);
              // Update existing level
              await database.runAsync(
                'UPDATE orderBookLevels SET size = ? WHERE marketId = ? AND side = ? AND price = ?',
                event.size,
                event.market,
                event.side,
                event.price
              );
              updates.push({ type: 'orderbook_updated', data: orderBookLevel });
            } else {
              // Insert new level
              console.log('Inserting level', event.market, event.side, event.price);
              await database.runAsync(
                'INSERT INTO orderBookLevels (marketId, side, price, size) VALUES (?, ?, ?, ?)',
                event.market,
                event.side,
                event.price,
                event.size
              );
              updates.push({ type: 'orderbook_added', data: orderBookLevel });
            }
          }
        } else if (event.type === 'trade') {
          // Check if trade already exists - using getAllAsync and taking first result to avoid type issues
          const existingTrades = await database.getAllAsync<Trade>(
            'SELECT id, marketId, price, size, side, ts FROM trades WHERE id = ?',
            event.tradeId
          );
          const existingTrade = existingTrades.length > 0 ? existingTrades[0] : null;

          if (existingTrade) console.log('Trade already exists', event.tradeId, event.market, event.price, event.size, event.side, event.ts);

          if (!existingTrade) {
            console.log('Inserting trade', event.tradeId, event.market, event.price, event.size, event.side, event.ts);
            // Insert new trade (only if it doesn't exist)
            await database.runAsync(
              'INSERT INTO trades (id, marketId, price, size, side, ts) VALUES (?, ?, ?, ?, ?, ?)',
              event.tradeId,
              event.market,
              event.price,
              event.size,
              event.side,
              event.ts
            );
            
            const trade: Trade = {
              id: event.tradeId,
              marketId: event.market,
              price: event.price,
              size: event.size,
              side: event.side,
              ts: event.ts,
              seq: event.seq,
            };
            updates.push({ type: 'trade', data: trade });
          }
        }
      }
      
      await database.execAsync('COMMIT');
      return updates;
    } catch (error) {
      await database.execAsync('ROLLBACK');
      console.error('Error processing event batch:', error);
      throw error;
    }
  }

  // Process events with rate limiting
  private async processEvents() {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;
    const database = await getDatabase();
    
    const BATCH_SIZE = 50; // Process 50 events per batch
    const DELAY_MS = (1000 / this.playbackSpeed) * BATCH_SIZE; // Delay based on playback speed

    const processNextBatch = async () => {
      if (this.cancelled || this.paused || this.eventQueue.length === 0) {
        this.processing = false;
        
        if (this.eventQueue.length === 0 && !this.cancelled) {
          this.setStatus('finished');
        } else if (this.paused) {
          this.setStatus('paused');
        }
        return;
      }

      const batch = this.eventQueue.splice(0, BATCH_SIZE);
      
      try {
        const updates = await this.processEventBatch(database, batch);
        
        this.processedEvents += batch.length;
        this.notify();
        this.notifyUpdates(updates);
        
        // Schedule next batch with delay
        // @ts-ignore
        this.batchProcessingTimeout = setTimeout(() => {
          processNextBatch();
        }, DELAY_MS);
      } catch (error) {
        console.error('Error in processNextBatch:', error);
        this.processing = false;
        this.setStatus('idle');
      }
    };

    await processNextBatch();
  }

  // Start playback
  async startPlayback() {
    if (this.status === 'playing') return;
    
    this.isLoading = true;
    this.cancelled = false;
    this.paused = false;
    this.notify();
    
    try {
      // Load events if queue is empty
      if (this.eventQueue.length === 0) {
        const events = await loadStreamFile();
        this.eventQueue = [...events];
        this.totalEvents = events.length;
        this.processedEvents = 0;
      }
      
      this.setStatus('playing');
      await this.processEvents();
    } catch (error) {
      console.error('Error starting playback:', error);
      this.setStatus('idle');
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  // Pause playback
  pausePlayback() {
    if (this.status !== 'playing') return;
    this.paused = true;
    this.setStatus('paused');
    
    if (this.batchProcessingTimeout) {
      clearTimeout(this.batchProcessingTimeout);
      this.batchProcessingTimeout = null;
    }
  }

  // Resume playback
  async resumePlayback() {
    if (this.status !== 'paused') return;
    this.paused = false;
    this.setStatus('playing');
    // Ensure processing is false before resuming
    this.processing = false;
    await this.processEvents();
  }

  // Restart playback
  async restartPlayback() {
    // Cancel current processing
    this.cancelled = true;
    this.paused = false;
    
    if (this.batchProcessingTimeout) {
      clearTimeout(this.batchProcessingTimeout);
      this.batchProcessingTimeout = null;
    }
    
    // Wait a bit for processing to stop
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Reset state
    this.cancelled = false;
    this.processing = false;
    this.processedEvents = 0;
    this.eventQueue = [];
    this.notify();
    
    // Reload and start
    await this.startPlayback();
  }

  // Cleanup (call this on app unmount if needed)
  cleanup() {
    this.cancelled = true;
    if (this.batchProcessingTimeout) {
      clearTimeout(this.batchProcessingTimeout);
      this.batchProcessingTimeout = null;
    }
  }
}

// Singleton instance
const playerService = new MarketStreamPlayerService();

// Provider component
export function MarketStreamPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(playerService.getState());
  
  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Subscribe to service updates
    subscriptionRef.current = playerService.subscribe(() => {
      setState(playerService.getState());
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, []);

  const startPlayback = useCallback(async () => {
    await playerService.startPlayback();
  }, []);

  const pausePlayback = useCallback(() => {
    playerService.pausePlayback();
  }, []);

  const resumePlayback = useCallback(async () => {
    await playerService.resumePlayback();
  }, []);

  const restartPlayback = useCallback(async () => {
    await playerService.restartPlayback();
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    return playerService.subscribe(callback);
  }, []);

  const subscribeToUpdates = useCallback((callback: (updates: StreamUpdate[]) => void) => {
    return playerService.subscribeToUpdates(callback);
  }, []);

  const value: MarketStreamPlayerContextValue = {
    ...state,
    startPlayback,
    pausePlayback,
    resumePlayback,
    restartPlayback,
    subscribeToUpdates,
  };

  return (
    <MarketStreamPlayerContext.Provider value={value}>
      {children}
    </MarketStreamPlayerContext.Provider>
  );
}

// Hook to access player context
export function useMarketStreamPlayer() {
  const context = useContext(MarketStreamPlayerContext);
  if (!context) {
    throw new Error('useMarketStreamPlayer must be used within MarketStreamPlayerProvider');
  }
  return context;
}
