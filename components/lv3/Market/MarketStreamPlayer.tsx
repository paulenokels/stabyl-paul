import { Typography } from '@/components/lv1/Typography';
import { View } from '@/components/lv1/View';
import { useMarketStreamPlayer } from '@/contexts/MarketStreamPlayerContext';
import { theme } from '@/theme/theme';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';


export function MarketStreamPlayer() {
  const player = useMarketStreamPlayer();


  const getStatusLabel = () => {
    switch (player.status) {
      case 'playing':
        return 'Playing';
      case 'paused':
        return 'Paused';
      case 'finished':
        return 'Finished';
      default:
        return 'Ready';
    }
  };

  return (
    <View style={styles.container}>
      <Typography type="subtitle" style={styles.title}>
        Market Stream Player
      </Typography>
      
      <View style={styles.statusContainer}>
        <Typography>Status: {getStatusLabel()}</Typography>
        {player.totalEvents > 0 && (
          <Typography>
            Progress: {player.processedEvents} / {player.totalEvents} ({Math.round((player.processedEvents / player.totalEvents) * 100)}%)
          </Typography>
        )}
      </View>

      {player.isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primaryColor} />
          <Typography style={styles.loadingText}>Loading stream...</Typography>
        </View>
      )}

      <View style={styles.controlsContainer}>
        {player.status === 'idle' && (
          <TouchableOpacity 
            style={[styles.button, styles.playButton]} 
            onPress={player.startPlayback}
            disabled={player.isLoading}
          >
            <Typography style={styles.buttonText}>Play</Typography>
          </TouchableOpacity>
        )}
        
        {player.status === 'playing' && (
          <TouchableOpacity 
            style={[styles.button, styles.pauseButton]} 
            onPress={player.pausePlayback}
          >
            <Typography style={styles.buttonText}>Pause</Typography>
          </TouchableOpacity>
        )}
        
        {player.status === 'paused' && (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.playButton]} 
              onPress={player.resumePlayback}
            >
              <Typography style={styles.buttonText}>Resume</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.restartButton]} 
              onPress={player.restartPlayback}
            >
              <Typography style={styles.buttonText}>Restart</Typography>
            </TouchableOpacity>
          </>
        )}
        
        {player.status === 'finished' && (
          <TouchableOpacity 
            style={[styles.button, styles.restartButton]} 
            onPress={player.restartPlayback}
          >
            <Typography style={styles.buttonText}>Restart</Typography>
          </TouchableOpacity>
        )}
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
  statusContainer: {
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: theme.primaryColor,
  },
  pauseButton: {
    backgroundColor: theme.errorColor,
  },
  restartButton: {
    backgroundColor: theme.secondaryColor,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
