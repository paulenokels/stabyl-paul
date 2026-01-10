export interface Market {
  marketId: string;
  base: string;
  quote: string;
  tickSize: number;
  minOrderSize: number;
  initialLastPrice: number;
  initialChange24h: number;
}

export interface Asset {
  assetId: string;
  decimals: number;
  description: string;
}

export interface Balance {
  asset: string;
  available: number;
  locked: number;
}

export interface OrderBookLevel {
  market: string;
  side: 'bid' | 'ask';
  price: number;
  size: number;
}

export interface Trade {
  market: string;
  tradeId: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  ts: number;
}

export interface Order {
  orderId: string;
  market: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  status: 'open' | 'cancelled' | 'filled';
  createdAt: number;
}
