import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

export const OCCASIONS = ['Casual', 'Special occasion', 'With food', 'Discovery', 'Gift', 'At a bar'];
export const MAX_OCCASIONS = 3;

interface TastingNotesProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  wouldPourAgain: string | null;
  onWouldPourAgainChange: (value: string | null) => void;
  occasions: string[];
  onOccasionsChange: (occasions: string[]) => void;
}

// Optional structured tasting notes: star rating, pour-again pills, occasion chips.
export function TastingNotes({
  rating,
  onRatingChange,
  wouldPourAgain,
  onWouldPourAgainChange,
  occasions,
  onOccasionsChange,
}: TastingNotesProps) {
  const toggleOccasion = (occasion: string) => {
    if (occasions.includes(occasion)) {
      onOccasionsChange(occasions.filter((o) => o !== occasion));
    } else if (occasions.length < MAX_OCCASIONS) {
      onOccasionsChange([...occasions, occasion]);
    }
  };

  return (
    <View>
      {/* Star rating */}
      <Text style={styles.sectionTitle}>Rating</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onRatingChange(rating === star ? null : star)}
            hitSlop={6}
          >
            <Ionicons
              name={rating !== null && star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={rating !== null && star <= rating ? Colors.accent : Colors.textMuted}
            />
          </Pressable>
        ))}
      </View>

      {/* Would you pour it again? */}
      <Text style={styles.sectionTitle}>Would you pour it again?</Text>
      <View style={styles.pillsRow}>
        {['Yes', 'No', 'Maybe'].map((option) => {
          const selected = wouldPourAgain === option;
          return (
            <Pressable
              key={option}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => onWouldPourAgainChange(selected ? null : option)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Occasion */}
      <Text style={styles.sectionTitle}>Occasion (up to {MAX_OCCASIONS})</Text>
      <View style={styles.chipsWrap}>
        {OCCASIONS.map((occasion) => {
          const selected = occasions.includes(occasion);
          return (
            <Pressable
              key={occasion}
              style={[styles.chip, selected && styles.pillSelected]}
              onPress={() => toggleOccasion(occasion)}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{occasion}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  pillSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pillText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pillTextSelected: {
    color: Colors.background,
    fontWeight: '700',
  },
});
