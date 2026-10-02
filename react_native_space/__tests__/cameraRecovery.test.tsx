import React from 'react';
import { AppState, Linking } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CameraScreen from '../app/camera';

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

beforeEach(() => { jest.clearAllMocks(); jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() })); mockPermission = { granted: false, canAskAgain: true }; mockLibrary.mockResolvedValue({ status: 'granted', accessPrivileges: 'limited' }); mockPick.mockResolvedValue({ canceled: true }); });

describe('camera denial recovery using mocked native modules', () => {
  it('keeps Gallery, manual and back available after camera denial; cancelling creates no recognition call', async () => {
    const view = render(<CameraScreen />);
    fireEvent.press(view.getByText('Gallery'));
    await waitFor(() => expect(mockPick).toHaveBeenCalled());
    expect(mockRequest).not.toHaveBeenCalled(); expect(mockRecognize).not.toHaveBeenCalled();
    fireEvent.press(view.getByText('Search Manually Instead')); expect(mockPush).toHaveBeenCalledWith('/camera/manual-search');
    fireEvent.press(view.getByText('Go Back')); expect(mockBack).toHaveBeenCalled();
  });
  it('uses the existing image-processing route for selected images with limited library access', async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: 'local:test' }] }); mockRecognize.mockResolvedValue({ matches: [{ name: 'Synthetic bottle' }] });
    const view = render(<CameraScreen />); fireEvent.press(view.getByText('Gallery'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/camera/spirit-details' })));
    expect(mockRequest).not.toHaveBeenCalled(); expect(mockRecognize).toHaveBeenCalledWith('synthetic');
  });
  it('offers Settings on permanent denial and rechecks permission when the app becomes active', async () => {
    mockPermission = { granted: false, canAskAgain: false };
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    let listener!: (state: any) => void;
    const subscription = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => { listener = callback; return { remove: jest.fn() }; });
    const view = render(<CameraScreen />); expect(view.queryByText('Grant Permission')).toBeNull();
    fireEvent.press(view.getByText('Open Settings')); expect(settings).toHaveBeenCalled(); expect(mockRequest).not.toHaveBeenCalled();
    await act(async () => { listener('active'); }); expect(mockGet).toHaveBeenCalled();
    settings.mockRestore(); subscription.mockRestore();
  });
  it('does not launch the picker or recognition when library access is denied', async () => {
    mockLibrary.mockResolvedValue({ status: 'denied' }); const view = render(<CameraScreen />); fireEvent.press(view.getByText('Gallery'));
    await waitFor(() => expect(mockLibrary).toHaveBeenCalled()); expect(mockPick).not.toHaveBeenCalled(); expect(mockRecognize).not.toHaveBeenCalled();
  });
});
