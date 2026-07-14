import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Text, TextInput, Button, Switch, SegmentedButtons } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { useAuth } from '../../src/context/AuthContext';
import { Spirit, Badge } from '../../src/types';
import { FlavorTagSelector } from '../../src/components/FlavorTagSelector';
import { ImagePickerComponent } from '../../src/components/ImagePickerComponent';
import { TastingNotes } from '../../src/components/TastingNotes';
import { showBadgeToast } from '../../src/components/BadgeToast';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

const BADGE_SNAPSHOT_KEY = 'badgeProgressSnapshot';

export default function CreatePourScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [spirit, setSpirit] = useState<Spirit | null>(null);
  const [reviewType, setReviewType] = useState<'hit' | 'notMyStyle'>('hit');
  const [whyItHit, setWhyItHit] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [selectedFlavorTags, setSelectedFlavorTags] = useState<string[]>([]);
  const [isShared, setIsShared] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [wouldPourAgain, setWouldPourAgain] = useState<string | null>(null);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const spiritId = params?.spiritId as string;
      const passedImageUri = params?.imageUri as string;
      
      if (!spiritId) {
        Alert.alert('Error', 'Spirit not found');
        router.back();
        return;
      }

      // Pre-populate with the scan photo if available
      if (passedImageUri) {
        setImageUri(passedImageUri);
      }

      const spiritData = await apiService.getSpirit(spiritId);
      setSpirit(spiritData);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load spirit details');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!whyItHit?.trim()) {
      setError(reviewType === 'hit' ? 'Please share why this pour hit' : 'Please share your thoughts');
      return false;
    }
    if (whyItHit.trim().length < 10) {
      setError('Please write at least 10 characters');
      return false;
    }
    setError('');
    return true;
  };

  // Compare badge progress against the last stored snapshot; if a badge moved
  // forward, celebrate the one that progressed the most.
  const checkBadgeProgress = async () => {
    try {
      if (!user?.id) return;
      const badges: Badge[] = await apiService.getPublicUserBadges(user.id);
      const stored = await AsyncStorage.getItem(BADGE_SNAPSHOT_KEY);
      const previous: Record<string, number> = stored ? JSON.parse(stored) : {};

      let best: Badge | null = null;
      let bestDelta = 0;
      const snapshot: Record<string, number> = {};

      for (const badge of badges ?? []) {
        const pct = badge?.progress?.percentage ?? 0;
        snapshot[badge.id] = pct;
        const delta = pct - (previous[badge.id] ?? 0);
        if (delta > bestDelta) {
          bestDelta = delta;
          best = badge;
        }
      }

      await AsyncStorage.setItem(BADGE_SNAPSHOT_KEY, JSON.stringify(snapshot));

      // Only celebrate when we had a previous snapshot to compare against,
      // otherwise the very first pour would "progress" every badge at once.
      if (best && stored) {
        showBadgeToast({
          name: best.name,
          percentage: best.progress?.percentage ?? 0,
          nextTier: best.progress?.nextTier,
        });
      }
    } catch (error) {
      console.error('[CreatePour] Badge progress check failed:', error);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let imageFileId = undefined;
      if (imageUri) {
        // Upload as public if the pour is being shared, private otherwise
        imageFileId = await uploadService.uploadImage(
          imageUri,
          `pour-${Date.now()}.jpg`,
          isShared // Public if shared, private if not
        );
      }

      await apiService.createPour({
        spiritId: spirit?.id ?? '',
        whyItHit: whyItHit.trim(),
        isShared: isShared,
        image: imageFileId,
        flavorTags: selectedFlavorTags.length > 0 ? selectedFlavorTags.join(',') : undefined,
        rating: rating ?? undefined,
        wouldPourAgain: wouldPourAgain ?? undefined,
        occasions: occasions.length > 0 ? occasions.join(',') : undefined,
      });

      Alert.alert('Success', 'Pour saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            checkBadgeProgress(); // fire-and-forget: toast appears over the shelf
            router.replace('/tabs/shelf');
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to save pour:', error);
      Alert.alert('Error', 'Failed to save pour. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create Pour Entry</Text>

          <View style={styles.spiritInfo}>
            {spirit?.bottleImage && (
              <Image
                source={{ uri: spirit.bottleImage }}
                style={styles.bottleImage}
              />
            )}
            <View style={styles.spiritDetails}>
              <Text style={styles.spiritName}>{spirit?.name ?? ''}</Text>
              {spirit?.distilleryName && (
                <Text style={styles.distillery}>{spirit.distilleryName}</Text>
              )}
              {spirit?.category && (
                <Text style={styles.category}>{spirit.category}</Text>
              )}
            </View>
          </View>

          <View style={styles.form}>
            <SegmentedButtons
              value={reviewType}
              onValueChange={(value) => setReviewType(value as 'hit' | 'notMyStyle')}
              buttons={[
                {
                  value: 'hit',
                  label: 'Why it Hit',
                  icon: 'thumb-up-outline',
                },
                {
                  value: 'notMyStyle',
                  label: 'Tried Not My Style',
                  icon: 'thumb-down-outline',
                },
              ]}
              style={styles.reviewTypeTabs}
            />

            <TextInput
              label={reviewType === 'hit' ? 'Why It Hit *' : 'Your Thoughts *'}
              value={whyItHit}
              onChangeText={setWhyItHit}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={6}
              placeholder={
                reviewType === 'hit'
                  ? 'Share what made this pour special...'
                  : 'Share why this wasn\'t your style...'
              }
              error={!!error}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={styles.sectionTitle}>Flavor Tags</Text>
            <FlavorTagSelector
              category={spirit?.category}
              value={selectedFlavorTags}
              onChange={setSelectedFlavorTags}
            />

            <TastingNotes
              rating={rating}
              onRatingChange={setRating}
              wouldPourAgain={wouldPourAgain}
              onWouldPourAgainChange={setWouldPourAgain}
              occasions={occasions}
              onOccasionsChange={setOccasions}
            />

            <Text style={styles.sectionTitle}>Add Photo (Optional)</Text>
            <ImagePickerComponent
              imageUri={imageUri}
              onImageSelected={setImageUri}
              onImageRemoved={() => setImageUri(undefined)}
              label="Add Pour Photo"
            />

            <View style={styles.shareToggleContainer}>
              <View style={styles.shareToggleText}>
                <Text style={styles.shareToggleTitle}>Share to The Bar</Text>
                <Text style={styles.shareToggleDescription}>
                  {isShared
                    ? 'Visible to Fellow Sippers'
                    : 'Private - only you can see this'}
                </Text>
              </View>
              <Switch
                value={isShared}
                onValueChange={setIsShared}
                color={Colors.primary}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Save Pour
            </Button>
            <Button
              mode="text"
              onPress={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  spiritInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: spacing.lg,
  },
  bottleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.md,
    resizeMode: 'cover',
  },
  spiritDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  spiritName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  distillery: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  form: {
    gap: spacing.md,
  },
  reviewTypeTabs: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: -spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: spacing.sm,
  },
  shareToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginTop: spacing.md,
  },
  shareToggleText: {
    flex: 1,
  },
  shareToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.xs,
  },
  shareToggleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actions: {
    marginTop: spacing.xl,
    paddingBottom: 30,
    gap: spacing.sm,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
