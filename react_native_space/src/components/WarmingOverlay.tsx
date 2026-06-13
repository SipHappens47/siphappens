import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

// --- Global warming state -------------------------------------------------
// api.ts calls warmingStart(id)/warmingEnd(id) around slow requests; the
// overlay is visible while at least one slow request is in flight.
//
// We track in-flight requests by id (not a raw counter) so a duplicated or
// missing end can't make the count drift positive and leave the overlay stuck
// over the screen forever — warmingEnd is idempotent, and api.ts also pairs
// every start with a safety timeout so nothing can keep the overlay up
// longer than the request itself.
type Listener = (visible: boolean) => void;

const activeIds = new Set<number>();
const listeners = new Set<Listener>();

function emit() {
  const visible = activeIds.size > 0;
  listeners.forEach((l) => l(visible));
}

export function warmingStart(id: number) {
  activeIds.add(id);
  emit();
}

export function warmingEnd(id: number) {
  if (activeIds.delete(id)) emit();
}

// --- Overlay component ----------------------------------------------------
const BAR_WIDTH = Math.min(Dimensions.get('window').width * 0.6, 260);

export function WarmingOverlay() {
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const listener: Listener = (v) => setVisible(v);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // Indeterminate sweep: a gold segment glides across the track on loop
      progress.setValue(0);
      animation.current = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      );
      animation.current.start();
    } else {
      animation.current?.stop();
    }
    return () => animation.current?.stop();
  }, [visible, progress]);

  if (!visible) return null;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_WIDTH * 0.4, BAR_WIDTH],
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.title}>Waking up the server...</Text>
        <Text style={styles.subtitle}>
          this takes about 30 seconds on first load. Grab your glass.
        </Text>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { transform: [{ translateX }] }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 17, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  track: {
    width: BAR_WIDTH,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH * 0.4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
});
