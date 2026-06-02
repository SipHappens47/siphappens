import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { Badge } from '../../types';
import { Colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';

interface BadgesGridProps {
  badges: Badge[];
}

export const BadgesGrid: React.FC<BadgesGridProps> = ({ badges }) => {
  // Filter to only show earned badges (at least one tier unlocked)
  const earnedBadges = badges?.filter?.(
    (badge) => badge?.unlocked && badge?.unlocked?.length > 0
  ) ?? [];

  // Don't render anything if no earned badges
  if (!earnedBadges || earnedBadges.length === 0) {
    return null;
  }

  const getTierColor = (tier?: string | null): string => {
    if (!tier) return Colors.textMuted;
    switch (tier) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      default:
        return Colors.textMuted;
    }
  };

  const getTierLabel = (unlocked: Badge['unlocked']): string => {
    if (!unlocked || unlocked.length === 0) return '🔒 Locked';
    const tiers = unlocked?.map((u) => u?.tier)?.filter((t) => t != null) ?? [];
    if (tiers.includes('gold')) return '🥇 Gold';
    if (tiers.includes('silver')) return '🥈 Silver';
    if (tiers.includes('bronze')) return '🥉 Bronze';
    if (unlocked.length > 0) return '✅ Unlocked';
    return '🔒 Locked';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>🏆 Badges</Text>
      <View style={styles.grid}>
        {earnedBadges?.map?.((badge) => {
          const isLocked = !badge?.unlocked || badge?.unlocked?.length === 0;
          
          return (
            <Card key={badge?.id} style={styles.badgeCard}>
              <Card.Content style={styles.cardContent}>
                <View style={[styles.badgeImageContainer, isLocked && styles.lockedBadge]}>
                  {badge?.imageUrl ? (
                    <Image
                      source={{ uri: badge.imageUrl }}
                      style={styles.badgeImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.placeholderEmoji}>🏅</Text>
                  )}
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>
                  {badge?.name ?? 'Badge'}
                </Text>
                <Text style={styles.badgeDescription} numberOfLines={2}>
                  {badge?.description ?? ''}
                </Text>

                {/* Progress Bar */}
                <ProgressBar
                  progress={(badge?.progress?.percentage ?? 0) / 100}
                  color={Colors.primary}
                  style={styles.progressBar}
                />

                {/* Progress Text */}
                <Text style={styles.progressText}>
                  {badge?.progress?.current ?? 0}/{badge?.progress?.target ?? 0}
                  {badge?.progress?.nextTier
                    ? ` • Next: ${badge?.progress?.nextTier}`
                    : ''}
                </Text>

                {/* Tier Status */}
                <Text
                  style={[
                    styles.tierLabel,
                    {
                      color: getTierColor(
                        badge?.unlocked?.[badge?.unlocked?.length - 1]?.tier
                      ),
                    },
                  ]}
                >
                  {getTierLabel(badge?.unlocked ?? [])}
                </Text>
              </Card.Content>
            </Card>
          );
        }) ?? []}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cardContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  badgeImageContainer: {
    width: 80,
    height: 80,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  lockedBadge: {
    opacity: 0.4,
  },
  placeholderEmoji: {
    fontSize: 50,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
    marginBottom: 6,
  },
  progressText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
