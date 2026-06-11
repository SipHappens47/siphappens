import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function ScanScreen() {
  const router = useRouter();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulse }] }]}>
          <MaterialCommunityIcons name="camera" size={80} color={Colors.accent} />
        </Animated.View>
        <Text style={styles.title}>Capture Your Pour</Text>
        <Text style={styles.description}>
          Scan a bottle to identify the spirit and create a journal entry.
        </Text>

        <Button
          mode="contained"
          onPress={() => router.push('/camera')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="camera"
        >
          Open Camera
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push('/camera/manual-search')}
          style={styles.buttonOutlined}
          contentStyle={styles.buttonContent}
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
  iconWrap: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
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
  button: {
    width: '100%',
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  buttonOutlined: {
    width: '100%',
    borderRadius: 12,
    borderColor: Colors.accent,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
