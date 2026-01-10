import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { Market, Order } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';
import { PrimaryButton } from './Buttons';

interface OrderFormProps {
  markets: Array<Market>;
  onSubmit: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
}

export function OrderForm({ markets, onSubmit }: OrderFormProps) {
  const [selectedMarketId, setSelectedMarketId] = useState(markets[0]?.id || '');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMarketId) {
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
      await onSubmit({
        marketId: selectedMarketId,
        side,
        price: priceNum,
        amount: amountNum,
        status: 'open',
      });
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

  const selectedMarketData = markets.find(m => m.id === selectedMarketId);

  return (
    <View style={styles.container}>
      <Typography type="subtitle" style={styles.title}>Place Limit Order</Typography>
      
      {/* Market Selection */}
      <View style={styles.section}>
        <Typography style={styles.label}>Market</Typography>
        <View style={styles.marketButtons}>
          {markets.map(market => (
           <PrimaryButton key={market.id}
            style={[
                styles.marketButton,
                selectedMarketId === market.id && styles.marketButtonActive,
            ]}
            typographyStyle={market.id && styles.marketButtonTextActive}
            onPress={() => setSelectedMarketId(market.id)} text={market.id} />
            ))}
          
        </View>
      </View>
      
      {/* Side Selection */}
      <View style={styles.section}>
        <Typography style={styles.label}>Side</Typography>
        <View style={styles.sideButtons}>
            <PrimaryButton style={[
                styles.sideButton,
                side === 'buy' && styles.sideButtonBuy,
              ]}
              typographyStyle={side === 'buy' && styles.sideButtonTextActive}
              onPress={() => setSide('buy')} text="Buy" />
          <PrimaryButton style={[
                styles.sideButton,
                side === 'sell' && styles.sideButtonSell,
              ]}
              typographyStyle={side === 'sell' && styles.sideButtonTextActive}
              onPress={() => setSide('sell')} text="Sell" />
          
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
      <PrimaryButton
        onPress={handleSubmit}
        disabled={isSubmitting}
        text={isSubmitting ? 'Placing Order...' : 'Place Order'}
      />
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
