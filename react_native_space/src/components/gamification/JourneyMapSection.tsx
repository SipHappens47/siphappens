import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, List, ProgressBar } from 'react-native-paper';
import { TasteSummary, Badge } from '../../types';
import { Colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';

interface JourneyMapSectionProps {
  tasteSummary: TasteSummary;
  badges: Badge[];
  isOwnProfile?: boolean;
}

export const JourneyMapSection: React.FC<JourneyMapSectionProps> = ({ tasteSummary, badges, isOwnProfile = true }) => {
  const [expanded, setExpanded] = useState(false);
  const [badgeProgressExpanded, setBadgeProgressExpanded] = useState(false);

  // Get top 3 flavors by count
  const topFlavors = (tasteSummary?.flavorDistribution ?? [])
    .sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0))
    .slice(0, 5);

  // Get top 3 regions by count
  const topRegions = (tasteSummary?.regions ?? [])
    .sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0))
    .slice(0, 5);

  // Calculate badge progress for each badge
  const badgeProgress = badges?.map?.((badge) => ({
    name: badge?.name ?? 'Badge',
    percentage: badge?.progress?.percentage ?? 0,
    nextTier: badge?.progress?.nextTier,
  })) ?? [];

  return (
    <Card style={styles.card}>
      <List.Accordion
        title={`🧭 ${isOwnProfile ? 'Your' : 'Their'} Journey Map`}
        titleStyle={styles.accordionTitle}
        style={styles.accordion}
        expanded={expanded}
        onPress={() => setExpanded(!expanded)}
      >
        <Card.Content style={styles.content}>
          {/* Top Flavors */}
          {topFlavors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌈 Top Flavor Notes</Text>
              {topFlavors?.map?.((flavor, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listLabel}>
                    {flavor?.name ?? 'Unknown'}
                  </Text>
                  <Text style={styles.listCount}>{flavor?.count ?? 0} pours</Text>
                </View>
              )) ?? []}
            </View>
          )}

          {/* Top Regions */}
          {topRegions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🗺️ Explored Regions</Text>
              {topRegions?.map?.((region, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listLabel}>
                    {region?.name ?? 'Unknown'}
                  </Text>
                  <Text style={styles.listCount}>{region?.count ?? 0} pours</Text>
                </View>
              )) ?? []}
            </View>
          )}

          {/* Badge Progress - Collapsible */}
          <View style={styles.section}>
            <List.Accordion
              title="🏆 Badge Progress"
              titleStyle={styles.badgeAccordionTitle}
              style={styles.badgeAccordion}
              expanded={badgeProgressExpanded}
              onPress={() => setBadgeProgressExpanded(!badgeProgressExpanded)}
            >
              {badgeProgress?.map?.((badge, index) => (
                <View key={index} style={styles.badgeProgressItem}>
                  <View style={styles.badgeProgressHeader}>
                    <Text style={styles.badgeProgressLabel}>
                      {badge?.name ?? 'Badge'}
                    </Text>
                    <Text style={styles.badgeProgressValue}>
                      {badge?.percentage ?? 0}%
                      {badge?.nextTier ? ` to ${badge.nextTier}` : ''}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={(badge?.percentage ?? 0) / 100}
                    color={Colors.primary}
                    style={styles.badgeProgressBar}
                  />
                </View>
              )) ?? []}
            </List.Accordion>
          </View>
        </Card.Content>
      </List.Accordion>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  accordion: {
    backgroundColor: Colors.surface,
    paddingVertical: 0,
  },
  accordionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  listLabel: {
    fontSize: 14,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  listCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  badgeProgressItem: {
    marginBottom: spacing.md,
  },
  badgeProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeProgressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  badgeProgressValue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  badgeProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
  },
  badgeAccordion: {
    backgroundColor: 'transparent',
    paddingLeft: 0,
    paddingVertical: 0,
  },
  badgeAccordionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
