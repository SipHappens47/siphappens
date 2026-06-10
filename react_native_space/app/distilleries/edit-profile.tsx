import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { ImagePickerComponent } from '../../src/components/ImagePickerComponent';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function EditDistilleryProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const distilleryId = user?.distilleryId;

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [logoUri, setLogoUri] = useState<string | undefined>();
  const [heroUri, setHeroUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!distilleryId) {
      Alert.alert('Error', 'No distillery linked to this account');
      router.back();
      return;
    }
    try {
      setLoading(true);
      const profile = await apiService.getDistilleryProfile(distilleryId);
      setName(profile?.name ?? '');
      setBio(profile?.bio ?? '');
      setRegion(profile?.region ?? '');
      setCountry(profile?.country ?? '');
      setLogoUri(profile?.logo ?? undefined);
      setHeroUri(profile?.heroImage ?? undefined);
    } catch (error) {
      console.error('Failed to load distillery profile:', error);
      Alert.alert('Error', 'Failed to load distillery profile');
    } finally {
      setLoading(false);
    }
  };

  // Uploads a local image and returns its permanent public URL.
  const uploadToPublicUrl = async (localUri: string, prefix: string): Promise<string> => {
    const fileId = await uploadService.uploadImage(localUri, `${prefix}-${Date.now()}.jpg`, true);
    return uploadService.getImageUrl(fileId, 'view');
  };

  const handleSave = async () => {
    if (!distilleryId) return;
    if (!name?.trim()) {
      Alert.alert('Error', 'Distillery name is required');
      return;
    }

    setSaving(true);
    try {
      let logoUrl = logoUri;
      let heroUrl = heroUri;

      // Only upload images that were newly picked (local file URIs, not http URLs)
      if (logoUri && !logoUri.startsWith('http')) {
        logoUrl = await uploadToPublicUrl(logoUri, 'distillery-logo');
      }
      if (heroUri && !heroUri.startsWith('http')) {
        heroUrl = await uploadToPublicUrl(heroUri, 'distillery-hero');
      }

      await apiService.updateDistilleryProfile(distilleryId, {
        name: name.trim(),
        bio: bio?.trim() || undefined,
        region: region?.trim() || undefined,
        country: country?.trim() || undefined,
        logo: logoUrl,
        heroImage: heroUrl,
      });

      await refreshUser();
      Alert.alert('Success', 'Distillery profile updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Failed to update distillery profile:', error);
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to update profile. Please try again.');
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
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Edit Distillery</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.photoSection}>
            <Text style={styles.sectionLabel}>Logo</Text>
            <ImagePickerComponent
              imageUri={logoUri}
              onImageSelected={setLogoUri}
              onImageRemoved={() => setLogoUri(undefined)}
              label="Add Logo"
            />
          </View>

          <View style={styles.photoSection}>
            <Text style={styles.sectionLabel}>Cover Photo</Text>
            <ImagePickerComponent
              imageUri={heroUri}
              onImageSelected={setHeroUri}
              onImageRemoved={() => setHeroUri(undefined)}
              label="Add Cover Photo"
            />
          </View>

          <View style={styles.form}>
            <TextInput
              label="Distillery Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="Tell sippers about your distillery..."
            />

            <TextInput
              label="Region"
              value={region}
              onChangeText={setRegion}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Western Cape"
            />

            <TextInput
              label="Country"
              value={country}
              onChangeText={setCountry}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., South Africa"
            />

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  button: {
    marginTop: spacing.md,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
});
