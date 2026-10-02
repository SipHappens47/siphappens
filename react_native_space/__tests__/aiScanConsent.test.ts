import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_SCAN_CONSENT_MESSAGE, aiScanConsentKey, ensureAiScanConsent, hasAiScanConsent } from '../src/utils/aiScanConsent';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../src/constants/legal';

// Answer the consent dialog by pressing the named button.
const answer = (label: 'Continue' | 'Not now' | null) => {
  jest.restoreAllMocks();
  return jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons, options) => {
    if (label === null) options?.onDismiss?.();
    else buttons?.find(b => b.text === label)?.onPress?.();
  });
};

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('Gemini scan consent', () => {
  it('states the Gemini, free-tier improvement, human review and photo guidance facts', () => {
    expect(AI_SCAN_CONSENT_MESSAGE).toContain("Google's Gemini AI");
    expect(AI_SCAN_CONSENT_MESSAGE).toContain('free service');
    expect(AI_SCAN_CONSENT_MESSAGE).toContain('improve its products and services');
    expect(AI_SCAN_CONSENT_MESSAGE).toContain('human reviewers may see them');
    expect(AI_SCAN_CONSENT_MESSAGE).toContain('avoid photos that show people or personal information');
    expect(AI_SCAN_CONSENT_MESSAGE).toContain('search for bottles manually');
  });

  it('asks once per account and remembers Continue', async () => {
    const alert = answer('Continue');
    await expect(ensureAiScanConsent('alice')).resolves.toBe(true);
    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0][2]!.map(b => b.text);
    expect(buttons).toEqual(['Not now', 'Continue']);
    expect(await AsyncStorage.getItem(aiScanConsentKey('alice'))).not.toBeNull();

    await expect(ensureAiScanConsent('alice')).resolves.toBe(true);
    expect(alert).toHaveBeenCalledTimes(1);
    expect(await hasAiScanConsent('bob')).toBe(false);
  });

  it('stores nothing on Not now or dismiss, and asks again next time', async () => {
    answer('Not now');
    await expect(ensureAiScanConsent('alice')).resolves.toBe(false);
    answer(null);
    await expect(ensureAiScanConsent('alice')).resolves.toBe(false);
    expect(await hasAiScanConsent('alice')).toBe(false);
    const alert = answer('Continue');
    await expect(ensureAiScanConsent('alice')).resolves.toBe(true);
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('keeps consent separate for each account on the same device', async () => {
    answer('Continue');
    await ensureAiScanConsent('alice');
    const alert = answer('Not now');
    await expect(ensureAiScanConsent('bob')).resolves.toBe(false);
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it('matches the in-app policy and uses 18+ wording', () => {
    expect(PRIVACY_POLICY).toContain("Google's Gemini AI");
    expect(PRIVACY_POLICY).toContain('human reviewers may');
    expect(PRIVACY_POLICY).toContain('18 or older');
    expect(TERMS_OF_SERVICE).toContain('18 or older');
    expect(`${PRIVACY_POLICY}${TERMS_OF_SERVICE}`).not.toMatch(/drinking age/i);
  });
});
