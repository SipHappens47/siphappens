import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Text, TextInput, Divider, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../services/api';
import { uploadService } from '../services/upload';
import { UniversalSearchResults } from '../types';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

interface UniversalSearchProps {
  placeholder?: string;
  onResultSelect?: () => void;
  externalQuery?: string;
  hideSearchInput?: boolean;
}

export function UniversalSearch({ placeholder, onResultSelect, externalQuery, hideSearchInput }: UniversalSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const activeQuery = externalQuery !== undefined ? externalQuery : searchQuery;
  const [results, setResults] = useState<UniversalSearchResults>({
    users: [],
    spirits: [],
    distilleries: [],
    flavorTags: [],
    categories: [],
    locations: [],
    reviews: [],
  });
  const [loading, setLoading] = useState(false);
  const [userPhotoUris, setUserPhotoUris] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults({
        users: [],
        spirits: [],
        distilleries: [],
        flavorTags: [],
        categories: [],
        locations: [],
        reviews: [],
      });
      setUserPhotoUris({});
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    try {
      setLoading(true);
      console.log('[UniversalSearchComponent] Starting search for:', query);
      const searchResults = await apiService.universalSearch(query);
      console.log('[UniversalSearchComponent] Results received:', {
        users: searchResults?.users?.length ?? 0,
        spirits: searchResults?.spirits?.length ?? 0,
        distilleries: searchResults?.distilleries?.length ?? 0
      });
      if (searchResults?.users && searchResults.users.length > 0) {
        console.log('[UniversalSearchComponent] USER NAMES:', searchResults.users.map((u: any) => u.name).join(', '));
      }
      setResults(searchResults ?? {
        users: [],
        spirits: [],
        distilleries: [],
        flavorTags: [],
        categories: [],
        locations: [],
        reviews: [],
      });

      // Load profile photos for users
      if (searchResults?.users && searchResults.users.length > 0) {
        const photoUris: Record<string, string> = {};
        await Promise.all(
          searchResults.users.slice(0, 3).map(async (user: any) => {
            if (user?.profilePhoto) {
              try {
                const uri = await uploadService.getImageUrl(user.profilePhoto, 'view');
                if (uri) {
                  photoUris[user.id] = uri;
                }
              } catch (error) {
                console.error('Failed to load user photo:', error);
              }
            }
          })
        );
        setUserPhotoUris(photoUris);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Search error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Debounce search by 300ms
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(activeQuery);
    }, 300) as any;

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [activeQuery, performSearch]);

  const handleResultPress = (type: string, id?: string, name?: string) => {
    onResultSelect?.();

    switch (type) {
      case 'user':
        if (id) router.push(`/user/${id}` as any);
        break;
      case 'spirit':
        if (id) router.push(`/spirit/${id}` as any);
        break;
      case 'distillery':
        if (id) router.push(`/distilleries/${id}` as any);
        break;
      case 'flavorTag':
        // TODO: Navigate to filtered spirits by flavor tag
        console.log('Navigate to flavor tag:', name);
        break;
      case 'category':
        // TODO: Navigate to filtered spirits by category
        console.log('Navigate to category:', name);
        break;
      case 'location':
        // TODO: Navigate to filtered spirits/distilleries by location
        console.log('Navigate to location:', name);
        break;
      case 'review':
        if (id) router.push(`/pour/${id}`);
        break;
    }
  };

  const toggleSectionExpanded = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const hasResults = () => {
    return (
      (results.users?.length ?? 0) > 0 ||
      (results.spirits?.length ?? 0) > 0 ||
      (results.distilleries?.length ?? 0) > 0 ||
      (results.flavorTags?.length ?? 0) > 0 ||
      (results.categories?.length ?? 0) > 0 ||
      (results.locations?.length ?? 0) > 0 ||
      (results.reviews?.length ?? 0) > 0
    );
  };

  const renderSectionHeader = (title: string, icon: string, count: number) => {
    if (count === 0) return null;

    return (
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon as any} size={18} color={Colors.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
    );
  };

  const renderUser = (user: any) => {
    const photoUri = userPhotoUris[user.id];
    
    return (
      <Pressable
        key={user.id}
        style={styles.resultItem}
        onPress={() => handleResultPress('user', user.id)}
      >
        {photoUri ? (
          <Avatar.Image
            size={40}
            source={{ uri: photoUri }}
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text
            size={40}
            label={user.name?.[0]?.toUpperCase() ?? 'U'}
            style={styles.avatar}
          />
        )}
        <View style={styles.resultContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.resultTitle}>{user.name}</Text>
            {user.isOfficial && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(212, 160, 23, 0.15)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(212, 160, 23, 0.3)' }}>
                <MaterialCommunityIcons name="star-circle" size={12} color="#D4A017" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#D4A017' }}>Official</Text>
              </View>
            )}
          </View>
          {user.experienceLevel && (
            <Text style={styles.resultSubtitle}>
              {user.isOfficial ? 'SipHappens Official' : `${user.experienceLevel} Sipper`}
              {user.bio ? ` • ${user.bio.substring(0, 30)}${user.bio.length > 30 ? '...' : ''}` : ''}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </Pressable>
    );
  };

  const renderSpirit = (spirit: any) => {
    const imageUrl = spirit.bottleImage || 'https://i.pinimg.com/736x/10/a7/b0/10a7b0da924fe1e621a7df52e1f3b023.jpg';
    
    return (
      <Pressable
        key={spirit.id}
        style={styles.resultItem}
        onPress={() => handleResultPress('spirit', spirit.id)}
      >
        <Avatar.Image 
          size={50} 
          source={{ uri: imageUrl }} 
          style={styles.bottleImage}
        />
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{spirit.name}</Text>
          <Text style={styles.resultSubtitle}>
            {[spirit.distillery?.name, spirit.category].filter(Boolean).join(' • ')}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </Pressable>
    );
  };

  const renderDistillery = (distillery: any) => (
    <Pressable
      key={distillery.id}
      style={styles.resultItem}
      onPress={() => handleResultPress('distillery', distillery.id)}
    >
      <Avatar.Icon size={40} icon="factory" style={styles.avatar} />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{distillery.name}</Text>
        <Text style={styles.resultSubtitle}>
          {[distillery.region, distillery.country, `${distillery.spiritsCount} spirits`]
            .filter(Boolean)
            .join(' • ')}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  const renderFlavorTag = (tag: any) => (
    <Pressable
      key={tag.id}
      style={styles.resultItem}
      onPress={() => handleResultPress('flavorTag', tag.id, tag.name)}
    >
      <Avatar.Icon size={40} icon="tag" style={styles.avatar} />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{tag.name}</Text>
        <Text style={styles.resultSubtitle}>
          {tag.spiritsCount} spirits • {tag.poursCount} reviews
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  const renderCategory = (category: any) => (
    <Pressable
      key={category.name}
      style={styles.resultItem}
      onPress={() => handleResultPress('category', undefined, category.name)}
    >
      <Avatar.Icon size={40} icon="view-grid" style={styles.avatar} />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{category.name}</Text>
        <Text style={styles.resultSubtitle}>{category.spiritsCount} spirits</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  const renderLocation = (location: any) => (
    <Pressable
      key={location.name}
      style={styles.resultItem}
      onPress={() => handleResultPress('location', undefined, location.name)}
    >
      <Avatar.Icon size={40} icon="map-marker" style={styles.avatar} />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{location.name}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  const renderReview = (review: any) => (
    <Pressable
      key={review.id}
      style={styles.resultItem}
      onPress={() => handleResultPress('review', review.id)}
    >
      <Avatar.Text
        size={40}
        label={review.user?.name?.[0]?.toUpperCase() ?? 'U'}
        style={styles.avatar}
      />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {review.spirit?.name}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={2}>
          {review.preview}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {!hideSearchInput && (
        <TextInput
          mode="outlined"
          placeholder={placeholder ?? 'Search spirits, distilleries, or sippers…'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
          right={
            loading ? (
              <TextInput.Icon icon={() => <ActivityIndicator size={20} color={Colors.accent} />} />
            ) : searchQuery ? (
              <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} />
            ) : null
          }
        />
      )}

      {activeQuery.trim().length >= 2 && (
        <View style={styles.resultsContainer}>
          {!loading && !hasResults() && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="magnify"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          )}

          {hasResults() && (
            <FlatList
              data={[
                { type: 'section', title: 'Flavor Tags', icon: 'tag', items: results.flavorTags },
                { type: 'section', title: 'Spirits', icon: 'bottle-wine', items: results.spirits },
                { type: 'section', title: 'Distilleries', icon: 'factory', items: results.distilleries },
                { type: 'section', title: 'Sippers', icon: 'account', items: results.users },
                { type: 'section', title: 'Categories', icon: 'view-grid', items: results.categories },
                { type: 'section', title: 'Locations', icon: 'map-marker', items: results.locations },
                { type: 'section', title: 'Reviews', icon: 'comment-text', items: results.reviews },
              ]}
              renderItem={({ item }) => {
                if (item.type === 'section') {
                  const items = item.items ?? [];
                  if (items.length === 0) return null;

                  const isExpanded = expandedSections[item.title] ?? false;
                  const itemsToShow = isExpanded ? items : items.slice(0, 3);

                  return (
                    <View key={item.title}>
                      {renderSectionHeader(item.title, item.icon, items.length)}
                      {itemsToShow.map((resultItem: any) => {
                        switch (item.title) {
                          case 'Sippers':
                            return renderUser(resultItem);
                          case 'Spirits':
                            return renderSpirit(resultItem);
                          case 'Distilleries':
                            return renderDistillery(resultItem);
                          case 'Flavor Tags':
                            return renderFlavorTag(resultItem);
                          case 'Categories':
                            return renderCategory(resultItem);
                          case 'Locations':
                            return renderLocation(resultItem);
                          case 'Reviews':
                            return renderReview(resultItem);
                          default:
                            return null;
                        }
                      })}
                      {items.length > 3 && (
                        <Pressable 
                          style={styles.seeAllButton}
                          onPress={() => toggleSectionExpanded(item.title)}
                        >
                          <Text style={styles.seeAllText}>
                            {isExpanded ? 'Show less' : `See all ${items.length} results`}
                          </Text>
                          <MaterialCommunityIcons
                            name={isExpanded ? "chevron-up" : "chevron-right"}
                            size={16}
                            color={Colors.accent}
                          />
                        </Pressable>
                      )}
                      <Divider style={styles.sectionDivider} />
                    </View>
                  );
                }
                return null;
              }}
              keyExtractor={(item, index) => `${item.title}-${index}`}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    marginBottom: spacing.md,
  },
  resultsContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionDivider: {
    marginVertical: spacing.md,
    backgroundColor: Colors.divider,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  avatar: {
    backgroundColor: Colors.elevated,
  },
  bottleImage: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: spacing.xs,
  },
});
