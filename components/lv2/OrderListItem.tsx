import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import type { Order } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface OrderListItemProps {
  order: Order;
  onCancel: () => void;
}

export function OrderListItem({ order, onCancel }: OrderListItemProps) {
  const isBuy = order.side === 'buy';
  const sideColor = isBuy ? '#00C853' : theme.errorColor;

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Typography type="defaultSemiBold" style={styles.market}>
            {order.market}
          </Typography>
          <View style={[styles.sideBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
            <Typography style={[styles.sideText, { color: sideColor }]}>
              {order.side.toUpperCase()}
            </Typography>
          </View>
        </View>
        <Typography style={styles.time}>{formatTime(order.createdAt)}</Typography>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Typography style={styles.detailLabel}>Price:</Typography>
          <Typography type="defaultSemiBold" style={styles.detailValue}>
            {formatPrice(order.price)}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Typography style={styles.detailLabel}>Amount:</Typography>
          <Typography type="defaultSemiBold" style={styles.detailValue}>
            {formatAmount(order.amount)}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Typography style={styles.detailLabel}>Total:</Typography>
          <Typography type="defaultSemiBold" style={styles.detailValue}>
            {formatPrice(order.price * order.amount)}
          </Typography>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
      >
        <Typography style={styles.cancelButtonText}>Cancel Order</Typography>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.lightBorderColor,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  market: {
    fontSize: 16,
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
  time: {
    fontSize: 12,
    color: theme.mediumEmphasis,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.mediumEmphasis,
  },
  detailValue: {
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.errorColor,
    backgroundColor: theme.bgColor,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.errorColor,
  },
});
