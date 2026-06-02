import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip } from 'react-native-paper';
import { FlavorTag } from '../types';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/colors';

interface FlavorChipsProps {
  tags: FlavorTag[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  editable?: boolean;
}

export const FlavorChips: React.FC<FlavorChipsProps> = ({
  tags,
  selectedIds,
  onToggle,
  editable = true,
}) => {
  const isSelected = (tagId: string) => selectedIds?.includes(tagId) ?? false;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {(tags ?? []).map((tag) => (
        <Chip
          key={tag?.id ?? ''}
          selected={isSelected(tag?.id ?? '')}
          onPress={() => editable && onToggle?.(tag?.id ?? '')}
          style={[
            styles.chip,
            isSelected(tag?.id ?? '') && styles.chipSelected,
          ]}
          textStyle={[
            styles.chipText,
            isSelected(tag?.id ?? '') && styles.chipTextSelected,
          ]}
          mode="outlined"
          disabled={!editable}
        >
          {tag?.name ?? ''}
        </Chip>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    color: Colors.primary,
  },
  chipTextSelected: {
    color: Colors.white,
  },
});
