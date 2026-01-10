export interface Market {
  id: string;
  base: string;
  quote: string;
  tickSize: number;
  minOrderSize: number;
  initialLastPrice: number;
  initialChange24h: number;
}

export interface Asset {
  id: string;
  decimals: number;
  description: string;
}

export interface Balance {
  assetId: string;
  available: number;
  locked: number;
}

export interface OrderBookLevel {
  marketId: string;
  side: 'bid' | 'ask';
  price: number;
  size: number;
}

export interface Trade {
  id: string;
  marketId: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  ts: number;
}

export interface Order {
  id: string;
  marketId: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  status: 'open' | 'cancelled' | 'filled';
  createdAt: number;
}
