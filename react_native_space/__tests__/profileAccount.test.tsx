import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../app/profile';

let mockUser: any = { id: 'alice', email: 'alice@example.test' };
const mockPush = jest.fn(); const mockBack = jest.fn(); const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: (effect: any) => require('react').useEffect(effect, []) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-native-paper', () => {
  const React = require('react'); const { Text, Pressable, View } = require('react-native');
  const Dialog = ({ visible, children }: any) => (visible ? <View>{children}</View> : null);
  Dialog.Title = Text; Dialog.Content = View; Dialog.Actions = View;
  return {
    MD3DarkTheme: { colors: {} }, Text, Portal: View, Dialog,
    Avatar: { Image: View, Icon: View },
    IconButton: ({ icon, onPress }: any) => <Pressable accessibilityLabel={icon} onPress={onPress} />,
    Button: ({ children, onPress, disabled }: any) => <Pressable onPress={onPress} disabled={disabled}><Text>{children}</Text></Pressable>,
  };
});
jest.mock('../src/components/gamification/BadgesGrid', () => ({ BadgesGrid: () => null }));
jest.mock('../src/components/gamification/TasteSummaryCard', () => ({ TasteSummaryCard: () => null }));
jest.mock('../src/components/gamification/JourneyMapSection', () => ({ JourneyMapSection: () => null }));
jest.mock('../src/components/LoadNotice', () => ({ LoadNotice: () => null }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('../src/services/upload', () => ({ uploadService: { getImageUrl: jest.fn() } }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../src/services/api', () => ({
  apiService: {
    getProfile: jest.fn().mockResolvedValue({ id: 'alice', name: 'Alice' }),
    getExperienceBreakdown: jest.fn().mockResolvedValue({ nextLevel: null, needs: [] }),
    getBadges: jest.fn().mockResolvedValue([]),
    getTasteSummary: jest.fn().mockResolvedValue(undefined),
  },
}));

async function renderProfile() {
  const view = render(<ProfileScreen />);
  await waitFor(() => expect(view.getByText('Alice')).toBeTruthy(), { timeout: 5000 });
  return view;
}
const tapVersion = (view: any, times: number) => { for (let i = 0; i < times; i++) fireEvent.press(view.getByText('v1.0.1')); };

beforeEach(() => { jest.clearAllMocks(); mockUser = { id: 'alice', email: 'alice@example.test' }; });

describe('hidden seed dialog', () => {
  it('cannot be opened by a normal account', async () => {
    const view = await renderProfile();
    tapVersion(view, 7);
    expect(view.queryByText('Auto Import (CT + Iowa)')).toBeNull();
  });

  it('still opens for the SipHappens admin account', async () => {
    mockUser = { id: 'admin', email: 'official@siphappens.com' };
    const view = await renderProfile();
    tapVersion(view, 7);
    expect(view.getByText('Auto Import (CT + Iowa)')).toBeTruthy();
  });
});

describe('account controls on My Profile (N5)', () => {
  it('has a visible Account & settings entry that opens the account section', async () => {
    const view = await renderProfile();
    fireEvent.press(view.getByText('Account & settings'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/profile/edit', params: { section: 'account' } });
  });
});
