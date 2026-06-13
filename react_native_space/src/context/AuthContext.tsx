import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import { User, AuthResponse } from '../types';

// Show notifications even when the app is foregrounded (banner + sound).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request push permission, fetch the Expo push token and register it with the
// backend. Fire-and-forget: any failure (denied permission, web platform,
// missing project id) is logged and ignored.
async function registerPushToken() {
  try {
    if (Platform.OS === 'web') return; // Expo push tokens need a device

    // Android requires a notification channel for notifications to display.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C6A85C',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }
    if (status !== 'granted') {
      console.log('[Push] Permission not granted - skipping token registration');
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse?.data;
    if (!token) return;

    await apiService.savePushToken(token);
    await AsyncStorage.setItem('expoPushToken', token);
    console.log('[Push] Token registered');
  } catch (error) {
    console.error('[Push] Token registration failed:', error);
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (email: string, password: string, name: string, additionalData?: any) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AuthContext] checkAuth started');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );
      
      const authPromise = authService.getCurrentUser();
      
      const currentUser = await Promise.race([authPromise, timeoutPromise]) as User | null;
      
      console.log('[AuthContext] checkAuth result:', currentUser?.id ?? 'no user');
      setUser(currentUser ?? null);
    } catch (error: any) {
      console.error('[AuthContext] Auth check error:', error?.message ?? error);
      // Clear invalid token
      try {
        await authService.logout();
      } catch (e) {
        console.error('[AuthContext] Logout failed:', e);
      }
      setUser(null);
    } finally {
      console.log('[AuthContext] checkAuth complete, setting loading=false');
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Starting login process');
      const response = await authService.login(email, password);
      console.log('[AuthContext] Login response received:', response ? 'success' : 'no response');
      if (response?.user) {
        console.log('[AuthContext] Setting user:', response.user.id);
        setUser(response.user);
        registerPushToken(); // fire-and-forget
      } else {
        console.warn('[AuthContext] No user in response');
      }
      return response; // Return response so caller can access distillery info
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error?.response?.status, error?.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, additionalData?: any) => {
    try {
      console.log('[AuthContext] Starting signup process');
      const response = await authService.signup(email, password, name, additionalData);
      console.log('[AuthContext] Signup response received:', response ? 'success' : 'no response');
      if (response?.user) {
        console.log('[AuthContext] Setting user:', response.user.id);
        setUser(response.user);
        registerPushToken(); // fire-and-forget
      } else {
        console.warn('[AuthContext] No user in response');
      }
      return response; // Return response so caller can access distillery info
    } catch (error: any) {
      console.error('[AuthContext] Signup error:', error?.response?.status, error?.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
