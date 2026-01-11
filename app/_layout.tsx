import { View } from '@/components/lv1/View';
import { MarketStreamPlayerProvider } from '@/contexts/MarketStreamPlayerContext';
import { initializeDatabase } from '@/database';
import { theme } from '@/theme/theme';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false)
  useEffect(() => {
    // Initialize database and seed on first launch
    initializeDatabase().catch((error) => {
      console.error('Failed to initialize database:', error);
    }).finally(() => {
      setIsAppReady(true);
    });
  }, []);

  if (!isAppReady) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={theme.primaryColor} /></View>
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MarketStreamPlayerProvider>
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="market" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </MarketStreamPlayerProvider>
    </SafeAreaView>
  );
}
