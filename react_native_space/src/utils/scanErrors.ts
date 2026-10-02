import { Alert } from 'react-native';
import { getApiErrorMessage } from './errors';

const SCAN_FAILED = "We couldn't identify the bottle right now. Please try again in a moment.";
const OFFLINE = "Couldn't reach SipHappens. Check your connection and try again.";

/** User-facing reason for a failed recognition request, keeping the server's own 4xx message (e.g. the daily scan limit). */
export function getScanErrorMessage(error: any): string {
  const status = error?.response?.status;
  if (typeof status === 'number') {
    return status >= 400 && status < 500 ? getApiErrorMessage(error, SCAN_FAILED) : SCAN_FAILED;
  }
  if (error?.isAxiosError || error?.config) return OFFLINE;
  return 'Failed to analyze bottle. Please try again.';
}

export function showScanError(error: any, onSearchManually: () => void) {
  Alert.alert('Scan failed', getScanErrorMessage(error), [
    { text: 'Search Manually', onPress: onSearchManually },
    { text: 'OK', style: 'cancel' },
  ]);
}
