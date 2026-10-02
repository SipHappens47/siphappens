import React from 'react';
import { Alert, AppState, Linking } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CameraScreen from '../app/camera';
import ExploreCameraScreen from '../app/camera/explore';
import { getScanErrorMessage } from '../src/utils/scanErrors';

let mockPermission = { granted: false, canAskAgain: true };
const mockRequest = jest.fn(); const mockGet = jest.fn().mockResolvedValue({});
const mockBack = jest.fn(); const mockPush = jest.fn();
const mockPick = jest.fn(); const mockLibrary = jest.fn(); const mockRecognize = jest.fn();
jest.mock('expo-camera', () => ({ CameraView: 'CameraView', useCameraPermissions: () => [mockPermission, mockRequest, mockGet] }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-native-paper', () => {
  const React = require('react'); const { Text, Pressable, View } = require('react-native');
  return { MD3DarkTheme: { colors: {} }, Text, ActivityIndicator: View, IconButton: View, Button: ({ children, onPress, disabled }: any) => <Pressable onPress={onPress} disabled={disabled}><Text>{children}</Text></Pressable> };
});
jest.mock('expo-image-picker', () => ({ requestMediaLibraryPermissionsAsync: () => mockLibrary(), launchImageLibraryAsync: () => mockPick() }));
jest.mock('expo-image-manipulator', () => ({ manipulateAsync: jest.fn().mockResolvedValue({ base64: 'synthetic', uri: 'local:resized' }), SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('../src/services/api', () => ({ apiService: { recognizeSpirit: (...args: any[]) => mockRecognize(...args) } }));
jest.mock('../src/utils/sound', () => ({ playPourSound: jest.fn() }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'alice' } }) }));
jest.mock('../src/utils/aiScanConsent', () => ({ ensureAiScanConsent: jest.fn().mockResolvedValue(true) }));

const axiosError = (status?: number, message?: string) => ({
  isAxiosError: true, config: {}, message: 'Request failed',
  response: status ? { status, data: message ? { statusCode: status, message } : {} } : undefined,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
  mockPermission = { granted: false, canAskAgain: true };
  mockLibrary.mockResolvedValue({ status: 'granted' });
  mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: 'local:test' }] });
});

describe('scan error wording', () => {
  it('keeps the server reason for client errors such as the daily limit', () => {
    expect(getScanErrorMessage(axiosError(429, 'Daily scan limit of 30 reached. Try again tomorrow.'))).toBe('Daily scan limit of 30 reached. Try again tomorrow.');
    expect(getScanErrorMessage(axiosError(400, 'Image too large'))).toBe('Image too large');
  });
  it('does not show raw server or network internals', () => {
    expect(getScanErrorMessage(axiosError(500, 'Internal server error'))).toMatch(/couldn't identify the bottle right now/);
    expect(getScanErrorMessage(axiosError())).toMatch(/Check your connection/);
    expect(getScanErrorMessage(new Error('manipulator failed'))).toBe('Failed to analyze bottle. Please try again.');
  });
});

describe.each([
  ['pour camera', CameraScreen],
  ['explore camera', ExploreCameraScreen],
])('%s scan failure', (_name, Screen) => {
  it('shows the server message and offers manual search from the error', async () => {
    mockRecognize.mockRejectedValue(axiosError(429, 'Daily scan limit of 30 reached. Try again tomorrow.'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const view = render(<Screen />);
    fireEvent.press(view.getByText('Gallery'));
    await waitFor(() => expect(alert).toHaveBeenCalled());
    const [title, message, buttons] = alert.mock.calls[0];
    expect(title).toBe('Scan failed');
    expect(message).toBe('Daily scan limit of 30 reached. Try again tomorrow.');
    buttons!.find(b => b.text === 'Search Manually')!.onPress!();
    expect(mockPush).toHaveBeenCalledWith('/camera/manual-search');
  });
});

describe('explore camera denial recovery', () => {
  it('keeps Gallery and Go Back usable after camera denial', async () => {
    mockRecognize.mockResolvedValue({ matches: [{ name: 'Synthetic bottle' }] });
    const view = render(<ExploreCameraScreen />);
    expect(view.getByText('Grant Permission')).toBeTruthy();
    fireEvent.press(view.getByText('Gallery'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/spirit/explore-result' })));
    expect(mockRequest).not.toHaveBeenCalled();
    fireEvent.press(view.getByText('Go Back')); expect(mockBack).toHaveBeenCalled();
  });
  it('offers Settings on permanent denial and rechecks permission when the app becomes active', async () => {
    mockPermission = { granted: false, canAskAgain: false };
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    let listener!: (state: any) => void;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => { listener = callback; return { remove: jest.fn() }; });
    const view = render(<ExploreCameraScreen />);
    expect(view.queryByText('Grant Permission')).toBeNull();
    fireEvent.press(view.getByText('Open Settings')); expect(settings).toHaveBeenCalled();
    await act(async () => { listener('active'); }); expect(mockGet).toHaveBeenCalled();
    settings.mockRestore();
  });
});
