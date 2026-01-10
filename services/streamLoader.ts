/**
 * Stream loader utility for loading and parsing NDJSON stream files
 */

export type StreamEvent = 
  | { type: 'trade'; market: string; tradeId: string; price: number; size: number; side: 'buy' | 'sell'; ts: number; seq: number }
  | { type: 'ob_delta'; market: string; side: 'bid' | 'ask'; price: number; size: number; ts: number; seq: number };

/**
 * Load and parse the market stream NDJSON file
 * This function handles loading the file in different environments (web, iOS, Android)
 */
export async function loadStreamFile(): Promise<StreamEvent[]> {
  try {
    let text: string;
    
    // In development/web, try fetch first
    if (typeof fetch !== 'undefined') {
      try {
        // Try loading as a text asset
        // Note: This requires the file to be accessible via fetch
        // In Expo, we might need to configure metro bundler to handle .ndjson files
        const streamModule = require('../data/stream/market_stream.ndjson');
        
        // If it's a string, use it directly
        if (typeof streamModule === 'string') {
          text = streamModule;
        } else if (streamModule.default) {
          text = streamModule.default;
        } else {
          // Try to fetch it as a URL
          const response = await fetch(streamModule);
          text = await response.text();
        }
      } catch (fetchError) {
        // Fallback: try expo-asset
        try {
          const { Asset } = require('expo-asset');
          const asset = Asset.fromModule(require('../data/stream/market_stream.ndjson'));
          await asset.downloadAsync();
          const response = await fetch(asset.localUri || asset.uri);
          text = await response.text();
        } catch (assetError) {
          console.error('Failed to load via expo-asset:', assetError);
          throw new Error('Unable to load stream file. Please ensure expo-asset is installed or the file is accessible.');
        }
      }
    } else {
      throw new Error('fetch is not available in this environment');
    }
    
    // Parse NDJSON (newline-delimited JSON)
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
  } catch (error) {
    console.error('Error loading stream file:', error);
    throw new Error(`Unable to load stream file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
