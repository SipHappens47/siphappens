import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Menu, Divider, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { ImagePickerComponent } from '../../src/components/ImagePickerComponent';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function EditProfileScreen() {
  const { refreshUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>();
  const [existingProfilePhotoId, setExistingProfilePhotoId] = useState<string | undefined>();
  const [heroUri, setHeroUri] = useState<string | undefined>();
  const [experienceLevel, setExperienceLevel] = useState<'Curious' | 'Social' | 'Serious'>('Curious');
  const [menuVisible, setMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      const profile = await apiService.getProfile();
      setName(profile?.name ?? '');
      setBio(profile?.bio ?? '');
      setExperienceLevel((profile?.experienceLevel as any) ?? 'Curious');
      
      if (profile?.profilePhoto) {
        setExistingProfilePhotoId(profile.profilePhoto);
        const url = await uploadService.getImageUrl(profile.profilePhoto, 'view');
        setProfilePhotoUri(url);
      }
      setHeroUri(profile?.heroImage ?? undefined);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      let profilePhotoId = existingProfilePhotoId;
      
      if (profilePhotoUri && !profilePhotoUri.startsWith('http')) {
        profilePhotoId = await uploadService.uploadImage(
          profilePhotoUri,
          `profile-${Date.now()}.jpg`,
          true
        );
      } else if (!profilePhotoUri) {
        profilePhotoId = undefined;
      }

      // Hero (cover) photo is stored as a direct public URL
      let heroUrl = heroUri;
      if (heroUri && !heroUri.startsWith('http')) {
        const heroFileId = await uploadService.uploadImage(heroUri, `hero-${Date.now()}.jpg`, true);
        heroUrl = await uploadService.getImageUrl(heroFileId, 'view');
      }

      await apiService.updateProfile({
        name: name.trim(),
        bio: bio?.trim() || undefined,
        profilePhoto: profilePhotoId,
        heroImage: heroUrl,
        experienceLevel,
      });

      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    // Alert.alert is a no-op on web, so confirm on web via window.confirm.
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to logout?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Logout', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (!confirmed) return;
    await logout();
    router.replace('/auth/welcome');
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
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.photoSection}>
            <ImagePickerComponent
              imageUri={profilePhotoUri}
              onImageSelected={setProfilePhotoUri}
              onImageRemoved={() => {
                setProfilePhotoUri(undefined);
                setExistingProfilePhotoId(undefined);
              }}
              label="Add Profile Photo"
            />
          </View>

          <View style={styles.photoSection}>
            <ImagePickerComponent
              imageUri={heroUri}
              onImageSelected={setHeroUri}
              onImageRemoved={() => setHeroUri(undefined)}
              label="Add Cover Photo"
            />
          </View>

          <View style={styles.form}>
            <TextInput
              label="Name *"
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
              placeholder="Share a bit about your spirits journey..."
            />

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TextInput
                  label="Experience Level"
                  value={experienceLevel}
                  mode="outlined"
                  style={styles.input}
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setMenuVisible(true)} />}
                  editable={false}
                  onPressIn={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setExperienceLevel('Curious');
                  setMenuVisible(false);
                }}
                title="Curious"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  setExperienceLevel('Social');
                  setMenuVisible(false);
                }}
                title="Social"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  setExperienceLevel('Serious');
                  setMenuVisible(false);
                }}
                title="Serious"
              />
            </Menu>

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Save Profile
            </Button>
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              textColor={Colors.error}
            >
              Logout
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
    backgroundColor: Colors.background, // Deep Midnight Navy
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.surface, // Card surface
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text, // Primary text
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
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: Colors.surface, // Card surface for inputs
  },
  button: {
    marginTop: spacing.md,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
  settingsSection: {
    backgroundColor: Colors.surface, // Card surface
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text, // Primary text
    marginBottom: spacing.md,
  },
  settingItem: {
    marginBottom: spacing.md,
  },
  settingLabel: {
    fontSize: 12,
    color: Colors.textMuted, // Muted text for labels
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.text, // Primary text
  },
  logoutSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    borderColor: Colors.error,
  },
});
