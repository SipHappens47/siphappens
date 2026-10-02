import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreatePourScreen from '../app/pour/create';

const mockReplace = jest.fn(); const mockBack = jest.fn();
const mockCreate = jest.fn(); const mockUpdate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, back: mockBack }), useLocalSearchParams: () => ({ spiritId: 'spirit-1' }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-native-paper', () => {
  const React = require('react'); const { Text, Pressable, View, TextInput } = require('react-native');
  return {
    MD3DarkTheme: { colors: {} }, Text, SegmentedButtons: View,
    TextInput: ({ label, value, onChangeText }: any) => <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} />,
    Switch: ({ value, onValueChange }: any) => <Pressable accessibilityLabel="Share switch" onPress={() => onValueChange(!value)}><Text>{value ? 'on' : 'off'}</Text></Pressable>,
    Button: ({ children, onPress, disabled }: any) => <Pressable onPress={onPress} disabled={disabled}><Text>{children}</Text></Pressable>,
  };
});
jest.mock('../src/components/FlavorTagSelector', () => ({ FlavorTagSelector: () => null }));
jest.mock('../src/components/TastingNotes', () => ({ TastingNotes: () => null }));
jest.mock('../src/components/ImagePickerComponent', () => ({ ImagePickerComponent: () => null }));
jest.mock('../src/components/BadgeToast', () => ({ showBadgeToast: jest.fn() }));
jest.mock('../src/services/upload', () => ({ uploadService: { uploadImage: jest.fn() } }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice' } }) }));
jest.mock('../src/services/api', () => ({
  apiService: {
    getSpirit: jest.fn().mockResolvedValue({ id: 'spirit-1', name: 'Synthetic Gin' }),
    createPour: (...args: any[]) => mockCreate(...args),
    updatePour: (...args: any[]) => mockUpdate(...args),
    getPublicUserBadges: jest.fn().mockResolvedValue([]),
  },
}));

const press = (alertCall: any[], label: string) => alertCall[2].find((b: any) => b.text === label).onPress();

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockResolvedValue({ id: 'pour-1' });
  mockUpdate.mockResolvedValue({ id: 'pour-1', isShared: true });
});

async function fillAndSave(share = false) {
  const view = render(<CreatePourScreen />);
  await waitFor(() => expect(view.getByText('Synthetic Gin')).toBeTruthy(), { timeout: 5000 });
  fireEvent.changeText(view.getByLabelText('Why It Hit *'), 'Bright citrus and juniper.');
  if (share) fireEvent.press(view.getByLabelText('Share switch'));
  fireEvent.press(view.getByText('Save Pour'));
  return view;
}

describe('saying where a new pour went (N2)', () => {
  it('keeps pours private by default, says so, and offers a one-tap share', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await fillAndSave();
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ isShared: false }));
    const saved = alert.mock.calls[0];
    expect(saved[0]).toBe('Saved privately');
    expect(saved[1]).toContain('Only you can see it');
    expect(saved[2]!.map(b => b.text)).toEqual(['Share to The Bar', 'OK']);

    await press(saved, 'Share to The Bar');
    expect(mockUpdate).toHaveBeenCalledWith('pour-1', { isShared: true });
    const shared = alert.mock.calls[1];
    expect(shared[0]).toBe('Shared to The Bar');
    press(shared, 'OK');
    expect(mockReplace).toHaveBeenCalledWith('/tabs/shelf');
  });

  it('keeps the pour private and says so when sharing fails', async () => {
    mockUpdate.mockRejectedValue(new Error('offline'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await fillAndSave();
    await waitFor(() => expect(alert).toHaveBeenCalled());
    await press(alert.mock.calls[0], 'Share to The Bar');
    expect(alert.mock.calls[1][0]).toBe("Couldn't share");
  });

  it('confirms a shared pour was posted, with no extra share step', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await fillAndSave(true);
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ isShared: true }));
    expect(alert.mock.calls[0][0]).toBe('Posted to The Bar');
    expect(alert.mock.calls[0][2]!.map(b => b.text)).toEqual(['OK']);
    press(alert.mock.calls[0], 'OK');
    expect(mockReplace).toHaveBeenCalledWith('/tabs/shelf');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
