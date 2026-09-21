import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/colors';
import { spacing } from '../src/constants/theme';
import { Heading, Landmark } from '../src/components/semantics';

export default function UnmatchedRouteScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Landmark as="main" style={styles.content}>
        <Heading level={1} style={styles.title}>
          Page not found
        </Heading>
        <Text style={styles.body}>That link does not match a SipHappens page.</Text>
        <Button
          mode="contained"
          onPress={() => router.replace('/')}
          style={styles.button}
          accessibilityLabel="Go home"
        >
          Go home
        </Button>
      </Landmark>
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
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: spacing.lg,
  },
  button: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
});
