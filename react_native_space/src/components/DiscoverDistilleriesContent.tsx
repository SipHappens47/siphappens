import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, Link, useRouter } from 'expo-router';
import { apiService } from '../services/api';
import { DistilleryDiscoverData, DistilleryMapPin } from '../types/distillery';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

interface Props {
  searchQuery: string;
}

export function DiscoverDistilleriesContent({ searchQuery }: Props) {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState<DistilleryDiscoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [displayPins, setDisplayPins] = useState<DistilleryMapPin[]>([]);

  useEffect(() => {
    loadDiscoverData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Use backend search when there's a query
      searchDistilleries(searchQuery);
    } else {
      // Show discover data when no search query
      setDisplayPins(data?.mapPins ?? []);
    }
  }, [searchQuery, data]);

  const loadDiscoverData = async () => {
    try {
      setAuthError(false);
      const result = await apiService.getDistilleriesDiscover();
      setData(result ?? null);
      setDisplayPins(result?.mapPins ?? []);
    } catch (error: any) {
      console.error('Error loading discover data:', error);
      if (error?.response?.status === 401) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchDistilleries = async (query: string) => {
    try {
      const results = await apiService.searchDistilleries(query);
      // Convert search results to MapPin format
      const pins: DistilleryMapPin[] = results.map((d: any) => ({
        id: d?.id,
        name: d?.name,
        country: d?.country,
        region: d?.region,
        latitude: d?.latitude ?? null,
        longitude: d?.longitude ?? null,
        logo: d?.logo,
        verified: d?.verified ?? false,
        isClaimed: d?.isClaimed ?? false,
        isFollowing: d?.isFollowing ?? false,
      }));
      setDisplayPins(pins);
    } catch (error: any) {
      console.error('Error searching distilleries:', error);
      if (error?.response?.status === 401) {
        setAuthError(true);
      }
      setDisplayPins([]);
    }
  };

  const handleLoginCta = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const renderListItem = ({ item }: { item: DistilleryMapPin }) => {
    // Debug logging
    console.log(`[DiscoverDistilleries] ${item?.name} - isClaimed: ${item?.isClaimed}, verified: ${item?.verified}`);

    const distilleryId = item?.id ?? '';
    const href = `/distilleries/${distilleryId}` as Href;

    const row = (
      <View style={styles.listItemContent}>
        <MaterialCommunityIcons name="factory" size={32} color={Colors.accent} />
        <View style={styles.listItemText}>
          <View style={styles.nameRow}>
            <Text style={styles.listItemName}>{item?.name ?? 'Unknown'}</Text>
            {item?.isClaimed && item?.verified && (
              <MaterialCommunityIcons name="check-decagram" size={18} color={Colors.accent} />
            )}
            {item?.isClaimed && !item?.verified && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending Verification</Text>
              </View>
            )}
          </View>
          <Text style={styles.listItemLocation}>
            {item?.region ?? ''}{item?.region && item?.country ? ', ' : ''}{item?.country ?? ''}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textMuted} />
      </View>
    );

    if (!distilleryId) {
      return <View style={styles.listItem}>{row}</View>;
    }

    return (
      <Link href={href} asChild>
        <Pressable
          style={styles.listItem}
          accessibilityRole="link"
          accessibilityLabel={item?.name ?? 'Unknown'}
          onPress={() => router.push(href)}
        >
          {row}
        </Pressable>
      </Link>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No distilleries found</Text>
        <Pressable style={styles.loginButton} onPress={handleLoginCta}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* List View */}
      <FlatList
        data={displayPins}
        renderItem={renderListItem}
        keyExtractor={(item) => item?.id ?? Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No distilleries match your search'
                : 'No distilleries found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  listItem: {
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  listItemText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFC107',
  },
  listItemLocation: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  loginButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
