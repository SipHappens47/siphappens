import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/colors';

export default function Index() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!loading && !hasNavigated.current) {
      hasNavigated.current = true;
      
      console.log('[Index] Redirecting - isAuthenticated:', isAuthenticated);
      
      if (isAuthenticated) {
        // Always redirect to tabs for both users and distillery accounts
        console.log('[Index] Redirecting to /tabs');
        router.replace('/tabs');
      } else {
        console.log('[Index] Redirecting to /auth/welcome');
        router.replace('/auth/welcome');
      }
    }
  }, [isAuthenticated, loading, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
