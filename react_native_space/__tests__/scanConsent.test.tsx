import React from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CameraScreen from '../app/camera';
import ExploreCameraScreen from '../app/camera/explore';
import { AI_SCAN_CONSENT_TITLE, aiScanConsentKey } from '../src/utils/aiScanConsent';

// NF-5: the real consent module guards the capture button on both scan
// screens and Explore's Gallery, not just the pour camera's Gallery.
// Native modules and the API are mocked; nothing leaves the process.
let mockPermission = { granted: true, canAskAgain: true };
const mockTake = jest.fn(); const mockPush = jest.fn();
const mockPick = jest.fn(); const mockLibrary = jest.fn(); const mockRecognize = jest.fn();
jest.mock('expo-camera', () => {
  const React = require('react'); const { View } = require('react-native');
  const CameraView = React.forwardRef(({ children }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ takePictureAsync: (...args: any[]) => mockTake(...args) }));
    return <View>{children}</View>;
  });
  return { CameraView, useCameraPermissions: () => [mockPermission, jest.fn(), jest.fn().mockResolvedValue({})] };
});
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-native-paper', () => {
  const React = require('react'); const { Text, Pressable, View } = require('react-native');
  return { MD3DarkTheme: { colors: {} }, Text, ActivityIndicator: View, IconButton: View, Button: ({ children, onPress, disabled }: any) => <Pressable onPress={onPress} disabled={disabled}><Text>{children}</Text></Pressable> };
});
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'MaterialCommunityIcons' }));
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: () => mockLibrary(), launchImageLibraryAsync: () => mockPick() }));
jest.mock('expo-image-manipulator', () => ({ manipulateAsync: jest.fn().mockResolvedValue({ base64: 'synthetic', uri: 'local:resized' }), SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('../src/services/api', () => ({ apiService: { recognizeSpirit: (...args: any[]) => mockRecognize(...args) } }));
jest.mock('../src/utils/sound', () => ({ playPourSound: jest.fn() }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice' } }) }));

// Answer the consent dialog: press a button, or dismiss it (null).
const answer = (label: 'Continue' | 'Not now' | null) =>
  jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons, options) => {
    if (label === null) options?.onDismiss?.();
    else buttons?.find(b => b.text === label)?.onPress?.();
  });
const consentCalls = (alert: jest.SpyInstance) => alert.mock.calls.filter(([title]) => title === AI_SCAN_CONSENT_TITLE);

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  mockPermission = { granted: true, canAskAgain: true };
  mockTake.mockResolvedValue({ uri: 'local:photo' });
  mockLibrary.mockResolvedValue({ status: 'granted' });
  mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: 'local:picked' }] });
  mockRecognize.mockResolvedValue({ matches: [{ spiritName: 'Synthetic bottle' }] });
});

describe.each([
  ['pour camera', CameraScreen, '/camera/spirit-details'],
  ['explore camera', ExploreCameraScreen, '/spirit/explore-result'],
])('%s consent', (_name, Screen, resultPath) => {
  it.each([['Not now', 'Not now'], ['dismissing', null]] as const)('capture: %s takes no photo and sends nothing', async (_l, label) => {
    const alert = answer(label);
    const view = render(<Screen />);
    fireEvent.press(view.getByLabelText('Take photo'));
    await waitFor(() => expect(consentCalls(alert)).toHaveLength(1));
    await new Promise(r => setTimeout(r, 0));
    expect(mockTake).not.toHaveBeenCalled();
    expect(mockRecognize).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(aiScanConsentKey('alice'))).toBeNull();
  });

  it('capture: Continue takes the photo, scans, and is not asked again', async () => {
    const alert = answer('Continue');
    const view = render(<Screen />);
    fireEvent.press(view.getByLabelText('Take photo'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: resultPath })));
    expect(mockTake).toHaveBeenCalledTimes(1);
    expect(mockRecognize).toHaveBeenCalledWith('synthetic');
    expect(await AsyncStorage.getItem(aiScanConsentKey('alice'))).not.toBeNull();
    fireEvent.press(view.getByLabelText('Take photo'));
    await waitFor(() => expect(mockTake).toHaveBeenCalledTimes(2));
    expect(consentCalls(alert)).toHaveLength(1);
  });

  it('Gallery: Not now opens no permission prompt or picker and sends nothing', async () => {
    const alert = answer('Not now');
    const view = render(<Screen />);
    fireEvent.press(view.getByText('Gallery'));
    await waitFor(() => expect(consentCalls(alert)).toHaveLength(1));
    await new Promise(r => setTimeout(r, 0));
    expect(mockLibrary).not.toHaveBeenCalled();
    expect(mockPick).not.toHaveBeenCalled();
    expect(mockRecognize).not.toHaveBeenCalled();
  });

  it('Gallery: Continue asks before the picker, then scans', async () => {
    const order: string[] = [];
    jest.spyOn(Alert, 'alert').mockImplementation((title, _m, buttons) => {
      order.push(String(title)); buttons?.find(b => b.text === 'Continue')?.onPress?.();
    });
    mockLibrary.mockImplementation(async () => { order.push('library'); return { status: 'granted' }; });
    const view = render(<Screen />);
    fireEvent.press(view.getByText('Gallery'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: resultPath })));
    expect(order).toEqual([AI_SCAN_CONSENT_TITLE, 'library']);
    expect(mockRecognize).toHaveBeenCalledWith('synthetic');
  });
});
