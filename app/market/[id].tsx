import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import type { MarketWithPrice } from '@/database/markets';
import { getMarketsWithPrice, toggleFavorite } from '@/database/markets';
import { theme } from '@/theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

export default function MarketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [market, setMarket] = useState<MarketWithPrice | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMarket = useCallback(async () => {
    if (!id) return;
    
    try {
      const markets = await getMarketsWithPrice();
      const foundMarket = markets.find(m => m.marketId === id);
      if (foundMarket) {
        setMarket(foundMarket);
      }
    } catch (error) {
      console.error('Error loading market:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMarket();
  }, [loadMarket]);

  const handleFavoriteToggle = useCallback(async () => {
    if (!market) return;
    
    try {
      await toggleFavorite(market.marketId);
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

  const isPositive = market.change24h >= 0;
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
          <Typography type="title" style={styles.marketTitle}>
            {market.marketId}
          </Typography>
          <Typography style={styles.marketPair}>
            {market.base}/{market.quote}
          </Typography>
        </View>
        
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

      <View style={styles.priceSection}>
        <Typography type="title" style={styles.price}>
          {formatPrice(market.lastPrice)}
        </Typography>
        <Typography style={[styles.change24h, { color: changeColor }]}>
          {formatChange(market.change24h)} (24h)
        </Typography>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Typography style={styles.infoLabel}>Base Asset:</Typography>
          <Typography type="defaultSemiBold">{market.base}</Typography>
        </View>
        <View style={styles.infoRow}>
          <Typography style={styles.infoLabel}>Quote Asset:</Typography>
          <Typography type="defaultSemiBold">{market.quote}</Typography>
        </View>
        <View style={styles.infoRow}>
          <Typography style={styles.infoLabel}>Tick Size:</Typography>
          <Typography type="defaultSemiBold">{market.tickSize}</Typography>
        </View>
        <View style={styles.infoRow}>
          <Typography style={styles.infoLabel}>Min Order Size:</Typography>
          <Typography type="defaultSemiBold">{market.minOrderSize}</Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
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
    fontSize: 36,
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
});
