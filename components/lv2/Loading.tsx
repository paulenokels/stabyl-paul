import { Typography } from '@/components/lv1/Typography';
import { theme } from '@/theme/theme';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';

type Props = {
  containerStyle?: StyleProp<ViewStyle | TextStyle>;
  text?: string;
};

export const LoadingSm: React.FC<Props> = ({ containerStyle }) => {
  return <View style={[styles.container, containerStyle]}><ActivityIndicator size={20} color={theme.primaryColor} /></View>;
};

export const LoadingMd: React.FC<Props> = ({ containerStyle, text }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={40} color={theme.primaryColor} />
      {text && <Typography style={{ fontSize: 12 }}>{text}</Typography>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    justifyContent: 'center',
  },
});
