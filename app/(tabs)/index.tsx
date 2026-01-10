import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { MarketListItem } from '@/components/lv2/MarketListItem';
import { MarketStreamPlayer } from '@/components/lv3/MarketStreamPlayer';
import type { MarketWithPrice } from '@/database/repositories/markets';
import { getMarketsWithPrice, toggleFavorite } from '@/database/repositories/markets';
import { theme } from '@/theme/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';

export default function HomeScreen() {
  const [markets, setMarkets] = useState<MarketWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMarkets = useCallback(async () => {
    try {
      const marketsData = await getMarketsWithPrice();
      setMarkets(marketsData);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadMarkets();
    }, [loadMarkets])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadMarkets();
  }, [loadMarkets]);

  const handleMarketPress = useCallback((marketId: string) => {
    router.push({
      pathname: '/market/[id]',
      params: { id: marketId },
    });
  }, []);

  const handleFavoriteToggle = useCallback(async (marketId: string) => {
    try {
      await toggleFavorite(marketId);
      // Refresh the markets list to update favorite status
      await loadMarkets();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [loadMarkets]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Typography style={styles.loadingText}>Loading markets...</Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography type="title" style={styles.title}>Markets</Typography>
      </View>

     
      
      <FlatList
        data={markets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MarketListItem
            market={item}
            onPress={() => handleMarketPress(item.id)}
            onFavoriteToggle={() => handleFavoriteToggle(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primaryColor}
          />
        }
        contentContainerStyle={styles.listContent}
      />

<View>
        <MarketStreamPlayer />
      </View>
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
    backgroundColor: theme.bgColor,
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
});
