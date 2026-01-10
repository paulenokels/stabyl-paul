import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import type { Balance } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { StyleSheet } from 'react-native';

interface BalanceItemProps {
  balance: Balance;
}

export function BalanceItem({ balance }: BalanceItemProps) {
  const total = balance.available + balance.locked;

  const formatAmount = (amount: number, asset: string) => {
    // Different formatting based on asset type
    const decimals = asset === 'NGN' ? 2 : 6;
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography type="defaultSemiBold" style={styles.asset}>
          {balance.asset}
        </Typography>
        <Typography type="defaultSemiBold" style={styles.total}>
          {formatAmount(total, balance.asset)}
        </Typography>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Typography style={styles.detailLabel}>Available:</Typography>
          <Typography style={styles.detailValue}>
            {formatAmount(balance.available, balance.asset)}
          </Typography>
        </View>
        <View style={styles.detailRow}>
          <Typography style={styles.detailLabel}>Locked:</Typography>
          <Typography style={styles.detailValue}>
            {formatAmount(balance.locked, balance.asset)}
          </Typography>
        </View>
      </View>
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
  asset: {
    fontSize: 18,
  },
  total: {
    fontSize: 18,
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
    color: theme.textColor,
  },
});
