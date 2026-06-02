import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable, FlatList, Alert, RefreshControl } from 'react-native';
import { Text, Button, ActivityIndicator, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { DistilleryProfile, DistilleryPour, DistillerySpirit } from '../../src/types/distillery';
import { BarPourCard } from '../../src/components/BarPourCard';
import { useAuth } from '../../src/context/AuthContext';
import { Pour } from '../../src/types';
import { PourCard } from '../../src/components/PourCard';

export default function DistilleryProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const distilleryId = Array.isArray(params.distilleryId) ? params.distilleryId[0] : params.distilleryId ?? '';
  const isOwner = user?.distilleryId === distilleryId && user?.isDistilleryAccount;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<DistilleryProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'pours' | 'shelf'>('shelf');
  const [pours, setPours] = useState<DistilleryPour[]>([]);
  const [spirits, setSpirits] = useState<DistillerySpirit[]>([]);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (distilleryId) {
      loadDistilleryData();
    }
  }, [distilleryId]);

  const loadDistilleryData = async () => {
    try {
      setLoading(true);
      const profileData = await apiService.getDistilleryProfile(distilleryId);
      
      // Debug logging
      console.log(`[DistilleryProfile] ${profileData?.name} - isClaimed: ${profileData?.isClaimed}, verified: ${profileData?.verified}`);
      
      setProfile(profileData);
      
      // Load distillery pours
      const poursData = await apiService.getDistilleryPours(distilleryId);
      setPours(poursData ?? []);
      
      // Load spirits for shelf
      const spiritsData = await apiService.getDistillerySpirits(distilleryId);
      setSpirits(spiritsData ?? []);
    } catch (error: any) {
      console.error('Failed to load distillery:', error);
      Alert.alert('Error', 'Failed to load distillery profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: 'pours' | 'shelf') => {
    setActiveTab(tab);
  };

  const handleFollow = async () => {
    try {
      setFollowLoading(true);
      const result = await apiService.followDistillery(distilleryId);
      
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isFollowing: result.isFollowing,
          followersCount: result.followersCount,
        };
      });
    } catch (error: any) {
      console.error('Failed to toggle follow:', error);
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAddAllToRadar = async () => {
    try {
      if (!spirits || spirits.length === 0) {
        Alert.alert('Info', 'No spirits to add to radar');
        return;
      }
      
      // Add all spirits to radar
      const promises = spirits.map((spirit) => apiService.addToRadar(spirit.id));
      await Promise.all(promises);
      
      Alert.alert('Success', `Added ${spirits.length} spirits to your radar!`);
      
      // Refresh spirits to update isOnRadar flags
      const spiritsData = await apiService.getDistillerySpirits(distilleryId);
      setSpirits(spiritsData ?? []);
    } catch (error: any) {
      console.error('Failed to add all to radar:', error);
      Alert.alert('Error', 'Failed to add some spirits to radar');
    }
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
            return {
              ...pour,
              hasCheered: !currentlyCheered,
              cheersCount: currentlyCheered
                ? Math.max(0, (pour?.cheersCount ?? 0) - 1)
                : (pour?.cheersCount ?? 0) + 1,
            };
          }
          return pour;
        })
      );
    } catch (error: any) {
      console.error('Failed to toggle cheer:', error);
      Alert.alert('Error', 'Failed to update cheer');
    }
  };

  const handleAddToRadar = async (spiritId: string) => {
    try {
      await apiService.addToRadar(spiritId);
      Alert.alert('Success', 'Added to your radar!');
    } catch (error: any) {
      console.error('Failed to add to radar:', error);
      Alert.alert('Error', 'Failed to add to radar');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Distillery not found</Text>
          <Button mode="contained" onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDistilleryData} tintColor={Colors.accent} />
        }
      >
        {/* Hero Image */}
        {profile.heroImage ? (
          <Image
            source={{ uri: profile.heroImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.heroPlaceholder} />
        )}

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              {profile.logo ? (
                <Image source={{ uri: profile.logo }} style={styles.logo} resizeMode="contain" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <MaterialCommunityIcons name="factory" size={40} color={Colors.textMuted} />
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.distilleryName}>{profile.name}</Text>
                {profile.verified && profile.isClaimed ? (
                  <MaterialCommunityIcons name="check-decagram" size={24} color={Colors.accent} />
                ) : !profile.verified && profile.isClaimed ? (
                  <View style={styles.pendingVerificationBadge}>
                    <Text style={styles.pendingVerificationText}>Pending Verification</Text>
                  </View>
                ) : null}
              </View>
              
              {(profile.country || profile.region) && (
                <View style={styles.locationRow}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={Colors.textSecondary} />
                  <Text style={styles.locationText}>
                    {[profile.region, profile.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{profile.followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{profile.spiritsCount}</Text>
                  <Text style={styles.statLabel}>Spirits</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{profile.poursCount}</Text>
                  <Text style={styles.statLabel}>Pours</Text>
                </View>
              </View>
            </View>
          </View>

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Only show action buttons for non-owners */}
          {!isOwner && (
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.followButton, profile.isFollowing && styles.followingButton]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                <Text style={styles.followButtonText}>
                  {followLoading ? 'Loading...' : profile.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>

              <Pressable style={styles.radarButton} onPress={handleAddAllToRadar}>
                <MaterialCommunityIcons name="radar" size={20} color={Colors.text} />
                <Text style={styles.radarButtonText}>Add All to Radar</Text>
              </Pressable>
            </View>
          )}

          {profile.websiteUrl && (
            <Pressable
              style={styles.websiteButton}
              onPress={() => {
                // Open website in browser
                const url = profile.websiteUrl?.startsWith('http')
                  ? profile.websiteUrl
                  : `https://${profile.websiteUrl}`;
                Alert.alert('Website', url);
              }}
            >
              <MaterialCommunityIcons name="web" size={18} color={Colors.accent} />
              <Text style={styles.websiteText}>{profile.websiteUrl}</Text>
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'pours' && styles.activeTab]}
            onPress={() => handleTabChange('pours')}
          >
            <Text style={[styles.tabText, activeTab === 'pours' && styles.activeTabText]}>
              {isOwner ? 'My Pours' : 'Their Pours'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'shelf' && styles.activeTab]}
            onPress={() => handleTabChange('shelf')}
          >
            <Text style={[styles.tabText, activeTab === 'shelf' && styles.activeTabText]}>
              {isOwner ? 'My Shelf' : 'Their Shelf'}
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'pours' ? (
          <View style={styles.tabContent}>
            {pours.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="glass-cocktail" size={60} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No pours yet</Text>
              </View>
            ) : (
              pours.map((pour) => (
                <BarPourCard
                  key={pour.id}
                  pour={pour as any}
                  onCheerToggle={handleCheerToggle}
                  onAddToRadar={handleAddToRadar}
                  onViewDetails={(id) => router.push(`/pour/${id}`)}
                  onViewUserProfile={(userId) => router.push(`/user/${userId}` as any)}
                  showOfficialBadge={pour.isDistilleryPost && pour.distilleryVerified}
                />
              ))
            )}
          </View>
        ) : activeTab === 'shelf' ? (
          <View style={styles.spiritsGrid}>
            {spirits.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="bottle-wine" size={60} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No spirits yet</Text>
              </View>
            ) : (
              spirits.map((spirit) => (
                <Pressable
                  key={spirit.id}
                  style={styles.spiritCard}
                  onPress={() => router.push(`/spirit/${spirit.id}` as any)}
                >
                  {spirit.bottleImage ? (
                    <Image source={{ uri: spirit.bottleImage }} style={styles.bottleImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.bottlePlaceholder}>
                      <MaterialCommunityIcons name="bottle-wine" size={50} color={Colors.textMuted} />
                    </View>
                  )}
                  <Text style={styles.spiritName} numberOfLines={2}>{spirit.name}</Text>
                  {spirit.abv != null && (
                    <Text style={styles.spiritAbv}>{spirit.abv}% ABV</Text>
                  )}
                  {spirit.category && <Text style={styles.spiritCategory}>{spirit.category}</Text>}
                  {spirit.hasInsights && profile.isPremium && (
                    <View style={styles.insightsBadge}>
                      <MaterialCommunityIcons name="information" size={14} color={Colors.accent} />
                      <Text style={styles.insightsBadgeText}>Insights</Text>
                    </View>
                  )}
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
      </Pressable>

      {/* FAB for adding spirits - only show for owners on shelf tab */}
      {isOwner && activeTab === 'shelf' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/distillery-spirit-add' as any)}
          label="Add Spirit"
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.elevated,
  },
  headerSection: {
    padding: spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTop: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  logoContainer: {
    width: 80,
    height: 80,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  distilleryName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  pendingVerificationBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderWidth: 1,
    borderColor: '#FFC107',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 4,
  },
  pendingVerificationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFC107',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bio: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  followButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: Colors.elevated,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  radarButton: {
    flex: 1,
    backgroundColor: Colors.elevated,
    paddingVertical: spacing.md,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  radarButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  websiteText: {
    fontSize: 14,
    color: Colors.accent,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.accent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.accent,
  },
  tabContent: {
    padding: spacing.md,
  },
  spiritsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  spiritCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  bottleImage: {
    width: 100,
    height: 140,
    marginBottom: spacing.sm,
  },
  bottlePlaceholder: {
    width: 100,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  spiritName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  spiritAbv: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 2,
  },
  spiritCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  insightsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: 6,
  },
  insightsBadgeText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 8,
    height: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 4,
  },
  activeTabLabel: {
    color: Colors.accent,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 70,
    backgroundColor: Colors.accent,
  },
});
