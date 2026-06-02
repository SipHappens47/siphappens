import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { TasteSummary } from '../../types';
import { Colors } from '../../constants/colors';
import { spacing } from '../../constants/theme';

interface TasteSummaryCardProps {
  tasteSummary: TasteSummary;
  isOwnProfile?: boolean;
}

export const TasteSummaryCard: React.FC<TasteSummaryCardProps> = ({ tasteSummary, isOwnProfile = true }) => {
  const flavorProgress = (tasteSummary?.flavorCount ?? 0) / (tasteSummary?.maxFlavors ?? 10);
  const regionProgress = Math.min((tasteSummary?.regionCount ?? 0) / 10, 1);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>
          📊 {isOwnProfile ? 'Your' : 'Their'} Taste Profile
        </Text>

        <Text style={styles.summary}>
          Explored {tasteSummary?.flavorCount ?? 0}/{tasteSummary?.maxFlavors ?? 10} flavors • 
          {tasteSummary?.regionCount ?? 0} regions • {tasteSummary?.distilleryCount ?? 0} distilleries
        </Text>

        {/* Flavor Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>🌈 Flavors</Text>
            <Text style={styles.progressValue}>
              {tasteSummary?.flavorCount ?? 0}/{tasteSummary?.maxFlavors ?? 10}
            </Text>
          </View>
          <ProgressBar
            progress={flavorProgress}
            color={Colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* Region Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>🗺️ Regions</Text>
            <Text style={styles.progressValue}>
              {tasteSummary?.regionCount ?? 0}/10
            </Text>
          </View>
          <ProgressBar
            progress={regionProgress}
            color={Colors.textSecondary}
            style={styles.progressBar}
          />
        </View>
      </Card.Content>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  progressValue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.divider,
  },
});
