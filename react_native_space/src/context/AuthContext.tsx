import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { User, AuthResponse } from '../types';

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
