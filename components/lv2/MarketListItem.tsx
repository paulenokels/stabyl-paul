import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import type { MarketWithPrice } from '@/database/repositories/markets';
import { theme } from '@/theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, TouchableOpacity } from 'react-native';

interface MarketListItemProps {
  market: MarketWithPrice;
  onPress: () => void;
  onFavoriteToggle: () => void;
}

export function MarketListItem({ market, onPress, onFavoriteToggle }: MarketListItemProps) {
  const isPositive = market.change24h >= 0;
  const changeColor = isPositive ? theme.successColor : theme.errorColor;

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
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Typography type="defaultSemiBold" style={styles.marketId}>
            {market.id}
          </Typography>
          <Typography style={styles.marketPair}>
            {market.base}/{market.quote}
          </Typography>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.priceSection}>
            <Typography type="defaultSemiBold" style={styles.price}>
              {formatPrice(market.lastPrice)}
            </Typography>
            <Typography style={[styles.change24h, { color: changeColor }]}>
              {formatChange(market.change24h)}
            </Typography>
          </View>
          
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={market.isFavorite ? 'star' : 'star-outline'}
              size={24}
              color={market.isFavorite ? theme.primaryColor : theme.textColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: theme.secondaryBgColor,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  marketId: {
    fontSize: 16,
    marginBottom: 4,
  },
  marketPair: {
    fontSize: 14,
    color: theme.mediumEmphasis,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    marginBottom: 4,
  },
  change24h: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 4,
  },
});
