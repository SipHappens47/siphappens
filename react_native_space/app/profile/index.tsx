import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator } from 'react-native';
import { Text, Button, IconButton, Avatar, Dialog, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { BadgesGrid } from '../../src/components/gamification/BadgesGrid';
import { TasteSummaryCard } from '../../src/components/gamification/TasteSummaryCard';
import { JourneyMapSection } from '../../src/components/gamification/JourneyMapSection';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { Badge, TasteSummary } from '../../src/types';
import * as DocumentPicker from 'expo-document-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isDistillery = user?.isDistilleryAccount ?? false;

  // CRITICAL: Distillery accounts should see their fancy distillery page, not simple profile
  useEffect(() => {
    if (isDistillery && user?.distilleryId) {
      console.log('[Profile] Distillery account detected, redirecting to fancy distillery page');
      router.replace(`/distilleries/${user.distilleryId}`);
    }
  }, [isDistillery, user?.distilleryId]);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>();
  const [experienceLevel, setExperienceLevel] = useState<'Curious' | 'Social' | 'Serious'>('Curious');
  const [poursCount, setPoursCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [tasteSummary, setTasteSummary] = useState<TasteSummary | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isDistillery) {
      loadProfile();
    }
  }, [isDistillery]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isDistillery) {
        loadProfile();
      }
    }, [isDistillery])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Load profile data
      const profile = await apiService.getProfile();
      setName(profile?.name ?? '');
      setBio(profile?.bio ?? '');
      setExperienceLevel((profile?.experienceLevel as any) ?? 'Curious');
      setPoursCount(profile?.poursCount ?? 0);
      setConnectionsCount(profile?.connectionsCount ?? 0);
      
      if (profile?.profilePhoto) {
        const url = await uploadService.getImageUrl(profile.profilePhoto, 'view');
        setProfilePhotoUri(url);
      } else {
        setProfilePhotoUri(undefined);
      }

      // Load badges and taste summary
      const [badgesData, tasteSummaryData] = await Promise.all([
        apiService.getBadges(),
        apiService.getTasteSummary(),
      ]);
      
      console.log('[Profile] Badges loaded:', badgesData?.length ?? 0);
      console.log('[Profile] Taste summary loaded:', JSON.stringify(tasteSummaryData));
      
      setBadges(badgesData ?? []);
      setTasteSummary(tasteSummaryData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionTap = () => {
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);

    // Reset timer
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    // If 7 taps within 3 seconds, show admin dialog
    if (newTapCount >= 7) {
      setShowAdminDialog(true);
      setTapCount(0);
    } else {
      // Reset tap count after 3 seconds
      tapTimer.current = setTimeout(() => {
        setTapCount(0);
      }, 3000) as any;
    }
  };

  const handleAutoImport = async () => {
    try {
      setSeedLoading(true);
      Alert.alert('Auto Import Started', 'Downloading and importing data from Connecticut and Iowa datasets. This may take a few minutes...');
      
      const response = await apiService.autoImportSpirits();
      
      setSeedLoading(false);
      setShowAdminDialog(false);
      
      Alert.alert(
        'Import Complete!',
        `Successfully imported ${response.totalImported} spirits!\n\n` +
        `Connecticut: ${response.connecticut}\n` +
        `Iowa: ${response.iowa}\n` +
        `Duplicates skipped: ${response.totalDuplicates}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setSeedLoading(false);
      Alert.alert('Import Failed', error?.message ?? 'Failed to import spirits');
    }
  };

  const handleUploadCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      setSeedLoading(true);
      
      Alert.alert('Upload Started', `Processing ${file.name}...`);
      
      const uploadResponse = await apiService.uploadCsvForImport(file.uri);
      
      setSeedLoading(false);
      setShowAdminDialog(false);
      
      Alert.alert(
        'Upload Complete!',
        `Successfully imported ${uploadResponse.totalImported} spirits from ${file.name}!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setSeedLoading(false);
      Alert.alert('Upload Failed', error?.message ?? 'Failed to upload CSV');
    }
  };

  const handleGetStats = async () => {
    try {
      const stats = await apiService.getSeedStats();
      Alert.alert(
        'Database Statistics',
        `Total Spirits: ${stats.totalSpirits}\n` +
        `Total Distilleries: ${stats.totalDistilleries}\n` +
        `Spirits with Images: ${stats.spiritsWithImages}\n` +
        `Spirits without Images: ${stats.spiritsWithoutImages}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to get stats');
    }
  };

  const handleSeedTestDistilleries = async () => {
    try {
      setSeedLoading(true);
      Alert.alert('Seeding Started', 'Creating test distilleries with profiles, spirits, and pours...');
      
      const response = await apiService.seedTestDistilleries();
      
      setSeedLoading(false);
      setShowAdminDialog(false);
      
      Alert.alert(
        'Test Distilleries Seeded Successfully!',
        `Successfully created ${response.count} distilleries with complete profiles, spirits, and pours.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setSeedLoading(false);
      Alert.alert('Seed Failed', error?.message ?? 'Failed to seed test distilleries');
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
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>My Profile</Text>
        <IconButton
          icon="pencil"
          size={24}
          onPress={() => router.push('/profile/edit')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo Section */}
        <View style={styles.profilePhotoSection}>
          {profilePhotoUri ? (
            <Avatar.Image
              size={120}
              source={{ uri: profilePhotoUri }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon
              size={120}
              icon="account"
              style={styles.avatar}
            />
          )}
        </View>

        {/* Stats: Pours + Friends */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{poursCount}</Text>
            <Text style={styles.statLabel}>Pours</Text>
          </View>
          <View style={styles.statDivider} />
          <Pressable style={styles.statItem} onPress={() => router.push('/connections')}>
            <Text style={styles.statNumber}>{connectionsCount}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </Pressable>
        </View>

        {/* Profile Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.infoValue}>{name || 'Not set'}</Text>
              {isDistillery && (
                <MaterialCommunityIcons name="check-decagram" size={20} color={Colors.accent} />
              )}
            </View>
          </View>

          {bio ? (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.infoValue}>{bio}</Text>
            </View>
          ) : null}

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Experience Level</Text>
            <Text style={styles.infoValue}>{experienceLevel}</Text>
          </View>
        </View>

        {/* Gamification Section */}
        {tasteSummary && (
          <TasteSummaryCard tasteSummary={tasteSummary} />
        )}

        {badges && badges.length > 0 && (
          <BadgesGrid badges={badges} />
        )}

        {tasteSummary && badges && badges.length > 0 && (
          <JourneyMapSection tasteSummary={tasteSummary} badges={badges} />
        )}

        {/* Hidden Version Number (Tap 7 times to reveal admin) */}
        <Pressable onPress={handleVersionTap} style={styles.versionContainer}>
          <Text style={styles.versionText}>v1.0.1</Text>
        </Pressable>
      </ScrollView>

      {/* Admin Seed Dialog */}
      <Portal>
        <Dialog visible={showAdminDialog} onDismiss={() => setShowAdminDialog(false)}>
          <Dialog.Title>🌾 Spirit Database Seed</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Import thousands of real spirits from public datasets!
            </Text>
            
            <Button
              mode="contained"
              onPress={handleAutoImport}
              style={styles.dialogButton}
              disabled={seedLoading}
              loading={seedLoading}
            >
              Auto Import (CT + Iowa)
            </Button>

            <Button
              mode="outlined"
              onPress={handleUploadCsv}
              style={styles.dialogButton}
              disabled={seedLoading}
            >
              Upload CSV (Kaggle/Gigasheet)
            </Button>

            <Button
              mode="contained"
              onPress={handleSeedTestDistilleries}
              style={styles.dialogButton}
              disabled={seedLoading}
              loading={seedLoading}
              buttonColor={Colors.accent}
            >
              🏭 Seed Test Distilleries
            </Button>

            <Button
              mode="text"
              onPress={handleGetStats}
              style={styles.dialogButton}
              disabled={seedLoading}
            >
              View Database Stats
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAdminDialog(false)} disabled={seedLoading}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    fontSize: 30,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    backgroundColor: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.divider,
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoItem: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textMuted,
    opacity: 0.5,
  },
  dialogText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: spacing.md,
  },
  dialogButton: {
    marginTop: spacing.sm,
  },
});
