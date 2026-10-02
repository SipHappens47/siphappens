import React from 'react';
import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';
import { LoadError } from '../hooks/useLoadSection';

export function LoadNotice({ section, name }: { section: { data?: unknown; loading: boolean; error: LoadError; retry: () => void }; name: string }) {
  const router = useRouter();
  const { logout } = useAuth();
  if (!section.error && (!section.loading || section.data !== undefined)) return null;
  return <View style={{ padding: spacing.md, alignItems: 'center' }}>
    <Text style={{ color: Colors.text, textAlign: 'center' }}>
      {section.error === 'auth' ? 'Please log in again to load this content.' : section.error === 'not-found' ? `${name} not found` : section.error ? `${section.data !== undefined ? 'Unable to refresh' : 'Could not load'} ${name}. Please try again.` : `Loading ${name}...`}
    </Text>
    {section.error === 'auth' ? <Button onPress={async () => { await logout(); router.replace('/auth/login'); }}>Log In</Button>
      : section.error && section.error !== 'not-found' ? <Button onPress={section.retry} disabled={section.loading}>Retry</Button> : null}
  </View>;
}
