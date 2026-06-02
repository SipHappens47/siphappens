import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Text, TextInput, Button, Switch, SegmentedButtons } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { Spirit, FlavorTag } from '../../src/types';
import { FlavorChips } from '../../src/components/FlavorChips';
import { ImagePickerComponent } from '../../src/components/ImagePickerComponent';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function CreatePourScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [spirit, setSpirit] = useState<Spirit | null>(null);
  const [reviewType, setReviewType] = useState<'hit' | 'notMyStyle'>('hit');
  const [whyItHit, setWhyItHit] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [flavorTags, setFlavorTags] = useState<FlavorTag[]>([]);
  const [selectedFlavorTagIds, setSelectedFlavorTagIds] = useState<string[]>([]);
  const [isShared, setIsShared] = useState(false);
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

      const [spiritData, tags] = await Promise.all([
        apiService.getSpirit(spiritId),
        apiService.getFlavorTags(),
      ]);

      setSpirit(spiritData);
      setFlavorTags(tags ?? []);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load spirit details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlavorTag = (tagId: string) => {
    setSelectedFlavorTagIds((prev) =>
      prev?.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...(prev ?? []), tagId]
    );
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
        flavorTagIds: selectedFlavorTagIds,
      });

      Alert.alert('Success', 'Pour saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/tabs/shelf'),
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
            <FlavorChips
              tags={flavorTags}
              selectedIds={selectedFlavorTagIds}
              onToggle={handleToggleFlavorTag}
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
