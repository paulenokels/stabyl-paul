import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { OrderBook } from '@/components/lv2/OrderBook';
import { PlaybackStatusIndicator } from '@/components/lv2/PlaybackStatus';
import { TradesList } from '@/components/lv2/TradesList';
import { MarketStreamPlayer } from '@/components/lv3/MarketStreamPlayer';
import { useMarketStreamPlayer, type StreamUpdate } from '@/contexts/MarketStreamPlayerContext';
import type { MarketWithPrice } from '@/database/repositories/markets';
import { getMarketsWithPrice, toggleFavorite } from '@/database/repositories/markets';
import { getRecentTrades, getTopAsks, getTopBids } from '@/database/repositories/orderbook';
import type { OrderBookLevel, Trade } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const player = useMarketStreamPlayer();
  const [market, setMarket] = useState<MarketWithPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    if (!id) return;
    loadInitialData();
  }, [id]);

  // Subscribe to stream updates and update local state
  useEffect(() => {
    if (!id) return;

    const unsubscribe = player.subscribeToUpdates((updates: StreamUpdate[]) => {
      // Filter updates for this market only
      const marketUpdates = updates.filter(update => update.data.marketId === id);

      if (marketUpdates.length === 0) return;

      // Process updates
      marketUpdates.forEach(update => {
        if (update.type === 'trade') {
          // Add new trade to the beginning of the trades list
          setTrades(prevTrades => {
            // Check if trade already exists to avoid duplicates
            const exists = prevTrades.some(t => t.id === update.data.id);
            if (exists) return prevTrades;
            
            // Add to beginning and limit to 20 most recent
            const newTrades = [update.data, ...prevTrades];
            return newTrades.slice(0, 20);
          });
        } else if (update.type === 'orderbook_added' || update.type === 'orderbook_updated') {
          // Update order book level
          const level = update.data;
          if (level.side === 'bid') {
            setBids(prevBids => {
              // Remove existing level with same price if it exists
              const filtered = prevBids.filter(b => b.price !== level.price);
              // Add new/updated level
              const updated = [...filtered, level];
              // Sort by price descending (highest first) and take top 10
              return updated
                .sort((a, b) => b.price - a.price)
                .slice(0, 10);
            });
          } else {
            setAsks(prevAsks => {
              // Remove existing level with same price if it exists
              const filtered = prevAsks.filter(a => a.price !== level.price);
              // Add new/updated level
              const updated = [...filtered, level];
              // Sort by price ascending (lowest first) and take top 10
              return updated
                .sort((a, b) => a.price - b.price)
                .slice(0, 10);
            });
          }
        } else if (update.type === 'orderbook_deleted') {
          // Remove order book level
          const level = update.data;
          if (level.side === 'bid') {
            setBids(prevBids => {
              // Simply remove the deleted level - new levels will be added via stream updates
              return prevBids.filter(b => b.price !== level.price);
            });
          } else {
            setAsks(prevAsks => {
              // Simply remove the deleted level - new levels will be added via stream updates
              return prevAsks.filter(a => a.price !== level.price);
            });
          }
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [id, player]);

  const loadOrderBook = async () => {
    
    try {
      const [topBids, topAsks] = await Promise.all([
        getTopBids(id, 10),
        getTopAsks(id, 10),
      ]);
      setBids(topBids);
      setAsks(topAsks);
    } catch (error) {
      console.error('Error loading order book:', error);
    }
  };

  const loadTrades = async () => {
    
    try {
      const recentTrades = await getRecentTrades(id, 20);
      setTrades(recentTrades);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const loadMarket = async () => {
    
    try {
      const markets = await getMarketsWithPrice();
      const foundMarket = markets.find(m => m.id === id);
      if (foundMarket) {
        setMarket(foundMarket);
      }
    } catch (error) {
      console.error('Error loading market:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = (async () => {
        console.log('Loading initial data');
      await Promise.all([
        loadMarket(),
        loadOrderBook(),
        loadTrades(),
      ]);
   
  });

  const refreshData = async () => {
    
    setRefreshing(true);
    try {
        console.log('Refreshing data');
      await loadInitialData();
    } finally {
      setRefreshing(false);
    }
  };


  const handleFavoriteToggle = useCallback(async () => {
    if (!market) return;
    
    try {
      await toggleFavorite(market.id);
      await loadMarket();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [market, loadMarket]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Typography style={styles.loadingText}>Loading market...</Typography>
      </View>
    );
  }

  

  const isPositive = market?.change24h && market.change24h >= 0;
  const changeColor = isPositive ? '#00C853' : theme.errorColor;
  const changeSign = isPositive ? '+' : '';

  const formatPrice = (price: number | null) => {
    if (price === null) return '--';
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (!market) {
    return (
      <View style={styles.errorContainer}>
        <Typography type="title" style={styles.errorText}>Market not found</Typography>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Typography type="link">Go back</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Typography type="subtitle" style={styles.marketTitle}>
            {market.id}
          </Typography>
          <Typography style={styles.marketPair}>
            {market.base}/{market.quote}
          </Typography>
        </View>
        
        <View style={styles.headerRight}>
          <PlaybackStatusIndicator status={player.status} />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoriteToggle}
          >
            <Ionicons
              name={market.isFavorite ? 'star' : 'star-outline'}
              size={28}
              color={market.isFavorite ? theme.primaryColor : theme.textColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={theme.primaryColor}
          />
        }
      >
        <View style={styles.priceSection}>
          <Typography type="title" style={styles.price}>
            {formatPrice(market.lastPrice)}
          </Typography>
          <Typography style={[styles.change24h, { color: changeColor }]}>
            {formatChange(market.change24h)} (24h)
          </Typography>
        </View>

        <OrderBook bids={bids} asks={asks} />

        <TradesList trades={trades} />

        <View style={styles.streamPlayerSection}>
          <MarketStreamPlayer />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: theme.mediumEmphasis,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  errorText: {
    color: theme.errorColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marketTitle: {
    marginBottom: 4,
  },
  marketPair: {
    fontSize: 14,
    color: theme.mediumEmphasis,
  },
  favoriteButton: {
    padding: 8,
  },
  priceSection: {
    marginBottom: 32,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
  },
  price: {
    fontSize: 30,
    marginBottom: 8,
  },
  change24h: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.mediumEmphasis,
  },
  streamPlayerSection: {
    marginTop: 16,
    marginBottom: 24,
  },
});
