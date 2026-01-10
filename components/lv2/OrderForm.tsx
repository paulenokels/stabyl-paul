import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { theme } from '@/theme/theme';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface OrderFormProps {
  markets: Array<{ marketId: string; base: string; quote: string }>;
  onSubmit: (market: string, side: 'buy' | 'sell', price: number, amount: number) => Promise<void>;
}

export function OrderForm({ markets, onSubmit }: OrderFormProps) {
  const [selectedMarket, setSelectedMarket] = useState(markets[0]?.marketId || '');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMarket) {
      Alert.alert('Error', 'Please select a market');
      return;
    }

    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedMarket, side, priceNum, amountNum);
      // Reset form
      setPrice('');
      setAmount('');
      Alert.alert('Success', 'Order placed successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMarketData = markets.find(m => m.marketId === selectedMarket);

  return (
    <View style={styles.container}>
      <Typography type="subtitle" style={styles.title}>Place Limit Order</Typography>
      
      {/* Market Selection */}
      <View style={styles.section}>
        <Typography style={styles.label}>Market</Typography>
        <View style={styles.marketButtons}>
          {markets.map(market => (
            <TouchableOpacity
              key={market.marketId}
              style={[
                styles.marketButton,
                selectedMarket === market.marketId && styles.marketButtonActive,
              ]}
              onPress={() => setSelectedMarket(market.marketId)}
            >
              <Typography
                style={[
                  styles.marketButtonText,
                  selectedMarket === market.marketId && styles.marketButtonTextActive,
                ]}
              >
                {market.marketId}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Side Selection */}
      <View style={styles.section}>
        <Typography style={styles.label}>Side</Typography>
        <View style={styles.sideButtons}>
          <TouchableOpacity
            style={[
              styles.sideButton,
              side === 'buy' && styles.sideButtonBuy,
            ]}
            onPress={() => setSide('buy')}
          >
            <Typography
              style={[
                styles.sideButtonText,
                side === 'buy' && styles.sideButtonTextActive,
              ]}
            >
              Buy
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sideButton,
              side === 'sell' && styles.sideButtonSell,
            ]}
            onPress={() => setSide('sell')}
          >
            <Typography
              style={[
                styles.sideButtonText,
                side === 'sell' && styles.sideButtonTextActive,
              ]}
            >
              Sell
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      {/* Price Input */}
      <View style={styles.section}>
        <Typography style={styles.label}>
          Price ({selectedMarketData?.quote || 'NGN'})
        </Typography>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor={theme.placeholderColor}
        />
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Typography style={styles.label}>
          Amount ({selectedMarketData?.base || 'USDT'})
        </Typography>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.0000"
          keyboardType="decimal-pad"
          placeholderTextColor={theme.placeholderColor}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          side === 'buy' ? styles.submitButtonBuy : styles.submitButtonSell,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Typography style={styles.submitButtonText}>
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </Typography>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textColor,
  },
  marketButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  marketButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.lightBorderColor,
    backgroundColor: theme.secondaryBgColor,
  },
  marketButtonActive: {
    borderColor: theme.primaryColor,
    backgroundColor: theme.primaryColor + '20',
  },
  marketButtonText: {
    fontSize: 14,
    color: theme.textColor,
  },
  marketButtonTextActive: {
    color: theme.primaryColor,
    fontWeight: '600',
  },
  sideButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sideButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.lightBorderColor,
    backgroundColor: theme.secondaryBgColor,
    alignItems: 'center',
  },
  sideButtonBuy: {
    borderColor: '#00C853',
    backgroundColor: '#00C85320',
  },
  sideButtonSell: {
    borderColor: theme.errorColor,
    backgroundColor: '#FF000020',
  },
  sideButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textColor,
  },
  sideButtonTextActive: {
    color: theme.textColor,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.lightBorderColor,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.textColor,
    backgroundColor: theme.bgColor,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonBuy: {
    backgroundColor: '#00C853',
  },
  submitButtonSell: {
    backgroundColor: theme.errorColor,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
