import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../services/api';
import { DistilleryDiscoverData, DistilleryMapPin } from '../types/distillery';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

interface Props {
  searchQuery: string;
}

export function DiscoverDistilleriesContent({ searchQuery }: Props) {
  const router = useRouter();
  const [data, setData] = useState<DistilleryDiscoverData | null>(null);
  const [loading, setLoading] = useState(true);
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
      const result = await apiService.getDistilleriesDiscover();
      setData(result ?? null);
      setDisplayPins(result?.mapPins ?? []);
    } catch (error) {
      console.error('Error loading discover data:', error);
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
    } catch (error) {
      console.error('Error searching distilleries:', error);
      setDisplayPins([]);
    }
  };

  const handleMarkerPress = (distilleryId: string) => {
    router.push(`/distilleries/${distilleryId}` as any);
  };

  const renderListItem = ({ item }: { item: DistilleryMapPin }) => {
    // Debug logging
    console.log(`[DiscoverDistilleries] ${item?.name} - isClaimed: ${item?.isClaimed}, verified: ${item?.verified}`);
    
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleMarkerPress(item?.id ?? '')}
        activeOpacity={0.7}
      >
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
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
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
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
