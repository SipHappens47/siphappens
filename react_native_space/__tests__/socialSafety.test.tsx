import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '../app/notifications';
import PourDetailsScreen from '../app/pour/[id]';
import PublicUserProfileScreen from '../app/user/[userId]';

const mockBack = jest.fn(); const mockPush = jest.fn(); const mockReplace = jest.fn();
let mockParams: any = {};
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace }), useLocalSearchParams: () => mockParams }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-native-paper', () => {
  const React = require('react'); const { Text, Pressable, View } = require('react-native');
  return {
    MD3DarkTheme: { colors: {} }, Text, ActivityIndicator: View, Card: View,
    Avatar: { Image: View, Icon: View },
    IconButton: ({ icon, onPress, accessibilityLabel }: any) => <Pressable accessibilityLabel={accessibilityLabel ?? icon} onPress={onPress} />,
    Button: ({ children, onPress, disabled }: any) => <Pressable onPress={onPress} disabled={disabled}><Text>{children}</Text></Pressable>,
  };
});
jest.mock('../src/components/gamification/BadgesGrid', () => ({ BadgesGrid: () => null }));
jest.mock('../src/components/gamification/TasteSummaryCard', () => ({ TasteSummaryCard: () => null }));
jest.mock('../src/components/gamification/JourneyMapSection', () => ({ JourneyMapSection: () => null }));
jest.mock('../src/services/upload', () => ({ uploadService: { getImageUrl: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice' } }) }));
const mockApi: Record<string, jest.Mock> = {};
jest.mock('../src/services/api', () => ({ apiService: new Proxy({}, { get: (_t, name: string) => (mockApi[name] ??= jest.fn()) }) }));

const notFound = () => Promise.reject({ response: { status: 404, data: { message: 'User not found' } } });

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(mockApi)) delete mockApi[key];
  mockParams = {};
});

describe('declining connection requests (N4)', () => {
  it('Decline in Notifications removes the pending request with DELETE /api/connections/:id', async () => {
    mockApi.getPendingRequests = jest.fn().mockResolvedValue([
      { id: 'conn-1', status: 'Pending', initiator: { id: 'bob', name: 'Bob' }, receiver: { id: 'alice' }, createdAt: new Date().toISOString() },
    ]);
    mockApi.getReceivedCheers = jest.fn().mockResolvedValue([]);
    mockApi.removeConnection = jest.fn().mockResolvedValue({ message: 'ok' });
    const view = render(<NotificationsScreen />);
    await waitFor(() => expect(view.getByText('Decline')).toBeTruthy(), { timeout: 5000 });
    fireEvent.press(view.getByText('Decline'));
    await waitFor(() => expect(view.queryByText('Decline')).toBeNull(), { timeout: 5000 });
    expect(mockApi.removeConnection).toHaveBeenCalledWith('conn-1');
    expect(mockApi.acceptConnectionRequest).toBeUndefined();
    expect(view.getByText('All quiet')).toBeTruthy();
  });

  it('Decline on the requester profile removes the request', async () => {
    mockParams = { userId: 'bob' };
    mockApi.getPublicProfile = jest.fn().mockResolvedValue({ id: 'bob', name: 'Bob' });
    mockApi.getPublicUserBadges = jest.fn().mockResolvedValue([]);
    mockApi.getPublicUserTasteSummary = jest.fn().mockResolvedValue(null);
    mockApi.getUserPublicPours = jest.fn().mockResolvedValue([]);
    mockApi.getConnections = jest.fn().mockResolvedValue([]);
    mockApi.getPendingRequests = jest.fn().mockResolvedValue([{ id: 'conn-1', status: 'Pending', initiator: { id: 'bob' } }]);
    mockApi.getSentRequests = jest.fn().mockResolvedValue([]);
    mockApi.getMuteStatus = jest.fn().mockResolvedValue({ isMuted: false });
    mockApi.getBlockedUserIds = jest.fn().mockResolvedValue([]);
    mockApi.removeConnection = jest.fn().mockResolvedValue({ message: 'ok' });
    const view = render(<PublicUserProfileScreen />);
    await waitFor(() => expect(view.getByText('Accept Follow')).toBeTruthy(), { timeout: 5000 });
    fireEvent.press(view.getByText('Decline'));
    await waitFor(() => expect(view.getByText('Follow (request)')).toBeTruthy(), { timeout: 5000 });
    expect(mockApi.removeConnection).toHaveBeenCalledWith('conn-1');
  });
});

describe('blocked or missing profiles', () => {
  it('shows a calm not-available screen with Go Back instead of an error alert', async () => {
    mockParams = { userId: 'bob' };
    for (const name of ['getPublicProfile', 'getPublicUserBadges', 'getPublicUserTasteSummary', 'getUserPublicPours']) mockApi[name] = jest.fn(notFound);
    for (const name of ['getConnections', 'getPendingRequests', 'getSentRequests']) mockApi[name] = jest.fn().mockResolvedValue([]);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const view = render(<PublicUserProfileScreen />);
    await waitFor(() => expect(view.getByText('Profile not available')).toBeTruthy(), { timeout: 5000 });
    expect(alert).not.toHaveBeenCalled();
    fireEvent.press(view.getByText('Go Back'));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('reporting a pour (N6)', () => {
  const pour = (userId: string) => ({ id: 'pour-9', userId, whyItHit: 'Synthetic note', spirit: { name: 'Synthetic Rum' }, createdAt: '2026-10-01T00:00:00Z' });

  it("offers Report on other people's pours and sends targetType 'pour'", async () => {
    mockParams = { id: 'pour-9' };
    mockApi.getPour = jest.fn().mockResolvedValue(pour('bob'));
    mockApi.reportContent = jest.fn().mockResolvedValue({ success: true });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const view = render(<PourDetailsScreen />);
    await waitFor(() => expect(view.getByText('Synthetic Rum')).toBeTruthy(), { timeout: 5000 });
    expect(view.queryByLabelText('pencil')).toBeNull();
    fireEvent.press(view.getByLabelText('Report this pour'));
    const [title, , buttons, options] = alert.mock.calls[0];
    expect(title).toBe('Report this pour');
    expect(options).toEqual({ cancelable: true });
    await buttons!.find(b => b.text === 'Spam')!.onPress!();
    expect(mockApi.reportContent).toHaveBeenCalledWith('pour', 'pour-9', 'Spam');
    expect(alert.mock.calls[1][0]).toBe('Reported');
  });

  it('does not offer Report on your own pour', async () => {
    mockParams = { id: 'pour-9' };
    mockApi.getPour = jest.fn().mockResolvedValue(pour('alice'));
    const view = render(<PourDetailsScreen />);
    await waitFor(() => expect(view.getByText('Synthetic Rum')).toBeTruthy(), { timeout: 5000 });
    expect(view.queryByLabelText('Report this pour')).toBeNull();
    expect(view.getByLabelText('pencil')).toBeTruthy();
  });
});
