import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image, Pressable } from 'react-native';
import { Text, Searchbar, IconButton, SegmentedButtons, Card, Chip, FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../src/services/api';
import { Pour, RadarEntry } from '../../src/types';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { pluralise } from '../../src/utils/strings';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

export default function ShelfScreen() {
  const { user } = useAuth();
  const isDistilleryAccount = user?.isDistilleryAccount ?? false;
  const distilleryId = user?.distilleryId;

  const [activeTab, setActiveTab] = useState('pours');
  const [pours, setPours] = useState<Pour[]>([]);
  const [filteredPours, setFilteredPours] = useState<Pour[]>([]);
  const [radarEntries, setRadarEntries] = useState<RadarEntry[]>([]);
  const [distillerySpirits, setDistillerySpirits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  
  const router = useRouter();

  const loadPours = async () => {
    try {
      const data = await apiService.getPours();
      setPours(data ?? []);
      setFilteredPours(data ?? []);
    } catch (error) {
      console.error('Failed to load pours:', error);
      Alert.alert('Error', 'Failed to load your pours. Please try again.');
    }
  };

  const loadRadar = async () => {
    try {
      const data = await apiService.getRadar();
      setRadarEntries(data ?? []);
    } catch (error: any) {
      console.error('Failed to load radar:', error);
      const message = error?.response?.data?.message ?? 'Failed to load your radar. Please try again.';
      Alert.alert('Error', message);
    }
  };

  const loadDistillerySpirits = async () => {
    if (!distilleryId) return;
    try {
      const data = await apiService.getDistillerySpirits(distilleryId);
      setDistillerySpirits(data ?? []);
    } catch (error) {
      console.error('Failed to load distillery spirits:', error);
      Alert.alert('Error', 'Failed to load your spirits. Please try again.');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (isDistilleryAccount && distilleryId) {
        // Load distillery spirits for distillery accounts
        await loadDistillerySpirits();
      } else {
        // Load personal pours and radar for regular accounts
        await Promise.all([loadPours(), loadRadar()]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query?.trim()) {
      setFilteredPours(pours);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = (pours ?? []).filter(
      (pour) =>
        pour?.spirit?.name?.toLowerCase()?.includes(lowerQuery) ??
        pour?.spirit?.distilleryName?.toLowerCase()?.includes(lowerQuery) ??
        pour?.whyItHit?.toLowerCase()?.includes(lowerQuery) ??
        false
    );
    setFilteredPours(filtered);
  };

  const handleRemoveFromRadar = async (spiritId: string) => {
    try {
      await apiService.removeFromRadar(spiritId);
      setRadarEntries((prev) => (prev ?? []).filter((entry) => entry?.spirit?.id !== spiritId));
    } catch (error: any) {
      console.error('Failed to remove from radar:', error);
      const message = error?.response?.data?.message ?? 'Failed to remove from radar. Please try again.';
      Alert.alert('Error', message);
    }
  };

  const renderPoursEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📖</Text>
      <Text style={styles.emptyTitle}>Your Shelf is Empty</Text>
      <Text style={styles.emptyText}>
        Start your spirit journey! Scan your first bottle to capture tasting notes, flavors, and build your collection.
      </Text>
      <Pressable
        style={styles.emptyButton}
        onPress={() => router.push('/tabs/scan')}
      >
        <MaterialCommunityIcons name="barcode-scan" size={20} color={Colors.background} />
        <Text style={styles.emptyButtonText}>Scan Your First Bottle</Text>
      </Pressable>
    </View>
  );

  const renderRadarEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="radar" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>Nothing on your radar yet</Text>
      <Text style={styles.emptyText}>
        Tap Add to Radar on any spirit or pour to save it here
      </Text>
      <Pressable style={styles.emptyButton} onPress={() => router.push('/tabs')}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.background} />
        <Text style={styles.emptyButtonText}>Browse spirits</Text>
      </Pressable>
    </View>
  );

  const RadarItemComponent = ({ item }: { item: RadarEntry }) => {
    const [bottleImageUrl, setBottleImageUrl] = useState<string | null>(null);
    const [pourCount, setPourCount] = useState<number | null>(null);

    useEffect(() => {
      loadBottleImage();
    }, [item?.spirit?.bottleImage]);

    useEffect(() => {
      let active = true;
      (async () => {
        try {
          if (item?.spirit?.id) {
            const result = await apiService.getSpiritPourCount(item.spirit.id);
            if (active) setPourCount(result?.pourCount ?? null);
          }
        } catch {
          // Endpoint unavailable: just omit the count
        }
      })();
      return () => { active = false; };
    }, [item?.spirit?.id]);

    const loadBottleImage = async () => {
      try {
        if (item?.spirit?.bottleImage) {
          if (item.spirit.bottleImage.startsWith('http')) {
            setBottleImageUrl(item.spirit.bottleImage);
          } else {
            const url = await apiService.getFileUrl(item.spirit.bottleImage, 'view');
            setBottleImageUrl(url?.url ?? null);
          }
        }
      } catch (error) {
        console.error('Failed to load bottle image:', error);
      }
    };

    return (
      <Card style={styles.radarCard}>
        <View style={styles.radarCardContent}>
          {bottleImageUrl ? (
            <Image
              source={{ uri: bottleImageUrl }}
              style={styles.bottleImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.bottleImage, styles.imagePlaceholder]}>
              <MaterialCommunityIcons name="bottle-wine" size={40} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.spiritInfo}>
            <Text style={styles.spiritName}>{item?.spirit?.name ?? 'Unknown'}</Text>
            <Text style={styles.distillery}>{item?.spirit?.distilleryName ?? ''}</Text>
            <View style={styles.metaRow}>
              {item?.spirit?.category && (
                <Text style={styles.category}>{item.spirit.category}</Text>
              )}
              {item?.spirit?.abv && (
                <Text style={styles.abv}>{item.spirit.abv}% ABV</Text>
              )}
            </View>
            {pourCount !== null && pourCount > 0 && (
              <Text style={styles.pourCount}>{pluralise(pourCount, 'pour')}</Text>
            )}
          </View>
          <IconButton
            icon="close"
            size={20}
            iconColor={Colors.textSecondary}
            onPress={() => handleRemoveFromRadar(item?.spirit?.id ?? '')}
            style={styles.removeButton}
          />
        </View>
      </Card>
    );
  };

  // List-style pour row (matches the distillery shelf look): image left,
  // name + meta, shared/private indicator, pencil to edit.
  const PourListItem = ({ item }: { item: Pour }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
      loadImage();
    }, [item?.id]);

    const loadImage = async () => {
      try {
        if (item?.image) {
          const url = await apiService.getFileUrl(item.image, 'view');
          setImageUrl(url?.url ?? null);
          return;
        }
        if (item?.spirit?.bottleImage) {
          if (item.spirit.bottleImage.startsWith('http')) {
            setImageUrl(item.spirit.bottleImage);
          } else {
            const url = await apiService.getFileUrl(item.spirit.bottleImage, 'view');
            setImageUrl(url?.url ?? null);
          }
        }
      } catch (error) {
        console.error('Failed to load pour image:', error);
      }
    };

    return (
      <Card style={styles.radarCard} onPress={() => router.push(`/pour/${item?.id ?? ''}`)}>
        <View style={styles.radarCardContent}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.pourListImage} resizeMode="cover" />
          ) : (
            <View style={[styles.pourListImage, styles.imagePlaceholder]}>
              <MaterialCommunityIcons name="glass-mug-variant" size={32} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.spiritInfo}>
            <Text style={styles.spiritName}>{item?.spirit?.name ?? 'Unknown'}</Text>
            <View style={styles.metaRow}>
              {item?.spirit?.category && (
                <Text style={styles.category}>{item.spirit.category}</Text>
              )}
              {item?.spirit?.abv && <Text style={styles.abv}>{item.spirit.abv}% ABV</Text>}
            </View>
            <View style={styles.sharedRow}>
              <MaterialCommunityIcons
                name={item?.isShared ? 'earth' : 'lock'}
                size={13}
                color={item?.isShared ? Colors.accent : Colors.textMuted}
              />
              <Text style={[styles.sharedText, item?.isShared && styles.sharedTextActive]}>
                {item?.isShared ? 'On The Bar' : 'Private'}
              </Text>
            </View>
          </View>
          <IconButton
            icon="pencil"
            size={20}
            iconColor={Colors.accent}
            onPress={() => router.push(`/pour/edit/${item?.id ?? ''}`)}
            style={styles.removeButton}
          />
        </View>
      </Card>
    );
  };

  const renderDistilleryShelfEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏭</Text>
      <Text style={styles.emptyTitle}>Your Distillery Shelf is Empty</Text>
      <Text style={styles.emptyText}>
        Add your official spirits to showcase your products to Fellow Sippers. Upload professional bottle shots and tasting notes.
      </Text>
    </View>
  );

  const DistillerySpiritItem = ({ item }: { item: any }) => {
    const [bottleImageUrl, setBottleImageUrl] = useState<string | null>(null);

    useEffect(() => {
      loadBottleImage();
    }, [item?.bottleImage]);

    const loadBottleImage = async () => {
      try {
        if (item?.bottleImage) {
          if (item.bottleImage.startsWith('http')) {
            setBottleImageUrl(item.bottleImage);
          } else {
            const url = await apiService.getFileUrl(item.bottleImage, 'view');
            setBottleImageUrl(url?.url ?? null);
          }
        }
      } catch (error) {
        console.error('Failed to load bottle image:', error);
      }
    };

    return (
      <Card style={styles.radarCard}>
        <View style={styles.radarCardContent}>
          {bottleImageUrl ? (
            <Image
              source={{ uri: bottleImageUrl }}
              style={styles.bottleImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.bottleImage, styles.imagePlaceholder]}>
              <MaterialCommunityIcons name="bottle-wine" size={40} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.spiritInfo}>
            <Text style={styles.spiritName}>{item?.name ?? 'Unknown'}</Text>
            <View style={styles.metaRow}>
              {item?.category && (
                <Text style={styles.category}>{item.category}</Text>
              )}
              {item?.abv && (
                <Text style={styles.abv}>{item.abv}% ABV</Text>
              )}
            </View>
            {item?.flavorTags && item.flavorTags.length > 0 && (
              <View style={styles.tagsRow}>
                {item.flavorTags.slice(0, 3).map((tag: any) => (
                  <Chip key={tag.id} compact style={styles.tag}>
                    {tag.name}
                  </Chip>
                ))}
              </View>
            )}
          </View>
          <IconButton
            icon="pencil"
            size={20}
            iconColor={Colors.accent}
            onPress={() => router.push(`/distilleries/spirit-form?spiritId=${item?.id ?? ''}` as any)}
            style={styles.removeButton}
          />
        </View>
      </Card>
    );
  };

  // Render distillery shelf for distillery accounts
  if (isDistilleryAccount && distilleryId) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          data={distillerySpirits}
          keyExtractor={(item) => item?.id ?? ''}
          renderItem={({ item }) => <DistillerySpiritItem item={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? renderDistilleryShelfEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
            />
          }
        />
        <FAB
          icon="plus"
          label="Add Spirit"
          style={styles.fab}
          onPress={() => router.push('/distilleries/spirit-form' as any)}
        />
      </SafeAreaView>
    );
  }

  // Render personal pours and radar for regular accounts
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        {activeTab === 'pours' && (
          searchVisible ? (
            <Searchbar
              placeholder="Search"
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchBar}
              onIconPress={() => {
                setSearchVisible(false);
                setSearchQuery('');
                setFilteredPours(pours);
              }}
              icon="close"
            />
          ) : (
            <Pressable style={styles.searchBarContainer} onPress={() => setSearchVisible(true)}>
              <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
              <Text style={styles.searchPlaceholder}>Search spirits, distilleries...</Text>
            </Pressable>
          )
        )}
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            {
              value: 'pours',
              label: 'My Pours',
              icon: 'glass-mug-variant',
            },
            {
              value: 'radar',
              label: 'On My Radar',
              icon: 'radar',
            },
          ]}
          style={styles.tabs}
        />
      </View>

      {activeTab === 'pours' ? (
        <FlatList
          data={filteredPours}
          keyExtractor={(item) => item?.id ?? ''}
          renderItem={({ item }) => <PourListItem item={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? renderPoursEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
            />
          }
        />
      ) : (
        <FlatList
          data={radarEntries}
          keyExtractor={(item) => item?.id ?? ''}
          renderItem={({ item }) => <RadarItemComponent item={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? renderRadarEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
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
    backgroundColor: Colors.background, // Deep Midnight Navy
  },
  header: {
    backgroundColor: Colors.surface, // Card surface for header
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  searchPlaceholder: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: Colors.textMuted,
  },
  searchBar: {
    backgroundColor: Colors.elevated, // Elevated surface for search
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tabs: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
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
    lineHeight: 26,
    marginBottom: spacing.xl,
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  emptyButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  radarCard: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface, // Card surface
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  radarCardContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
  },
  bottleImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  imagePlaceholder: {
    backgroundColor: Colors.elevated, // Elevated surface for placeholders
    justifyContent: 'center',
    alignItems: 'center',
  },
  spiritInfo: {
    flex: 1,
  },
  spiritName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text, // Primary text
    marginBottom: spacing.xs,
  },
  distillery: {
    fontSize: 14,
    color: Colors.textSecondary, // Secondary text
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary, // Secondary text - NOT accent
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  abv: {
    fontSize: 12,
    color: Colors.textMuted, // Muted text
  },
  pourCount: {
    fontSize: 12,
    color: Colors.accentPressed, // Small muted gold
    marginTop: spacing.xs,
  },
  removeButton: {
    margin: 0,
  },
  pourListImage: {
    width: 70,
    height: 90,
    borderRadius: 8,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  sharedText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sharedTextActive: {
    color: Colors.accent,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    height: 24,
    backgroundColor: Colors.elevated,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.accent,
  },
});
