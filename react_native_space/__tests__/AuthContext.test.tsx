import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { authService } from '../src/services/auth';

jest.mock('../src/services/auth');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result?.current?.loading).toBe(true);
    expect(result?.current?.isAuthenticated).toBe(false);
  });

  it('should login successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
    (authService.login as jest.Mock).mockResolvedValue({ token: 'token123', user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result?.current?.loading).toBe(false);
    });

    await result?.current?.login?.('test@example.com', 'password123');

    await waitFor(() => {
      expect(result?.current?.isAuthenticated).toBe(true);
      expect(result?.current?.user?.email).toBe('test@example.com');
    });
  });

  it('should handle login error', async () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
    (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result?.current?.loading).toBe(false);
    });

    await expect(
      result?.current?.login?.('test@example.com', 'wrongpassword')
    ).rejects.toThrow('Invalid credentials');

    expect(result?.current?.isAuthenticated).toBe(false);
  });

  it('should logout successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (authService.logout as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result?.current?.isAuthenticated).toBe(true);
    });

    await result?.current?.logout?.();

    await waitFor(() => {
      expect(result?.current?.isAuthenticated).toBe(false);
      expect(result?.current?.user).toBeNull();
    });
  });
});
