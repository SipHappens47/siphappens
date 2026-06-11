import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image, Pressable, Alert } from 'react-native';
import { Text, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../src/services/api';
import { uploadService } from '../src/services/upload';
import { useAuth } from '../src/context/AuthContext';
import { Connection } from '../src/types';
import { Colors } from '../src/constants/colors';
import { spacing } from '../src/constants/theme';

export const NOTIFICATIONS_LAST_SEEN_KEY = 'notificationsLastSeen';

interface ReceivedCheer {
  id: string;
  createdAt: string;
  user: { id: string; name: string; profilePhoto?: string };
  pourId: string;
  spiritName: string;
}

function timeAgo(dateString: string) {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${Math.max(mins, 1)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return '';
  }
}

function Avatar({ photoId }: { photoId?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!photoId) return;
      try {
        const resolved = photoId.startsWith('http')
          ? photoId
          : await uploadService.getImageUrl(photoId, 'view');
        if (active) setUrl(resolved || null);
      } catch {
        /* placeholder will show */
      }
    })();
    return () => { active = false; };
  }, [photoId]);

  if (url) {
    return <Image source={{ uri: url }} style={styles.avatar} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarPlaceholder]}>
      <MaterialCommunityIcons name="account" size={20} color={Colors.textMuted} />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Connection[]>([]);
  const [cheers, setCheers] = useState<ReceivedCheer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [pending, received] = await Promise.all([
        apiService.getPendingRequests(),
        apiService.getReceivedCheers(),
      ]);
      // Only requests where I am the receiver are actionable notifications
      const incoming = (pending ?? []).filter(
        (c: Connection) => c?.receiver?.id === user?.id && c?.status?.toLowerCase() === 'pending',
      );
      setRequests(incoming);
      setCheers(received ?? []);
      // Mark notifications as seen
      await AsyncStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAccept = async (connectionId: string) => {
    try {
      setProcessingId(connectionId);
      await apiService.acceptConnectionRequest(connectionId);
      setRequests((prev) => prev.filter((r) => r.id !== connectionId));
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const isEmpty = requests.length === 0 && cheers.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={Colors.accent}
          />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>All quiet</Text>
            <Text style={styles.emptyText}>Sipper requests and cheers will show up here</Text>
          </View>
        ) : (
          <>
            {requests.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Fellow Sipper Requests</Text>
                {requests.map((req) => (
                  <View key={req.id} style={styles.itemCard}>
                    <Pressable
                      style={styles.itemMain}
                      onPress={() => router.push(`/user/${req?.initiator?.id ?? ''}` as any)}
                    >
                      <Avatar photoId={req?.initiator?.profilePhoto} />
                      <View style={styles.itemTextContainer}>
                        <Text style={styles.itemText}>
                          <Text style={styles.itemName}>{req?.initiator?.name ?? 'Someone'}</Text>
                          {' wants to be your Fellow Sipper'}
                        </Text>
                        <Text style={styles.itemTime}>{timeAgo(req?.createdAt ?? '')}</Text>
                      </View>
                    </Pressable>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => handleAccept(req.id)}
                      loading={processingId === req.id}
                      disabled={processingId === req.id}
                    >
                      Accept
                    </Button>
                  </View>
                ))}
              </>
            )}

            {cheers.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Cheers</Text>
                {cheers.map((cheer) => (
                  <Pressable
                    key={cheer.id}
                    style={styles.itemCard}
                    onPress={() => router.push(`/pour/${cheer.pourId}` as any)}
                  >
                    <View style={styles.itemMain}>
                      <Avatar photoId={cheer?.user?.profilePhoto} />
                      <View style={styles.itemTextContainer}>
                        <Text style={styles.itemText}>
                          <Text style={styles.itemName}>{cheer?.user?.name ?? 'Someone'}</Text>
                          {' cheered your '}
                          <Text style={styles.itemName}>{cheer?.spiritName}</Text>
                          {' pour'}
                        </Text>
                        <Text style={styles.itemTime}>{timeAgo(cheer?.createdAt ?? '')}</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="glass-mug-variant" size={20} color={Colors.accent} />
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  itemCard: {
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
  itemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  itemName: {
    fontWeight: '700',
  },
  itemTime: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: spacing.sm,
  },
});
