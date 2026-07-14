import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Text, TextInput, Button, Switch } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../src/services/api';
import { uploadService } from '../../../src/services/upload';
import { Pour } from '../../../src/types';
import { FlavorTagSelector } from '../../../src/components/FlavorTagSelector';
import { ImagePickerComponent } from '../../../src/components/ImagePickerComponent';
import { TastingNotes } from '../../../src/components/TastingNotes';
import { Colors } from '../../../src/constants/colors';
import { spacing } from '../../../src/constants/theme';

export default function EditPourScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [pour, setPour] = useState<Pour | null>(null);
  const [whyItHit, setWhyItHit] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [wouldPourAgain, setWouldPourAgain] = useState<string | null>(null);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [existingImageId, setExistingImageId] = useState<string | undefined>();
  const [selectedFlavorTags, setSelectedFlavorTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const pourId = params?.id as string;
      
      if (!pourId) {
        Alert.alert('Error', 'Pour not found');
        router.back();
        return;
      }

      const pourData = await apiService.getPour(pourId);

      setPour(pourData);
      setWhyItHit(pourData?.whyItHit ?? '');
      setIsShared(pourData?.isShared ?? false);
      setRating(pourData?.rating ?? null);
      setWouldPourAgain(pourData?.wouldPourAgain ?? null);
      setOccasions(pourData?.occasions ? pourData.occasions.split(',').filter(Boolean) : []);
      setExistingImageId(pourData?.image);
      
      if (pourData?.image) {
        const url = await uploadService.getImageUrl(pourData.image, 'view');
        setImageUri(url);
      }

      setSelectedFlavorTags(
        (pourData?.flavorTags ?? []).map((tag) => tag?.name ?? '').filter(Boolean)
      );
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load pour details');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!whyItHit?.trim()) {
      setError('Please share why this pour hit');
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
      let imageFileId = existingImageId;
      
      if (imageUri && !imageUri.startsWith('http')) {
        imageFileId = await uploadService.uploadImage(
          imageUri,
          `pour-${Date.now()}.jpg`,
          false
        );
      } else if (!imageUri) {
        imageFileId = undefined;
      }

      await apiService.updatePour(pour?.id ?? '', {
        whyItHit: whyItHit.trim(),
        image: imageFileId,
        isShared,
        flavorTags: selectedFlavorTags.join(','),
        rating,
        wouldPourAgain,
        occasions: occasions.length > 0 ? occasions.join(',') : null,
      });

      Alert.alert('Success', 'Pour updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to update pour:', error);
      Alert.alert('Error', 'Failed to update pour. Please try again.');
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Edit Pour</Text>

          <View style={styles.spiritInfo}>
            {pour?.spirit?.bottleImage && (
              <Image
                source={{ uri: pour.spirit.bottleImage }}
                style={styles.bottleImage}
              />
            )}
            <View style={styles.spiritDetails}>
              <Text style={styles.spiritName}>{pour?.spirit?.name ?? ''}</Text>
              {pour?.spirit?.distilleryName && (
                <Text style={styles.distillery}>{pour.spirit.distilleryName}</Text>
              )}
            </View>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Why It Hit *"
              value={whyItHit}
              onChangeText={setWhyItHit}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={6}
              error={!!error}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={styles.sectionTitle}>Flavor Tags</Text>
            <FlavorTagSelector
              category={pour?.spirit?.category}
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

            <Text style={styles.sectionTitle}>Photo</Text>
            <ImagePickerComponent
              imageUri={imageUri}
              onImageSelected={setImageUri}
              onImageRemoved={() => {
                setImageUri(undefined);
                setExistingImageId(undefined);
              }}
              label="Change Photo"
            />

            <View style={styles.shareRow}>
              <View style={styles.shareTextContainer}>
                <Text style={styles.shareTitle}>Share to The Bar</Text>
                <Text style={styles.shareSubtitle}>
                  {isShared ? 'Visible to Fellow Sippers in the feed' : 'Private — only you can see this pour'}
                </Text>
              </View>
              <Switch value={isShared} onValueChange={setIsShared} color={Colors.accent} />
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
              Save Changes
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
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.lg,
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
  },
  form: {
    gap: spacing.md,
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
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  shareTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  shareSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
