import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiService } from './api';
import { AuthResponse, User } from '../types';

const TOKEN_KEY = 'authToken';
const CACHED_USER_KEY = 'cachedUser';

// Platform-specific secure storage
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const authService = {
  async signup(email: string, password: string, name: string, additionalData?: any): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Calling signup API');
      const ageVerificationTimestamp = new Date().toISOString();
      const signupPayload = {
        email,
        password,
        name,
        ageVerified: true,
        ageVerificationTimestamp,
        ...additionalData,
      };
      console.log('[AuthService] Signup payload:', { ...signupPayload, password: '***' });
      const response = await apiService.signup(signupPayload);
      console.log('[AuthService] Signup API response received:', response ? 'success' : 'no response');
      
      if (response?.token) {
        console.log('[AuthService] Storing token securely');
        await secureStorage.setItem(TOKEN_KEY, response.token);
        if (response.user) await this.cacheUser(response.user);
      } else {
        console.warn('[AuthService] No token in signup response');
      }

      return response ?? { token: '', user: {} as User };
    } catch (error: any) {
      console.error('[AuthService] Signup error:', error?.response?.status, error?.response?.data, error?.message);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Calling login API');
      const response = await apiService.login({ email, password });
      console.log('[AuthService] Login API response received:', response ? 'success' : 'no response');
      
      if (response?.token) {
        console.log('[AuthService] Storing token securely');
        await secureStorage.setItem(TOKEN_KEY, response.token);
        if (response.user) await this.cacheUser(response.user);
      } else {
        console.warn('[AuthService] No token in login response');
      }

      return response ?? { token: '', user: {} as User };
    } catch (error: any) {
      console.error('[AuthService] Login error:', error?.response?.status, error?.response?.data, error?.message);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await secureStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(CACHED_USER_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Cache the user locally so the app can show a logged-in state instantly on
  // launch (and stay logged in even if the server is briefly unreachable).
  async cacheUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Cache user error:', error);
    }
  },

  async getCachedUser(): Promise<User | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('[AuthService] getCurrentUser - getting token');
      const token = await this.getToken();
      
      if (!token) {
        console.log('[AuthService] getCurrentUser - no token found');
        return null;
      }
      
      console.log('[AuthService] getCurrentUser - token found, calling getMe API');
      const user = await apiService.getMe();
      console.log('[AuthService] getCurrentUser - API returned user:', user?.id ?? 'null');
      return user ?? null;
    } catch (error: any) {
      console.error('[AuthService] Get current user error:', error?.message ?? error);
      return null;
    }
  },
};
