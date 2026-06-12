import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function ScanScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.title}>Capture Your Pour</Text>
        <Text style={styles.description}>
          Scan a bottle to record a pour, or just find out what's in your hand.
        </Text>

        {/* Option A — Log a Pour (primary) */}
        <Pressable style={styles.optionPrimary} onPress={() => router.push('/camera')}>
          <Ionicons name="wine" size={28} color={Colors.background} />
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionPrimaryTitle}>Log a Pour</Text>
            <Text style={styles.optionPrimarySubtext}>Scan to record what you're drinking</Text>
          </View>
        </Pressable>

        {/* Option B — Explore a Bottle (secondary, outlined) */}
        <Pressable style={styles.optionSecondary} onPress={() => router.push('/camera/explore' as any)}>
          <Ionicons name="search" size={28} color={Colors.accent} />
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionSecondaryTitle}>Explore a Bottle</Text>
            <Text style={styles.optionSecondarySubtext}>Find out what's in your hand</Text>
          </View>
        </Pressable>

        <Button
          mode="text"
          onPress={() => router.push('/camera/manual-search')}
          textColor={Colors.textMuted}
          style={styles.manualLink}
        >
          Search Manually
        </Button>
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
    padding: spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  optionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  optionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: spacing.lg,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionPrimaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.background,
  },
  optionPrimarySubtext: {
    fontSize: 13,
    color: Colors.background,
    opacity: 0.8,
    marginTop: 2,
  },
  optionSecondaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
  },
  optionSecondarySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  manualLink: {
    marginTop: spacing.lg,
  },
});
