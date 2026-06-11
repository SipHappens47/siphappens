import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/colors';
import { ONBOARDING_COMPLETE_KEY } from './onboarding';

export default function Index() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    const navigate = async () => {
      if (loading || hasNavigated.current) return;
      hasNavigated.current = true;

      console.log('[Index] Redirecting - isAuthenticated:', isAuthenticated);

      if (isAuthenticated) {
        // First login: run onboarding once
        let onboarded = 'true';
        try {
          onboarded = (await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)) ?? '';
        } catch {
          onboarded = 'true'; // storage failure: don't trap the user in onboarding
        }
        if (onboarded !== 'true') {
          console.log('[Index] Redirecting to /onboarding');
          router.replace('/onboarding' as any);
          return;
        }
        // Always redirect to tabs for both users and distillery accounts
        console.log('[Index] Redirecting to /tabs');
        router.replace('/tabs');
      } else {
        console.log('[Index] Redirecting to /auth/welcome');
        router.replace('/auth/welcome');
      }
    };
    navigate();
  }, [isAuthenticated, loading, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
