import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import type { PlaybackStatus as PlaybackStatusType } from '@/contexts/MarketStreamPlayerContext';
import { theme } from '@/theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet } from 'react-native';

interface PlaybackStatusProps {
  status: PlaybackStatusType;
}

export function PlaybackStatusIndicator({ status }: PlaybackStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'playing':
        return {
          icon: 'play-circle' as const,
          color: theme.primaryColor,
          label: 'Playing',
        };
      case 'paused':
        return {
          icon: 'pause-circle' as const,
          color: theme.errorColor,
          label: 'Paused',
        };
      case 'finished':
        return {
          icon: 'checkmark-circle' as const,
          color: '#00C853',
          label: 'Finished',
        };
      default:
        return {
          icon: 'stop-circle' as const,
          color: theme.mediumEmphasis,
          label: 'Idle',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Typography style={[styles.label, { color: config.color }]}>
        {config.label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.secondaryBgColor,
    borderWidth: 1,
    borderColor: theme.lightBorderColor,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
