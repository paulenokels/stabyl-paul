import { Typography } from '@/components/lv1/Typography';
import { theme } from '@/theme/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type Props = {
  text?: string;
  color?: string;
};

export const LoadingSm: React.FC<Props> = ({color}) => {
  return <View style={[styles.container,]}><ActivityIndicator size={20} color={color || theme.primaryColor} /></View>;
};

export const LoadingMd: React.FC<Props> = ({ color, text }) => {
  return (
    <View style={[styles.container]}>
      <ActivityIndicator size={40} color={color ||theme.primaryColor} />
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
