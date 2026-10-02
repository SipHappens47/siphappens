import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { authService } from '../src/services/auth';
import { apiService } from '../src/services/api';

jest.mock('../src/services/auth');
jest.mock('../src/services/api', () => ({
  apiService: { getMe: jest.fn(), savePushToken: jest.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getToken as jest.Mock).mockResolvedValue(null);
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result?.current?.loading).toBe(true);
    expect(result?.current?.isAuthenticated).toBe(false);
  });

  it('should login successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
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

  it('should restore a stored session and logout successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    (authService.getToken as jest.Mock).mockResolvedValue('token123');
    (authService.getCachedUser as jest.Mock).mockResolvedValue(mockUser);
    (apiService.getMe as jest.Mock).mockResolvedValue(mockUser);
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
