import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { useAuth } from '../../src/context/AuthContext';
import { Pour } from '../../src/types';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function PourDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [pour, setPour] = useState<Pour | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [bottleImageUrl, setBottleImageUrl] = useState<string | undefined>();

  useEffect(() => {
    loadPour();
  }, []);

  const loadPour = async () => {
    try {
      setLoading(true);
      const pourId = params?.id as string;
      
      if (!pourId) {
        Alert.alert('Error', 'Pour not found');
        router.back();
        return;
      }

      const data = await apiService.getPour(pourId);
      setPour(data);

      // Load pour image if exists
      if (data?.image) {
        const url = await uploadService.getImageUrl(data.image, 'view');
        setImageUrl(url);
      }

      // Load bottle image if exists
      if (data?.spirit?.bottleImage) {
        if (data.spirit.bottleImage.startsWith('http')) {
          setBottleImageUrl(data.spirit.bottleImage);
        } else {
          const response = await apiService.getFileUrl(data.spirit.bottleImage, 'view');
          setBottleImageUrl(response?.url ?? undefined);
        }
      }
    } catch (error) {
      console.error('Failed to load pour:', error);
      Alert.alert('Error', 'Failed to load pour details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pour',
      'Are you sure you want to delete this pour? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deletePour(pour?.id ?? '');
              Alert.alert('Success', 'Pour deleted successfully', [
                { text: 'OK', onPress: () => router.replace('/tabs/shelf') },
              ]);
            } catch (error) {
              console.error('Failed to delete pour:', error);
              Alert.alert('Error', 'Failed to delete pour');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date?.toLocaleDateString?.('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) ?? '';
    } catch {
      return '';
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

  if (!pour) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Pour not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
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
        <View style={styles.headerActions}>
          {pour?.userId && user?.id === pour.userId && (
            <>
              <IconButton
                icon="pencil"
                size={24}
                onPress={() => router.push(`/pour/edit/${pour?.id ?? ''}`)}
              />
              <IconButton
                icon="delete"
                size={24}
                iconColor={Colors.error}
                onPress={handleDelete}
              />
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.spiritInfo}>
          {bottleImageUrl && (
            <Image
              source={{ uri: bottleImageUrl }}
              style={styles.bottleImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.spiritDetails}>
            <Text style={styles.spiritName}>{pour?.spirit?.name ?? ''}</Text>
            {pour?.spirit?.distilleryName && (
              <Text style={styles.distillery}>{pour.spirit.distilleryName}</Text>
            )}
          </View>
        </View>

        {/* Spirit Specifications */}
        <View style={styles.specsSection}>
          <Text style={styles.sectionTitle}>Spirit Details</Text>
          {pour?.spirit?.category && (
            <Text style={styles.specLine}>
              <Text style={styles.specLabel}>Category: </Text>
              <Text style={styles.specValue}>{pour.spirit.category}</Text>
            </Text>
          )}
          {pour?.spirit?.style && (
            <Text style={styles.specLine}>
              <Text style={styles.specLabel}>Style: </Text>
              <Text style={styles.specValue}>{pour.spirit.style}</Text>
            </Text>
          )}
          {pour?.spirit?.abv && (
            <Text style={styles.specLine}>
              <Text style={styles.specLabel}>ABV: </Text>
              <Text style={styles.specValue}>{pour.spirit.abv}%</Text>
            </Text>
          )}
          {pour?.spirit?.distilleryName && (
            <Text style={styles.specLine}>
              <Text style={styles.specLabel}>Distillery: </Text>
              <Text style={styles.specValue}>{pour.spirit.distilleryName}</Text>
            </Text>
          )}
          {pour?.spirit?.region && (
            <Text style={styles.specLine}>
              <Text style={styles.specLabel}>Region: </Text>
              <Text style={styles.specValue}>{pour.spirit.region}</Text>
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why It Hit</Text>
          <Text style={styles.whyItHit}>{pour?.whyItHit ?? ''}</Text>
        </View>

        {(pour?.flavorTags?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flavor Tags</Text>
            <View style={styles.tagsContainer}>
              {(pour?.flavorTags ?? []).map((tag) => (
                <View key={tag?.id ?? ''} style={styles.tag}>
                  <Text style={styles.tagText}>{tag?.name ?? ''}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {imageUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo</Text>
            <Image source={{ uri: imageUrl }} style={styles.pourImage} />
          </View>
        )}

        <Text style={styles.date}>{formatDate(pour?.createdAt ?? '')}</Text>
      </ScrollView>
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerActions: {
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
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
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: spacing.md,
    resizeMode: 'cover',
  },
  spiritDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  spiritName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  distillery: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specsSection: {
    backgroundColor: Colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: spacing.lg,
  },
  specLine: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  specLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  specValue: {
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    backgroundColor: Colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  whyItHit: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: Colors.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pourImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  date: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
