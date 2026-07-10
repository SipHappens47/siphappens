import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { BadgeToast } from '../src/components/BadgeToast';
import { theme } from '../src/constants/theme';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleError = (event: any) => {
      const errorMessage = event?.reason?.message ?? event?.error?.message ?? String(event?.reason ?? event?.error ?? event);
      
      // Suppress harmless expo-keep-awake errors (not supported on web/mobile browsers)
      if (errorMessage?.includes?.('keep awake') || errorMessage?.includes?.('Unable to activate')) {
        if (event?.preventDefault) {
          event.preventDefault();
        }
        return true;
      }
      
      console.error('Unhandled error:', errorMessage);
      // Prevent the error from crashing the app
      if (event?.preventDefault) {
        event.preventDefault();
      }
      return true;
    };

    if (Platform.OS === 'web') {
      window.addEventListener('unhandledrejection', handleError);
    }

    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...MaterialCommunityIcons.font,
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    }
    loadFonts();

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('unhandledrejection', handleError);
      }
    };
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0E1116' }} />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="tabs" />
              <Stack.Screen name="camera" />
              <Stack.Screen name="pour" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="connections" />
              <Stack.Screen name="admin" />
              <Stack.Screen name="legal" />
            </Stack>
            <BadgeToast />
          </AuthProvider>
        </PaperProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
