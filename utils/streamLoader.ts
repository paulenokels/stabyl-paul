import { Asset } from 'expo-asset';

/**
 * Stream loader utility for loading and parsing NDJSON stream files
 */

export type StreamEvent = 
  | { type: 'trade'; market: string; tradeId: string; price: number; size: number; side: 'buy' | 'sell'; ts: number; seq: number }
  | { type: 'ob_delta'; market: string; side: 'bid' | 'ask'; price: number; size: number; ts: number; seq: number };

/**
 * Load and parse the market stream NDJSON file
 */
export async function loadStreamFile(): Promise<StreamEvent[]> {
    let text: string;
      try {
        const response = await fetch(
          Asset.fromModule(require('../data/stream/market_stream.ndjson')).uri
        );
        text = await response.text();
        const lines = text.trim().split('\n');
        const events: StreamEvent[] = [];
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line) as StreamEvent;
              events.push(event);
            } catch (e) {
              console.warn('Failed to parse line:', line.substring(0, 50), e);
            }
          }
        }
        
        // Sort by seq to ensure correct order
        events.sort((a, b) => a.seq - b.seq);
        
        return events;
      } catch (fetchError) {
        console.log('fetchError', fetchError);
        throw new Error('Failed to load stream file');
      }

   
 
}
