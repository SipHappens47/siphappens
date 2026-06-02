import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { Text, Searchbar, Avatar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Connection, FellowSipper } from '../../src/types';

export default function ConnectionsScreen() {
  const [activeTab, setActiveTab] = useState('sippers');
  const [searchQuery, setSearchQuery] = useState('');
  const [fellowSippers, setFellowSippers] = useState<FellowSipper[]>([]);
  const [filteredSippers, setFilteredSippers] = useState<FellowSipper[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadConnections = async () => {
    try {
      setLoading(true);
      const [sippers, requests] = await Promise.all([
        apiService.getConnections(),
        apiService.getPendingRequests(),
      ]);
      setFellowSippers(sippers ?? []);
      setFilteredSippers(sippers ?? []);
      setPendingRequests(requests ?? []);
      setFilteredRequests(requests ?? []);
    } catch (error: any) {
      console.error('[Connections] Load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConnections();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadConnections();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query?.trim() || query.trim().length < 2) {
      setFilteredSippers(fellowSippers);
      setFilteredRequests(pendingRequests);
      setSearchResults([]);
      return;
    }

    // Search ALL users in the app
    try {
      setSearching(true);
      const results = await apiService.searchUsers(query);
      setSearchResults(results ?? []);
      
      // Also filter pending requests
      const lowerQuery = query.toLowerCase();
      const filteredR = (pendingRequests ?? []).filter((request) =>
        request?.initiator?.name?.toLowerCase()?.includes(lowerQuery) ?? false
      );
      setFilteredRequests(filteredR);
    } catch (error) {
      console.error('[Connections] Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}` as any);
  };

  const renderFellowSipper = ({ item }: { item: FellowSipper }) => (
    <Pressable
      style={styles.userCard}
      onPress={() => handleUserPress(item?.user?.id ?? '')}
    >
      <Avatar.Icon
        size={56}
        icon={item?.user?.isOfficial ? 'star-circle' : 'account'}
        style={[styles.avatar, item?.user?.isOfficial && styles.officialAvatar]}
      />
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{item?.user?.name ?? 'Unknown'}</Text>
          {item?.user?.isOfficial && (
            <View style={styles.officialBadge}>
              <MaterialCommunityIcons name="star-circle" size={14} color="#D4A017" />
              <Text style={styles.officialBadgeText}>Official</Text>
            </View>
          )}
        </View>
        <Text style={styles.userLevel}>
          {item?.user?.isOfficial ? 'SipHappens Official' : (item?.user?.experienceLevel ?? 'Curious Sipper')}
        </Text>
        {item?.isMuted && (
          <Text style={styles.mutedLabel}>🔇 Muted</Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={Colors.textMuted}
      />
    </Pressable>
  );

  const renderSearchResult = ({ item }: { item: any }) => (
    <Pressable
      style={styles.userCard}
      onPress={() => handleUserPress(item?.id ?? '')}
    >
      <Avatar.Icon
        size={56}
        icon="account"
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item?.name ?? 'Unknown'}</Text>
        <Text style={styles.userLevel}>{item?.experienceLevel ?? 'Curious Sipper'}</Text>
        {item?.isConnected && (
          <Text style={styles.statusBadge}>✓ Connected</Text>
        )}
        {item?.hasPendingRequest && (
          <Text style={styles.statusBadge}>⏳ Pending</Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={Colors.textMuted}
      />
    </Pressable>
  );

  const renderRequest = ({ item }: { item: Connection }) => (
    <Pressable
      style={styles.userCard}
      onPress={() => handleUserPress(item?.initiator?.id ?? '')}
    >
      <Avatar.Icon
        size={56}
        icon="account"
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item?.initiator?.name ?? 'Unknown'}</Text>
        <Text style={styles.requestText}>Wants to connect</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={Colors.textMuted}
      />
    </Pressable>
  );

  const renderFellowSippersEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="account-group"
        size={64}
        color={Colors.textMuted}
      />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No users found' : 'No Fellow Sippers Yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try a different search' : 'Search to discover and connect with other sippers'}
      </Text>
    </View>
  );

  const renderRequestsEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="account-clock"
        size={64}
        color={Colors.textMuted}
      />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No requests found' : 'No Pending Requests'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try a different search' : "You'll see connection requests here"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search Sippers"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          autoCapitalize="none"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            {
              value: 'sippers',
              label: 'Fellow Sippers',
            },
            {
              value: 'requests',
              label: filteredRequests?.length > 0 ? `Requests (${filteredRequests.length})` : 'Requests',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Content */}
      {activeTab === 'sippers' ? (
        <FlatList
          data={searchQuery.trim().length >= 2 ? searchResults : filteredSippers}
          keyExtractor={(item: any) => searchQuery.trim().length >= 2 ? (item?.id ?? '') : (item?.connectionId ?? '')}
          renderItem={(info: any) => searchQuery.trim().length >= 2 ? renderSearchResult(info) : renderFellowSipper(info)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={searching ? null : renderFellowSippersEmpty}
          ListHeaderComponent={searching ? (
            <View style={styles.searchingContainer}>
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          ) : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item?.id ?? ''}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderRequestsEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  searchBar: {
    backgroundColor: Colors.background,
  },
  tabsContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentedButtons: {
    backgroundColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginRight: spacing.md,
  },
  officialAvatar: {
    backgroundColor: '#D4A017',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4A017',
  },
  mutedLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  userLevel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  requestText: {
    fontSize: 14,
    color: Colors.accent,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl * 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  statusBadge: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 4,
    fontStyle: 'italic',
  },
  searchingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  searchingText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
