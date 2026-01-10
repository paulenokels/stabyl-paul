import { StyleSheet } from 'react-native';

import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';

export default function HomeScreen() {
  return (
     
      <View style={styles.titleContainer}>
        <Typography type="title">Welcome!</Typography>
      </View>
      
     
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
