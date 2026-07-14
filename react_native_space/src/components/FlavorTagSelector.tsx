import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Animated } from 'react-native';
import { getCategoryTags } from '../constants/flavorTags';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

const MAX_CATEGORY = 5;
const MAX_CUSTOM = 3;
const MAX_CUSTOM_LEN = 20;

interface Props {
  category?: string;
  // All selected tag names (category + custom), controlled by the parent.
  value: string[];
  onChange: (tags: string[]) => void;
}

// Sanitize custom tag input: letters, numbers and spaces only, capped length.
const sanitize = (text: string) => text.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, MAX_CUSTOM_LEN);

export function FlavorTagSelector({ category, value, onChange }: Props) {
  const categoryTags = getCategoryTags(category ?? '');
  const categorySet = new Set(categoryTags.map((t) => t.toLowerCase()));

  const selectedCategory = value.filter((v) => categorySet.has(v.toLowerCase()));
  const customTags = value.filter((v) => !categorySet.has(v.toLowerCase()));

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const shake = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    shake.setValue(0);
    Animated.sequence(
      [6, -6, 4, -4, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true }),
      ),
    ).start();
  };

  const isSelected = (tag: string) => value.some((v) => v.toLowerCase() === tag.toLowerCase());

  const toggleCategory = (tag: string) => {
    if (isSelected(tag)) {
      onChange(value.filter((v) => v.toLowerCase() !== tag.toLowerCase()));
      return;
    }
    if (selectedCategory.length >= MAX_CATEGORY) {
      triggerShake();
      return;
    }
    onChange([...value, tag]);
  };

  const addCustom = () => {
    const cleaned = sanitize(customText).trim();
    if (!cleaned || customTags.length >= MAX_CUSTOM) return;
    // Skip duplicates (case-insensitive) against everything already selected.
    if (!value.some((v) => v.toLowerCase() === cleaned.toLowerCase())) {
      onChange([...value, cleaned]);
    }
    setCustomText('');
    setShowCustomInput(false);
  };

  const removeCustom = (tag: string) => onChange(value.filter((v) => v !== tag));

  return (
    <View>
      {/* Category tag chips */}
      <Animated.View style={[styles.chipWrap, { transform: [{ translateX: shake }] }]}>
        {categoryTags.map((tag) => {
          const selected = isSelected(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggleCategory(tag)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tag}</Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Selected custom tags (removable) */}
      {customTags.length > 0 && (
        <View style={styles.chipWrap}>
          {customTags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => removeCustom(tag)}
              style={[styles.chip, styles.chipSelected]}
            >
              <Text style={[styles.chipText, styles.chipTextSelected]}>{tag}</Text>
              <Text style={styles.chipX}>  ✕</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Add custom tag */}
      {customTags.length < MAX_CUSTOM &&
        (showCustomInput ? (
          <View style={styles.customInputRow}>
            <TextInput
              value={customText}
              onChangeText={(t) => setCustomText(sanitize(t))}
              placeholder="Your tag"
              placeholderTextColor={Colors.textMuted}
              style={styles.customInput}
              maxLength={MAX_CUSTOM_LEN}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addCustom}
            />
            <Pressable onPress={addCustom} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setShowCustomInput(true)} style={styles.addCustomBtn}>
            <Text style={styles.addCustomText}>+ Add custom tag</Text>
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chipX: {
    fontSize: 11,
    color: Colors.primary,
  },
  addCustomBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  addCustomText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: Colors.text,
    backgroundColor: Colors.surface,
    fontSize: 14,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  addBtnText: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: 13,
  },
});
