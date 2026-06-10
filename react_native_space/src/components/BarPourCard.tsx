import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BarPour } from '../types';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface BarPourCardProps {
  pour: BarPour;
  onCheerToggle: (pourId: string, currentlyCheered: boolean) => void;
  onAddToRadar: (spiritId: string) => void;
  onViewDetails: (pourId: string) => void;
  onViewUserProfile?: (userId: string) => void;
  showOfficialBadge?: boolean;
}

export function BarPourCard({ pour, onCheerToggle, onAddToRadar, onViewDetails, onViewUserProfile, showOfficialBadge }: BarPourCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isOwnPour = !!user?.id && pour?.user?.id === user.id;
  const [pourImageUrl, setPourImageUrl] = useState<string | null>(null);
  const [bottleImageUrl, setBottleImageUrl] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [pour?.id]);

  const loadImages = async () => {
    try {
      // Load pour image
      if (pour?.image) {
        try {
          console.log('[BarPourCard] Loading pour image:', pour.image);
          const pourUrl = await apiService.getFileUrl(pour.image, 'view');
          console.log('[BarPourCard] Pour image URL received:', pourUrl);
          setPourImageUrl(pourUrl?.url ?? null);
        } catch (err: any) {
          console.error('[BarPourCard] Failed to load pour image:', err?.response?.status, err?.message);
        }
      }

      // Load bottle image
      if (pour?.spirit?.bottleImage) {
        if (pour.spirit.bottleImage.startsWith('http')) {
          console.log('[BarPourCard] Using direct bottle image URL:', pour.spirit.bottleImage);
          setBottleImageUrl(pour.spirit.bottleImage);
        } else {
          try {
            console.log('[BarPourCard] Loading bottle image:', pour.spirit.bottleImage);
            const bottleUrl = await apiService.getFileUrl(pour.spirit.bottleImage, 'view');
            console.log('[BarPourCard] Bottle image URL received:', bottleUrl);
            setBottleImageUrl(bottleUrl?.url ?? null);
          } catch (err: any) {
            console.error('[BarPourCard] Failed to load bottle image:', err?.response?.status, err?.message);
          }
        }
      }

      // Load profile photo
      if (pour?.user?.profilePhoto) {
        try {
          console.log('[BarPourCard] Loading profile photo:', pour.user.profilePhoto);
          const profileUrl = await apiService.getFileUrl(pour.user.profilePhoto, 'view');
          console.log('[BarPourCard] Profile photo URL received:', profileUrl);
          setProfilePhotoUrl(profileUrl?.url ?? null);
        } catch (err: any) {
          console.error('[BarPourCard] Failed to load profile photo:', err?.response?.status, err?.message);
        }
      }
    } catch (error) {
      console.error('[BarPourCard] General error in loadImages:', error);
    }
  };

  const handleCheerPress = () => {
    if (pour?.id) {
      onCheerToggle(pour.id, pour?.hasUserCheered ?? false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <Card style={styles.card}>
      {/* User Header */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          {profilePhotoUrl ? (
            <Image source={{ uri: profilePhotoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialCommunityIcons name="account" size={20} color={Colors.textMuted} />
            </View>
          )}
          <Pressable 
            style={styles.userTextContainer}
            onPress={() => {
              if (pour?.user?.id && onViewUserProfile) {
                onViewUserProfile(pour.user.id);
              }
            }}
          >
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{pour?.user?.name ?? 'Unknown'}</Text>
              {pour?.user?.isOfficial && (
                <View style={styles.sipHappensBadge}>
                  <MaterialCommunityIcons name="star-circle" size={16} color="#D4A017" />
                  <Text style={styles.sipHappensBadgeText}>Official</Text>
                </View>
              )}
              {!pour?.user?.isOfficial && showOfficialBadge && (
                <View style={styles.officialBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={16} color={Colors.accent} />
                  <Text style={styles.officialBadgeText}>Official Distillery</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>{formatDate(pour?.createdAt)}</Text>
          </Pressable>
        </View>
      </View>

      {/* Tap anywhere on the post to open it */}
      <Pressable onPress={() => onViewDetails(pour?.id ?? '')}>
        {pourImageUrl && (
          <Image
            source={{ uri: pourImageUrl }}
            style={styles.pourImage}
            resizeMode="cover"
          />
        )}

        <Card.Content style={styles.content}>
          <View style={styles.spiritRow}>
            {bottleImageUrl && (
              <Image
                source={{ uri: bottleImageUrl }}
                style={styles.bottleImage}
                resizeMode="contain"
              />
            )}
            <View style={styles.spiritInfo}>
              <Text style={styles.spiritName}>{pour?.spirit?.name ?? 'Unknown Spirit'}</Text>
              <View style={styles.metaRow}>
                {pour?.spirit?.category && (
                  <Text style={styles.category}>{pour.spirit.category}</Text>
                )}
                {pour?.spirit?.abv && (
                  <Text style={styles.abv}>{pour.spirit.abv}% ABV</Text>
                )}
              </View>
            </View>
          </View>

          {/* Why It Hit */}
          {pour?.whyItHit && (
            <Text style={styles.whyItHit}>{pour.whyItHit}</Text>
          )}

          {/* Flavor Tags */}
          {(pour?.flavorTags?.length ?? 0) > 0 && (
            <View style={styles.tagsContainer}>
              {(pour?.flavorTags ?? []).map((tag) => (
                <Chip key={tag?.id} style={styles.tag} textStyle={styles.tagText}>
                  {tag?.name}
                </Chip>
              ))}
            </View>
          )}
        </Card.Content>
      </Pressable>

      {/* Action Buttons */}
      <Card.Content>
        <View style={styles.actionsRow}>
          <Pressable onPress={handleCheerPress} style={styles.actionButton}>
            <MaterialCommunityIcons
              name={pour?.hasUserCheered ? 'glass-mug-variant' : 'glass-mug-variant-off'}
              size={20}
              color={pour?.hasUserCheered ? Colors.accent : Colors.textMuted}
            />
            <Text
              style={[
                styles.actionText,
                pour?.hasUserCheered && styles.actionTextActive,
              ]}
            >
              Cheers
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onAddToRadar(pour?.spirit?.id ?? '')}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons
              name="radar"
              size={20}
              color={Colors.textMuted}
            />
            <Text style={styles.actionText}>Add to Radar</Text>
          </Pressable>

          {/* Edit shortcut on the user's own posts only */}
          {isOwnPour && (
            <Pressable
              onPress={() => router.push(`/pour/edit/${pour?.id ?? ''}` as any)}
              style={styles.actionButton}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={20}
                color={Colors.textMuted}
              />
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: Colors.surface, // Premium card surface
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  userHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userTextContainer: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sipHappensBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  sipHappensBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A017',
    letterSpacing: 0.3,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.elevated,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  officialBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
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
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text, // Primary text
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted, // Muted for timestamps
    marginTop: 2,
  },
  pourImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: spacing.md,
  },
  spiritRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bottleImage: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  spiritInfo: {
    flex: 1,
  },
  spiritName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.xs,
  },
  distillery: {
    fontSize: 14,
    color: Colors.textSecondary, // Secondary text hierarchy
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary, // NOT accent - just metadata
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  abv: {
    fontSize: 12,
    color: Colors.textMuted, // Muted for secondary info
  },
  whyItHit: {
    fontSize: 14,
    color: Colors.text, // Primary text for content
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: Colors.elevated, // Subtle elevated surface
    height: 28,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary, // Secondary text for tags
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: 13,
    color: Colors.textMuted, // Muted for inactive actions
    fontWeight: '500',
  },
  actionTextActive: {
    color: Colors.accent, // Accent ONLY when active
  },
});
