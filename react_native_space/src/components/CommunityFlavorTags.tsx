import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

export interface CommunityTag {
  tag: string;
  count: number;
}

interface Props {
  tags?: CommunityTag[];
}

const MAX_TAGS = 8;

// "What Sippers Taste" — weighted community flavour tags for a spirit.
// The most common tag reads slightly larger/bolder; high-count tags get gold
// emphasis. Renders nothing when there's no qualifying data.
export function CommunityFlavorTags({ tags }: Props) {
  const items = (tags ?? []).slice(0, MAX_TAGS);
  if (items.length === 0) return null;

  const maxCount = items[0]?.count ?? 1;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>What Sippers Taste</Text>
      <View style={styles.chipWrap}>
        {items.map(({ tag, count }) => {
          // Scale text size with relative popularity (12–16px).
          const scale = maxCount > 0 ? count / maxCount : 0;
          const fontSize = 12 + Math.round(scale * 4);
          const fontWeight = scale >= 0.75 ? '700' : scale >= 0.5 ? '600' : '500';

          const solid = count >= 10;
          const outline = !solid && count >= 7;

          return (
            <View
              key={tag}
              style={[styles.chip, solid && styles.chipSolid, outline && styles.chipOutline]}
            >
              <Text
                style={[
                  styles.chipText,
                  { fontSize, fontWeight },
                  solid && styles.chipTextSolid,
                  outline && styles.chipTextOutline,
                ]}
              >
                {tag} <Text style={styles.count}>{count}</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  chipSolid: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipOutline: {
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
  },
  chipTextSolid: {
    color: Colors.background,
  },
  chipTextOutline: {
    color: Colors.primary,
  },
  count: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
});
