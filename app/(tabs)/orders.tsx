import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { OrderForm } from '@/components/lv2/OrderForm';
import { OrderListItem } from '@/components/lv2/OrderListItem';
import type { MarketWithPrice } from '@/database/repositories/markets';
import { getMarketsWithPrice } from '@/database/repositories/markets';
import { cancelOrder, createOrder, getOpenOrders } from '@/database/repositories/orders';
import type { Order } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [markets, setMarkets] = useState<MarketWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [ordersData, marketsData] = await Promise.all([
        getOpenOrders(),
        getMarketsWithPrice(),
      ]);
      setOrders(ordersData);
      setMarkets(marketsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handlePlaceOrder = useCallback(async (
    market: string,
    side: 'buy' | 'sell',
    price: number,
    amount: number
  ) => {
    await createOrder(market, side, price, amount);
    // Refresh orders list
    await loadData();
  }, [loadData]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      // Refresh orders list
      await loadData();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Typography style={styles.loadingText}>Loading...</Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography type="title" style={styles.title}>Orders</Typography>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.orderId}
        renderItem={({ item }) => (
          <OrderListItem
            order={item}
            onCancel={() => handleCancelOrder(item.orderId)}
          />
        )}
        ListHeaderComponent={
          <OrderForm
            markets={markets}
            onSubmit={handlePlaceOrder}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography style={styles.emptyText}>No open orders</Typography>
            <Typography style={styles.emptySubtext}>
              Place a limit order above to get started
            </Typography>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primaryColor}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 16,
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.mediumEmphasis,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.mediumEmphasis,
    textAlign: 'center',
  },
});
