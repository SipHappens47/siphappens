import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { useLoadSection } from '../../src/hooks/useLoadSection';
import { LoadNotice } from '../../src/components/LoadNotice';
import { getApiErrorMessage } from '../../src/utils/errors';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

type BlockedUser = { id: string; name: string; blockedAt: string };

function formatDate(value: string) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

// Blocked people's profiles are hidden, so unblocking happens here.
export default function BlockedUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const blocked = useLoadSection<BlockedUser[]>(user?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => blocked.load(() => apiService.getBlockedUsers());
  useEffect(() => {
    load();
  }, [user?.id]);

  const handleUnblock = async (blockedUser: BlockedUser) => {
    try {
      setBusyId(blockedUser.id);
      await apiService.unblockUser(blockedUser.id);
      blocked.setData((previous) => previous.filter((entry) => entry.id !== blockedUser.id));
    } catch (error: any) {
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to unblock. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Blocked users</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          People you block can't see your profile or pours, and you won't see theirs.
        </Text>
        <LoadNotice name="blocked users" section={{ ...blocked, retry: load }} />
        {blocked.data?.length === 0 ? (
          <Text style={styles.emptyText}>You haven't blocked anyone.</Text>
        ) : null}
        {(blocked.data ?? []).map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.name}>{entry.name || 'Unknown sipper'}</Text>
              {formatDate(entry.blockedAt) ? (
                <Text style={styles.meta}>Blocked {formatDate(entry.blockedAt)}</Text>
              ) : null}
            </View>
            <Button
              mode="outlined"
              compact
              onPress={() => handleUnblock(entry)}
              loading={busyId === entry.id}
              disabled={busyId !== null}
            >
              Unblock
            </Button>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  intro: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
