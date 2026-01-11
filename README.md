# Stabyl App

A React Native trading app built with Expo that provides real-time market data, order management, and wallet functionality.

## Demo Video
https://www.loom.com/share/6523c64223624cb4807dafd02c9849ad

## Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## iOS Setup


### Running on iOS

1. Start the development server:
   ```bash
   npm start
   ```

2. Choose one of the following options:
   - **iOS Simulator**: If you have XCode installed, Press `i` in the terminal
   - **Physical Device**: Install Expo Go from the App Store, then scan the QR code


## Android Setup

### Running on Android

1. Start the development server:
   ```bash
   npm start
   ```

2. Choose one of the following options:
   - **Android Emulator**: Start an emulator from Android Studio, then press `a` in the terminal
   - **Physical Device**: Install Expo Go from Google Play, enable USB debugging, then scan the QR code


## Testing

### How to Run Tests

Run all tests:

```bash
npm test
```

The test suite uses Jest with Babel for TypeScript transformation. Tests are located in the `tests/` directory and include:

- **Order Book Processor Tests** (`tests/orderBookProcessor.test.ts`): Unit tests for order book update logic (insert, update, remove, maintain sorting)
- **Orders Repository Tests** (`tests/orders.test.ts`): Tests for database repository methods (createOrder, getOpenOrders, cancelOrder)

## Architectural Overview

### State Management

The app uses a **hybrid state management approach**:

1. **Global Context (MarketStreamPlayerContext)**: 
   - Manages the market stream player as a singleton service
   - Provides global playback state (playing, paused, finished)
   - Handles event processing and database updates
   - Subscribes components to real-time stream updates
   - Located in `contexts/MarketStreamPlayerContext.tsx`

2. **Local Component State**:
   - React hooks (`useState`, `useEffect`) for component-specific state
   - Used for UI state, form inputs, and component-level data

3. **Database State**:
   - Expo-SQLite for persistent storage
   - All market data, orders, and user preferences are stored in SQLite
   - Database repositories provide abstraction over raw SQL queries

### Database Schema

The database uses SQLite with the following main tables:

- **markets**: Market definitions (id, base, quote, tickSize, minOrderSize, initialLastPrice, initialChange24h)
- **assets**: Asset information (id, decimals, description)
- **balances**: User wallet balances (assetId, available, locked)
- **orderBookLevels**: Order book snapshot and deltas (marketId, side, price, size)
- **trades**: Trade history (id, marketId, price, size, side, ts, seq)
- **orders**: User limit orders (id, marketId, side, price, amount, status, createdAt)
- **favorites**: User favorite markets (marketId)
- **preferences**: User preferences (key, value)

All tables include appropriate indexes for efficient queries. Schema migrations are managed in `database/migration.ts`.

### Data Flow

1. **Initialization**:
   - On first launch, the app runs database migrations
   - Seeds initial data (markets, assets, balances, order book snapshots, initial trades) from JSON files
   - The MarketStreamPlayer service is initialized as a singleton

2. **Market Stream Processing**:
   - User starts playback of the market stream (NDJSON file)
   - Events are loaded and queued in the MarketStreamPlayerService
   - Events are processed in batches (50 events per batch) with rate limiting
   - Each batch is processed in a database transaction:
     - `ob_delta` events update/insert/delete order book levels
     - `trade` events insert new trades (with duplicate checking)
   - Updates are broadcast to subscribed components via `subscribeToUpdates`

3. **UI Updates**:
   - Components subscribe to stream updates in `useEffect` hooks
   - On receiving updates, components filter by market ID and update local state
   - Order book and trades lists are updated incrementally (no full reloads)
   - State is sorted and limited to top N items (e.g., top 10 bids/asks, last 20 trades)

4. **User Actions**:
   - Orders: Created and stored in SQLite, displayed in Orders screen
   - Favorites: Toggled and persisted in database
   - Wallet: Balances queried from database, preferences stored for UI settings

## Performance Optimizations for Real-Time Updates

1. **Batch Processing**:
   - Events are processed in batches of 50 to reduce database transaction overhead
   - Rate limiting controls playback speed (configurable events per second)

2. **Incremental Updates**:
   - Components receive only the updates relevant to their market
   - State updates are incremental (add/update/remove) rather than full reloads
   - Order book and trades lists maintain sorted order without re-sorting entire arrays

3. **Database Optimizations**:
   - Indexes on frequently queried columns (marketId, side, price, ts)
   - Transactions ensure atomic updates
   - Queries use LIMIT clauses to fetch only needed data

4. **React Optimizations**:
   - Components use `useCallback` for stable function references
   - Local state updates use functional updates (`setState(prev => ...)`)
   - Subscriptions are properly cleaned up in `useEffect` cleanup functions

5. **Singleton Service Pattern**:
   - MarketStreamPlayer service persists across screen navigation
   - Avoids re-initialization and maintains event queue state
   - Single source of truth for playback state

## Trade-offs and Potential Future Improvements

### Current Trade-offs

1. **Local-Only Orders**: Orders are stored locally without a matching engine, so they won't be filled automatically.

2. **Synchronous Processing**: Market stream events are processed sequentially. Very large streams might benefit from parallel processing, but this maintains event ordering guarantees.

3. **In-Memory State**: Order book and trades are maintained in component state. For very large datasets, virtualized lists or pagination would be needed.

4. **Simple Rate Limiting**: Current rate limiting uses fixed batch sizes and delays. More sophisticated adaptive rate limiting could be implemented.

### Potential Future Improvements

1. **Order Matching Engine**: Implement a local matching engine to fill orders based on market data.

2. **WebSocket Support**: Replace file-based stream with real-time WebSocket connections for live market data.

3. **Pagination/Virtualization**: For large trade histories or order books, implement pagination or virtualized lists.

4. **Offline Queue**: Queue user actions when offline and sync when connection is restored.

5. **Database Optimization**:
   - Consider partitioning trades table by date for better query performance
   - Add materialized views for frequently accessed aggregations

6. **Performance Monitoring**:
   - Add performance metrics and monitoring
   - Track database query performance
   - Monitor component render times
