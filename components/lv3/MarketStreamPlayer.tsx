import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { getDatabase } from '@/database';
import { theme } from '@/theme/theme';
import { loadStreamFile, type StreamEvent } from '@/utils/streamLoader';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'finished';

interface MarketStreamPlayerProps {
  onStatusChange?: (status: PlaybackStatus) => void;
  onProgress?: (processed: number, total: number) => void;
  playbackSpeed?: number; // events per second
}

export function MarketStreamPlayer({ 
  onStatusChange, 
  onProgress,
  playbackSpeed = 100 
}: MarketStreamPlayerProps) {
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [processedEvents, setProcessedEvents] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const eventQueueRef = useRef<StreamEvent[]>([]);
  const processingRef = useRef(false);
  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);
  const currentSeqRef = useRef(0);
  const batchProcessingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update status and notify parent
  const updateStatus = (newStatus: PlaybackStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  // Process a batch of events to keep UI responsive
  const processEventBatch = async (database: any, batch: StreamEvent[]) => {
    try {
      await database.execAsync('BEGIN TRANSACTION');
      
      for (const event of batch) {
        if (cancelledRef.current) {
          await database.execAsync('ROLLBACK');
          return;
        }

        if (event.type === 'ob_delta') {
          // Update or remove order book level
          if (event.size === 0) {
            // Remove the level
            await database.runAsync(
              'DELETE FROM orderBookLevels WHERE marketId = ? AND side = ? AND price = ?',
              event.market,
              event.side,
              event.price
            );
          } else {
            // Insert or update the level
            await database.runAsync(
              'INSERT INTO orderBookLevels (marketId, side, price, size) VALUES (?, ?, ?, ?) ON CONFLICT(marketId, side, price) DO UPDATE SET size = excluded.size',
              event.market,
              event.side,
              event.price,
              event.size
            );
          }
        } else if (event.type === 'trade') {
          // Insert new trade (ignore duplicates)
          await database.runAsync(
            'INSERT OR IGNORE INTO trades (id, marketId, price, size, side, ts) VALUES (?, ?, ?, ?, ?, ?)',
            event.tradeId,
            event.market,
            event.price,
            event.size,
            event.side,
            event.ts
          );
        }
      }
      
      await database.execAsync('COMMIT');
    } catch (error) {
      await database.execAsync('ROLLBACK');
      console.error('Error processing event batch:', error);
      throw error;
    }
  };


  // Process events with rate limiting for UI responsiveness
  const processEvents = async () => {
    if (processingRef.current || eventQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const database = await getDatabase();
    
    // Process in batches to keep UI responsive
    const BATCH_SIZE = 50; // Process 50 events per batch
    const DELAY_MS = 1000 / playbackSpeed * BATCH_SIZE; // Delay based on playback speed

    const processNextBatch = async () => {
      if (cancelledRef.current || pausedRef.current || eventQueueRef.current.length === 0) {
        processingRef.current = false;
        
        if (eventQueueRef.current.length === 0 && !cancelledRef.current) {
          updateStatus('finished');
        } else if (pausedRef.current) {
          updateStatus('paused');
        }
        return;
      }

      const batch = eventQueueRef.current.splice(0, BATCH_SIZE);
      
      try {
        await processEventBatch(database, batch);
        
        currentSeqRef.current = batch[batch.length - 1]?.seq || currentSeqRef.current;
        const newProcessed = processedEvents + batch.length;
        setProcessedEvents(newProcessed);
        onProgress?.(newProcessed, totalEvents);
        
        // Schedule next batch with delay
        batchProcessingTimeoutRef.current = setTimeout(() => {
          processNextBatch();
        }, DELAY_MS);
      } catch (error) {
        console.error('Error in processNextBatch:', error);
        processingRef.current = false;
        updateStatus('idle');
      }
    };

    await processNextBatch();
  };

  // Start playback
  const startPlayback = async () => {
    if (status === 'playing') return;
    
    setIsLoading(true);
    cancelledRef.current = false;
    pausedRef.current = false;
    
    try {
      // Load events if queue is empty
      if (eventQueueRef.current.length === 0) {
        const events = await loadStreamFile();
        eventQueueRef.current = events;
        setTotalEvents(events.length);
        setProcessedEvents(0);
        currentSeqRef.current = 0;
      }
      
      updateStatus('playing');
      await processEvents();
    } catch (error) {
      console.error('Error starting playback:', error);
      updateStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  // Pause playback
  const pausePlayback = () => {
    if (status !== 'playing') return;
    pausedRef.current = true;
    updateStatus('paused');
    
    if (batchProcessingTimeoutRef.current) {
      clearTimeout(batchProcessingTimeoutRef.current);
      batchProcessingTimeoutRef.current = null;
    }
  };

  // Resume playback
  const resumePlayback = () => {
    if (status !== 'paused') return;
    pausedRef.current = false;
    updateStatus('playing');
    processEvents();
  };

  // Restart playback
  const restartPlayback = async () => {
    // Cancel current processing
    cancelledRef.current = true;
    pausedRef.current = false;
    
    if (batchProcessingTimeoutRef.current) {
      clearTimeout(batchProcessingTimeoutRef.current);
      batchProcessingTimeoutRef.current = null;
    }
    
    // Wait a bit for processing to stop
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Reset state
    cancelledRef.current = false;
    setProcessedEvents(0);
    eventQueueRef.current = [];
    
    // Reload and start
    await startPlayback();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (batchProcessingTimeoutRef.current) {
        clearTimeout(batchProcessingTimeoutRef.current);
      }
    };
  }, []);

  const getStatusLabel = () => {
    switch (status) {
      case 'playing':
        return 'Playing';
      case 'paused':
        return 'Paused';
      case 'finished':
        return 'Finished';
      default:
        return 'Ready';
    }
  };

  return (
    <View style={styles.container}>
      <Typography type="subtitle" style={styles.title}>
        Market Stream Player
      </Typography>
      
      <View style={styles.statusContainer}>
        <Typography>Status: {getStatusLabel()}</Typography>
        {totalEvents > 0 && (
          <Typography>
            Progress: {processedEvents} / {totalEvents} ({Math.round((processedEvents / totalEvents) * 100)}%)
          </Typography>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primaryColor} />
          <Typography style={styles.loadingText}>Loading stream...</Typography>
        </View>
      )}

      <View style={styles.controlsContainer}>
        {status === 'idle' && (
          <TouchableOpacity 
            style={[styles.button, styles.playButton]} 
            onPress={startPlayback}
            disabled={isLoading}
          >
            <Typography style={styles.buttonText}>Play</Typography>
          </TouchableOpacity>
        )}
        
        {status === 'playing' && (
          <TouchableOpacity 
            style={[styles.button, styles.pauseButton]} 
            onPress={pausePlayback}
          >
            <Typography style={styles.buttonText}>Pause</Typography>
          </TouchableOpacity>
        )}
        
        {status === 'paused' && (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.playButton]} 
              onPress={resumePlayback}
            >
              <Typography style={styles.buttonText}>Resume</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.restartButton]} 
              onPress={restartPlayback}
            >
              <Typography style={styles.buttonText}>Restart</Typography>
            </TouchableOpacity>
          </>
        )}
        
        {status === 'finished' && (
          <TouchableOpacity 
            style={[styles.button, styles.restartButton]} 
            onPress={restartPlayback}
          >
            <Typography style={styles.buttonText}>Restart</Typography>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  statusContainer: {
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: theme.primaryColor,
  },
  pauseButton: {
    backgroundColor: theme.errorColor,
  },
  restartButton: {
    backgroundColor: theme.secondaryColor,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
