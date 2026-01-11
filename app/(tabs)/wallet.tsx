import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { BalanceItem } from '@/components/lv3/BalanceItem';
import { getBalances, getHideSmallBalances, setHideSmallBalances } from '@/database/repositories/wallet';
import type { Balance } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Switch } from 'react-native';

const SMALL_BALANCE_THRESHOLD = 1100.0; // Consider balances < 1.0 as small

export default function WalletScreen() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [hideSmallBalances, setHideSmallBalancesPref] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [balancesData, hideSmallPref] = await Promise.all([
        getBalances(),
        getHideSmallBalances(),
      ]);
      setBalances(balancesData);
      setHideSmallBalancesPref(hideSmallPref);
    } catch (error) {
      console.error('Error loading wallet data:', error);
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

  const handleToggleHideSmall = useCallback(async (value: boolean) => {
    try {
      await setHideSmallBalances(value);
      setHideSmallBalancesPref(value);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  }, []);

  // Filter balances based on preference
  const filteredBalances = hideSmallBalances
    ? balances.filter(
        (balance) =>
          balance.available + balance.locked >= SMALL_BALANCE_THRESHOLD
      )
    : balances;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
        <Typography style={styles.loadingText}>Loading wallet...</Typography>
      </View>
    );
  }

  const totalValue = balances.reduce(
    (sum, balance) => sum + balance.available + balance.locked,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography type="title" style={styles.title}>Wallets</Typography>
      </View>

     

      <View style={styles.preferenceSection}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceContent}>
            <Typography style={styles.preferenceLabel}>
              Hide Small Balances
            </Typography>
            <Typography style={styles.preferenceDescription}>
              Hide balances less than {SMALL_BALANCE_THRESHOLD}
            </Typography>
          </View>
          <Switch
            value={hideSmallBalances}
            onValueChange={handleToggleHideSmall}
            trackColor={{ false: theme.lightBorderColor, true: theme.primaryColor + '80' }}
            thumbColor={hideSmallBalances ? theme.primaryColor : theme.mediumEmphasis}
          />
        </View>
      </View>

      <FlatList
        data={filteredBalances}
        keyExtractor={(item) => item.assetId}
        renderItem={({ item }) => <BalanceItem balance={item} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typography style={styles.emptyText}>
              {hideSmallBalances
                ? 'No balances above the threshold'
                : 'No balances found'}
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
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    marginBottom: 8,
  },
  
  preferenceSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.lightBorderColor,
    backgroundColor: theme.secondaryBgColor,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceContent: {
    flex: 1,
    gap: 4,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textColor,
  },
  preferenceDescription: {
    fontSize: 12,
    color: theme.mediumEmphasis,
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
  },
  emptyText: {
    fontSize: 16,
    color: theme.mediumEmphasis,
    textAlign: 'center',
  },
});
