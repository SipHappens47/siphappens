import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

// The free-tier backend sleeps when idle and can take up to a minute to wake.
export const SLOW_SERVER_MESSAGE = 'Waking the server — the first load can take up to a minute.';
export const SLOW_SERVER_DELAY_MS = 8000;

/** True once `active` has stayed true for `delayMs`; resets when it ends. */
export function useSlowNotice(active: boolean, delayMs = SLOW_SERVER_DELAY_MS): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return active && slow;
}

export function SlowServerNotice({ active }: { active: boolean }) {
  if (!useSlowNotice(active)) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{ color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: spacing.sm }}
    >
      {SLOW_SERVER_MESSAGE}
    </Text>
  );
}
