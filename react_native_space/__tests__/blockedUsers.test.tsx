import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import BlockedUsersScreen from '../app/profile/blocked';

const mockGetBlocked = jest.fn(); const mockUnblock = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-native-paper', () => {
  const React = require('react'); const { Text, Pressable } = require('react-native');
  return {
    MD3DarkTheme: { colors: {} }, Text,
    IconButton: ({ icon, onPress }: any) => <Pressable accessibilityLabel={icon} onPress={onPress} />,
    Button: ({ children, onPress, disabled }: any) => <Pressable onPress={onPress} disabled={disabled}><Text>{children}</Text></Pressable>,
  };
});
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice' }, logout: jest.fn() }) }));
jest.mock('../src/services/api', () => ({
  apiService: { getBlockedUsers: () => mockGetBlocked(), unblockUser: (id: string) => mockUnblock(id) },
}));

beforeEach(() => { jest.clearAllMocks(); mockUnblock.mockResolvedValue({ success: true }); });

describe('Blocked users screen', () => {
  it('lists blocked users and unblocks one with a single tap', async () => {
    mockGetBlocked.mockResolvedValue([
      { id: 'bob', name: 'Bob', blockedAt: '2026-10-01T10:00:00.000Z' },
      { id: 'carol', name: 'Carol', blockedAt: '2026-10-02T10:00:00.000Z' },
    ]);
    const view = render(<BlockedUsersScreen />);
    await waitFor(() => expect(view.getByText('Bob')).toBeTruthy(), { timeout: 5000 });
    fireEvent.press(view.getAllByText('Unblock')[0]);
    await waitFor(() => expect(view.queryByText('Bob')).toBeNull());
    expect(mockUnblock).toHaveBeenCalledWith('bob');
    expect(view.getByText('Carol')).toBeTruthy();
  });

  it('shows a calm empty state', async () => {
    mockGetBlocked.mockResolvedValue([]);
    const view = render(<BlockedUsersScreen />);
    await waitFor(() => expect(view.getByText("You haven't blocked anyone.")).toBeTruthy(), { timeout: 5000 });
  });

  it('shows a retryable load failure instead of an empty list', async () => {
    mockGetBlocked.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([{ id: 'bob', name: 'Bob', blockedAt: '' }]);
    const view = render(<BlockedUsersScreen />);
    await waitFor(() => expect(view.getByText('Could not load blocked users. Please try again.')).toBeTruthy(), { timeout: 5000 });
    expect(view.queryByText("You haven't blocked anyone.")).toBeNull();
    fireEvent.press(view.getByText('Retry'));
    await waitFor(() => expect(view.getByText('Bob')).toBeTruthy());
  });
});
