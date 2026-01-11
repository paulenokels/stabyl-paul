import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import type { OrderBookLevel } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { formatPrice, formatSize } from '@/utils/stringUtils';
import { StyleSheet } from 'react-native';

interface OrderBookProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export function OrderBook({ bids, asks }: OrderBookProps) {
    const renderBid = (item: OrderBookLevel, index: number) => (
    <View style={styles.row} key={`bid-${item.price}-${index}`}>
      <Typography style={[styles.price, { color: theme.successColor }]}>
        {formatPrice(item.price)}
      </Typography>
      <Typography style={styles.size}>
        {formatSize(item.size)}
      </Typography>
    </View>
  );

  const renderAsk = (item: OrderBookLevel, index: number) => (
    <View style={styles.row} key={`ask-${item.price}-${index}`}>
      <Typography style={[styles.price, { color: theme.errorColor }]}>
        {formatPrice(item.price)}
      </Typography>
      <Typography style={styles.size}>
        {formatSize(item.size)}
      </Typography>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography type="subtitle" style={styles.sectionTitle}>Order Book</Typography>
      </View>
      
      <View style={styles.orderBookContainer}>
        <View style={styles.sideContainer}>
        <Typography style={styles.sideLabel}>Bids</Typography>

          <View style={styles.sideHeader}>
            <Typography style={styles.headerLabel}>Price</Typography>
            <Typography style={styles.headerLabel}>Size</Typography>
          </View>
          {bids.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography style={styles.emptyText}>No bids</Typography>
            </View>
          ) : (
            bids.map(renderBid)
          )}
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.sideContainer}>
        <Typography style={styles.sideLabel}>Asks</Typography>

          <View style={styles.sideHeader}>
            <Typography style={styles.headerLabel}>Price</Typography>
            <Typography style={styles.headerLabel}>Size</Typography>
          </View>
          {asks.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography style={styles.emptyText}>No asks</Typography>
            </View>
          ) : (
            asks.map(renderAsk)
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  orderBookContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.lightBorderColor,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sideContainer: {
    flex: 1,
    padding: 8,
  },
  divider: {
    width: 1,
    backgroundColor: theme.lightBorderColor,
  },
  sideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
  },
  sideLabel: {
    fontWeight: '600',
    color: theme.mediumEmphasis,
    fontSize:13
  },
  headerLabel: {
    fontSize: 12,
    color: theme.mediumEmphasis,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
  },
  size: {
    fontSize: 14,
    color: theme.textColor,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.mediumEmphasis,
    fontSize: 14,
  },
});
