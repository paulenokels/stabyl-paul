import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import type { Trade } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { FlatList, StyleSheet } from 'react-native';

interface TradesListProps {
  trades: Trade[];
}

export function TradesList({ trades }: TradesListProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatSize = (size: number) => {
    return size.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderTrade = ({ item }: { item: Trade }) => {
    const isBuy = item.side === 'buy';
    const priceColor = isBuy ? '#00C853' : theme.errorColor;

    return (
      <View style={styles.row}>
        <View style={styles.timeColumn}>
          <Typography style={styles.time}>{formatTime(item.ts)}</Typography>
        </View>
        <View style={styles.priceColumn}>
          <Typography style={[styles.price, { color: priceColor }]}>
            {formatPrice(item.price)}
          </Typography>
        </View>
        <View style={styles.sizeColumn}>
          <Typography style={styles.size}>
            {formatSize(item.size)}
          </Typography>
        </View>
        <View style={styles.sideColumn}>
          <View style={[styles.sideBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
            <Typography style={[styles.sideText, { color: isBuy ? '#00C853' : theme.errorColor }]}>
              {item.side.toUpperCase()}
            </Typography>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography type="subtitle" style={styles.sectionTitle}>Recent Trades</Typography>
      </View>
      
      <View style={styles.tradesContainer}>
        <View style={styles.tradesHeader}>
          <Typography style={[styles.headerLabel, styles.timeColumn]}>Time</Typography>
          <Typography style={[styles.headerLabel, styles.priceColumn]}>Price</Typography>
          <Typography style={[styles.headerLabel, styles.sizeColumn]}>Size</Typography>
          <Typography style={[styles.headerLabel, styles.sideColumn]}>Side</Typography>
        </View>
        
        {trades.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No trades yet</Typography>
          </View>
        ) : (
          <FlatList
            data={trades}
            keyExtractor={(item) => item.id}
            renderItem={renderTrade}
            scrollEnabled={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
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
  tradesContainer: {
    borderWidth: 1,
    borderColor: theme.lightBorderColor,
    borderRadius: 8,
    padding: 8,
    maxHeight: 300,
  },
  tradesHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
  },
  headerLabel: {
    fontSize: 12,
    color: theme.mediumEmphasis,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
  },
  timeColumn: {
    flex: 1,
  },
  priceColumn: {
    flex: 1.5,
  },
  sizeColumn: {
    flex: 1.5,
  },
  sideColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 12,
    color: theme.mediumEmphasis,
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
  },
  size: {
    fontSize: 14,
    color: theme.textColor,
  },
  sideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  buyBadge: {
    borderColor: '#00C853',
    backgroundColor: '#00C85320',
  },
  sellBadge: {
    borderColor: theme.errorColor,
    backgroundColor: '#FF000020',
  },
  sideText: {
    fontSize: 12,
    fontWeight: '600',
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
