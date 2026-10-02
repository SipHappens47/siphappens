import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// One-time consent before the first bottle photo is sent for AI recognition.
// Stored on this device per account; bump the version if the wording changes
// materially so everyone is asked again.
const CONSENT_VERSION = 1;

export const AI_SCAN_CONSENT_TITLE = 'Identify bottles with Google AI';
export const AI_SCAN_CONSENT_MESSAGE =
  "To identify a bottle, SipHappens sends your photo to Google's Gemini AI.\n\n" +
  'SipHappens uses Gemini\'s free service, so Google may use the photos it receives to improve its products and services, and human reviewers may see them.\n\n' +
  'Please avoid photos that show people or personal information.\n\n' +
  'Not now? Nothing is sent, and you can still look up bottles by name with Search.';

export const aiScanConsentKey = (userId: string) => `aiScanConsent.v${CONSENT_VERSION}.${userId}`;

export async function hasAiScanConsent(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await AsyncStorage.getItem(aiScanConsentKey(userId))) !== null;
  } catch {
    return false;
  }
}

function askForConsent(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Alert.alert is a no-op on web.
    return Promise.resolve(window.confirm(`${AI_SCAN_CONSENT_TITLE}\n\n${AI_SCAN_CONSENT_MESSAGE}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      AI_SCAN_CONSENT_TITLE,
      AI_SCAN_CONSENT_MESSAGE,
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continue', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Resolves true once this account has agreed; asks (once per account) otherwise. */
export async function ensureAiScanConsent(userId?: string | null): Promise<boolean> {
  if (await hasAiScanConsent(userId)) return true;
  const accepted = await askForConsent();
  if (accepted && userId) {
    try {
      await AsyncStorage.setItem(aiScanConsentKey(userId), JSON.stringify({ acceptedAt: new Date().toISOString() }));
    } catch {
      // Not stored: the user is simply asked again next time.
    }
  }
  return accepted;
}
