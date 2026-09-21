import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { Redirect, Stack, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { BadgeToast } from '../src/components/BadgeToast';
import { theme } from '../src/constants/theme';
import { SITE_DESCRIPTION, SITE_NAME, SITE_OG_TITLE, WEB_ORIGIN } from '../src/constants/site';
import { isPublicRoute } from '../src/utils/authRoutes';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function PaperIcon({
  name,
  color,
  size,
  allowFontScaling,
  testID,
}: {
  name: string;
  color?: string;
  size: number;
  direction: 'rtl' | 'ltr';
  allowFontScaling?: boolean;
  testID?: string;
}) {
  return (
    <MaterialCommunityIcons
      name={name as keyof typeof MaterialCommunityIcons.glyphMap}
      color={color}
      size={size}
      allowFontScaling={allowFontScaling}
      testID={testID}
    />
  );
}

function SeoHead() {
  return (
    <Head>
      <title>{SITE_NAME}</title>
      <meta name="description" content={SITE_DESCRIPTION} />
      <link rel="canonical" href={WEB_ORIGIN} />
      <link rel="icon" href="/favicon.ico" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={SITE_OG_TITLE} />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta property="og:url" content={WEB_ORIGIN} />
      <meta property="og:image" content={`${WEB_ORIGIN}/og-image.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={`${WEB_ORIGIN}/og-image.png`} />
      <meta name="twitter:title" content={SITE_NAME} />
      <meta name="twitter:description" content={SITE_DESCRIPTION} />
    </Head>
  );
}

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: '#0E1116' }} />;
  }

  const allowPublic = isPublicRoute(segments);

  return (
    <>
      {!isAuthenticated && !allowPublic ? <Redirect href="/auth/welcome" /> : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="tabs" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="pour" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="connections" />
        <Stack.Screen name="distilleries" />
        <Stack.Screen name="spirit" />
        <Stack.Screen name="user" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="legal" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

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
          ...Ionicons.font,
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
        <PaperProvider theme={theme} settings={{ icon: PaperIcon }}>
          <AuthProvider>
            <SeoHead />
            <StatusBar style="light" translucent backgroundColor="transparent" />
            <RootNavigator />
            <BadgeToast />
          </AuthProvider>
        </PaperProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
