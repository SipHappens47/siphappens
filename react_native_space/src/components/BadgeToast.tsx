import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Animated, Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

// --- Global toast trigger ---------------------------------------------------
export interface BadgeToastPayload {
  name: string;
  percentage: number;
  nextTier?: string | null;
}

type Listener = (payload: BadgeToastPayload) => void;
const listeners = new Set<Listener>();

export function showBadgeToast(payload: BadgeToastPayload) {
  listeners.forEach((l) => l(payload));
}

// --- Toast component (mounted once, globally, in app/_layout.tsx) -----------
const AUTO_DISMISS_MS = 4000;

export function BadgeToast() {
  const router = useRouter();
  const [payload, setPayload] = useState<BadgeToastPayload | null>(null);
  const translateY = useRef(new Animated.Value(120)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener: Listener = (p) => setPayload(p);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!payload) return;

    translateY.setValue(120);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [payload]);

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.timing(translateY, {
      toValue: 120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setPayload(null));
  };

  const openBadges = () => {
    dismiss();
    router.push('/profile' as any);
  };

  if (!payload) return null;

  const tier = payload.nextTier ?? 'bronze';
  const message = `${payload.name} — ${Math.round(payload.percentage)}% to ${tier}`;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }] }]}>
      <Pressable style={styles.toast} onPress={dismiss} onLongPress={openBadges}>
        <Ionicons name="trophy" size={22} color={Colors.background} />
        <View style={styles.textWrap}>
          <Text style={styles.text}>{message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 90,
    zIndex: 9998,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  textWrap: {
    flex: 1,
  },
  text: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
