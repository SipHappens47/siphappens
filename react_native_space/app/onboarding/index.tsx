import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';

interface Screen {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  headline: string;
  subtext: string;
  cta: string;
  ctaTarget: string;
}

const SCREENS: Screen[] = [
  {
    icon: 'camera-outline',
    headline: 'Your spirits journey starts here',
    subtext: "Point your camera at any bottle label. We'll identify it and add it to your shelf.",
    cta: 'Scan a bottle now',
    ctaTarget: '/camera',
  },
  {
    icon: 'account-group-outline',
    headline: 'Spirits taste better shared',
    subtext: "Connect with friends to see what they're pouring. Their pours appear in your Bar.",
    cta: 'Find Fellow Sippers',
    ctaTarget: '/connections',
  },
  {
    icon: 'factory',
    headline: 'Go straight to the source',
    subtext: 'Follow distilleries to see their official pours and new releases.',
    cta: 'Explore distilleries',
    ctaTarget: '/tabs?tab=distilleries',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const screen = SCREENS[index];
  const isLast = index === SCREENS.length - 1;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('[Onboarding] Failed to persist completion:', error);
    }
  };

  const handleCta = async () => {
    await completeOnboarding();
    router.replace(screen.ctaTarget as any);
  };

  const handleSkip = () => {
    setIndex((i) => Math.min(i + 1, SCREENS.length - 1));
  };

  const handleLetsGo = async () => {
    await completeOnboarding();
    router.replace('/tabs');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={screen.icon} size={64} color={Colors.accent} />
        </View>

        <Text style={styles.headline}>{screen.headline}</Text>
        <Text style={styles.subtext}>{screen.subtext}</Text>
      </View>

      <View style={styles.footer}>
        {/* Dot progress indicator */}
        <View style={styles.dotsRow}>
          {SCREENS.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={styles.ctaButton} onPress={handleCta}>
          <Text style={styles.ctaText}>{screen.cta}</Text>
        </Pressable>

        {isLast ? (
          <Pressable style={styles.secondaryButton} onPress={handleLetsGo}>
            <Text style={styles.secondaryButtonText}>Let's go</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.skipLink} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 20,
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
