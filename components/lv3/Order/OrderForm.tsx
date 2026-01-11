import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { Market, Order } from '@/interfaces/database';
import { theme } from '@/theme/theme';
import { checkNumberInput } from '@/utils/stringUtils';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button } from '../../lv2/Button';
import { PrimaryInput } from '../../lv2/PrimaryInput';

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedMarketId) {
      setError('Please select a market');
      return;
    }

    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
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
      setError(null);
      Alert.alert('Success', 'Order placed successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMarketData = markets.find(m => m.id === selectedMarketId);

  const handlePriceChange = (text: string) => {
    setPrice(checkNumberInput(text));
  };

  const handleAmountChange = (text: string) => {
    setAmount(checkNumberInput(text));
  };

  return (
    <View style={styles.container}>
      <Typography type="subtitle" style={styles.title}>Place Limit Order</Typography>
      
      {/* Market Selection */}
      <View style={styles.section}>
        <Typography style={styles.label}>Market</Typography>
        <View style={styles.marketButtons}>
          {markets.map(market => (
           <Button key={market.id}
            variant={selectedMarketId === market.id ? 'primary' : 'secondary'}
            onPress={() => setSelectedMarketId(market.id)} text={market.id}
             />
            ))}
          
        </View>
      </View>
      
      {/* Side Selection */}
      <View style={styles.section}>
        <Typography style={styles.label}>Side</Typography>
        <View style={styles.sideButtons}>
              <Button 
              variant={side === 'buy' ? 'primary' : 'secondary'}
              onPress={() => setSide('buy')} text="Buy" />
          <Button variant={side === 'sell' ? 'primary' : 'secondary'}
              onPress={() => setSide('sell')} text="Sell" />
          
        </View>
      </View>

      {/* Price Input */}
      <View style={styles.section}>
        <Typography style={styles.label}>
          Price ({selectedMarketData?.quote || 'NGN'})
        </Typography>
        <PrimaryInput
          value={price}
          onChangeText={handlePriceChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Typography style={styles.label}>
          Amount ({selectedMarketData?.base || 'USDT'})
        </Typography>
        <PrimaryInput
          value={amount}
          onChangeText={handleAmountChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Error Message */}
      {error && (
        <View >
          <Typography style={styles.errorText}>{error}</Typography>
        </View>
      )}

      <View style={styles.submitButtonContainer}>
        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          text={isSubmitting ? 'Placing Order...' : 'Place Order'}
        />
      </View>
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
 
  sideButtons: {
    flexDirection: 'row',
    gap: 12,
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
  submitButtonContainer: {
    flexDirection: 'row',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  errorText: {
    fontSize: 14,
    color: theme.errorColor,
    textAlign: 'center',
  },
});
