import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Pressable } from 'react-native';
import { Text, IconButton, Searchbar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../src/services/api';
import { BarPour } from '../../src/types';
import { BarPourCard } from '../../src/components/BarPourCard';
import { UniversalSearch } from '../../src/components/UniversalSearch';
import { DiscoverDistilleriesContent } from '../../src/components/DiscoverDistilleriesContent';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { useRouter } from 'expo-router';

export default function TheBarScreen() {
  const [activeTab, setActiveTab] = useState<'sippers' | 'distilleries'>('sippers');
  const [pours, setPours] = useState<BarPour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const loadBarFeed = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBarFeed();
      setPours(data ?? []);
    } catch (error: any) {
      console.error('Failed to load The Bar feed:', error?.message ?? error);
      // Don't show error alert for auth errors (handled by interceptor)
      if (error?.response?.status !== 401) {
        const message = error?.response?.data?.message ?? 'Failed to load The Bar feed. Please try again.';
        setTimeout(() => Alert.alert('Error', message), 100);
      }
      setPours([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBarFeed();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadBarFeed();
  };

  const handleCheerToggle = async (pourId: string, currentlyCheered: boolean) => {
    try {
      if (currentlyCheered) {
        await apiService.removeCheer(pourId);
      } else {
        await apiService.addCheer(pourId);
      }
      // Update local state
      setPours((prev) =>
        (prev ?? []).map((pour) => {
          if (pour?.id === pourId) {
            const newCheersCount = currentlyCheered
              ? Math.max(0, (pour?.cheersCount ?? 0) - 1)
              : (pour?.cheersCount ?? 0) + 1;
            return {
              ...pour,
              hasUserCheered: !currentlyCheered,
              cheersCount: newCheersCount > 0 ? newCheersCount : undefined,
            };
          }
          return pour;
        })
      );
    } catch (error: any) {
      console.error('Failed to toggle cheer:', error);
      const message = error?.response?.data?.message ?? 'Failed to update cheer. Please try again.';
      Alert.alert('Error', message);
    }
  };

  const handleAddToRadar = async (spiritId: string) => {
    try {
      await apiService.addToRadar(spiritId);
      Alert.alert('Success', 'Added to your radar!');
    } catch (error: any) {
      console.error('Failed to add to radar:', error);
      const message = error?.response?.data?.message ?? 'Failed to add to radar. Please try again.';
      Alert.alert('Error', message);
    }
  };

  const handleViewDetails = (pourId: string) => {
    router.push(`/pour/${pourId}`);
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>The Bar is quiet</Text>
        <Text style={styles.emptyText}>
          Connect with Fellow Sippers to see their shared pours here
        </Text>
        <Pressable
          style={styles.connectButton}
          onPress={() => router.push('/connections')}
        >
          <Text style={styles.connectButtonText}>Find Fellow Sippers</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          iconColor={Colors.textMuted}
        />
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'sippers' | 'distilleries')}
          buttons={[
            {
              value: 'sippers',
              label: 'Fellow Sippers',
            },
            {
              value: 'distilleries',
              label: 'Distilleries',
            },
          ]}
          style={styles.tabs}
        />
      </View>

      {activeTab === 'sippers' ? (
        searchQuery.trim().length >= 2 ? (
          <View style={styles.searchResults}>
            <UniversalSearch
              placeholder="Search spirits, distilleries, or sippers..."
              externalQuery={searchQuery}
              hideSearchInput={true}
              onResultSelect={() => {
                // Search stays open - results shown inline
              }}
            />
          </View>
        ) : (
          <FlatList
            data={pours}
            keyExtractor={(item) => item?.id ?? ''}
            renderItem={({ item }) => (
              <BarPourCard
                pour={item}
                onCheerToggle={handleCheerToggle}
                onAddToRadar={handleAddToRadar}
                onViewDetails={handleViewDetails}
                onViewUserProfile={(userId) => router.push(`/user/${userId}` as any)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.accent}
              />
            }
          />
        )
      ) : (
        <DiscoverDistilleriesContent searchQuery={searchQuery} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  searchBar: {
    backgroundColor: Colors.elevated,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tabs: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  searchResults: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
    opacity: 0.9,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 26,
    maxWidth: '85%',
  },
  connectButton: {
    backgroundColor: Colors.accent, // Accent for primary action
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  connectButtonText: {
    color: Colors.background, // Dark text on gold button
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultCard: {
    marginBottom: spacing.sm,
    backgroundColor: Colors.surface, // Card surface
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  searchResultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.elevated, // Elevated surface for avatars
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text, // Primary text
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 12,
    color: Colors.textSecondary, // Secondary text for metadata
    fontWeight: '500',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  connectedText: {
    fontSize: 12,
    color: Colors.success, // Success state
    fontWeight: '500',
  },
  pendingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: Colors.elevated, // Elevated surface for badges
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 12,
    color: Colors.textMuted, // Muted text for pending state
    fontWeight: '500',
  },
  connectSmallButton: {
    backgroundColor: Colors.accent, // Accent for primary action
  },
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptySearchText: {
    fontSize: 16,
    color: Colors.textSecondary, // Secondary text
    marginTop: spacing.lg,
  },
});
