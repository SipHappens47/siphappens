import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Pressable } from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { Spirit, SpiritRecognitionMatch } from '../../src/types';
import { FlavorChips } from '../../src/components/FlavorChips';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { pluralise } from '../../src/utils/strings';

// Small avatar that resolves a profile photo file id (or URL) to an image.
function SipperAvatar({ photoId }: { photoId?: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!photoId) return;
      try {
        const resolved = photoId.startsWith('http')
          ? photoId
          : await uploadService.getImageUrl(photoId, 'view');
        if (active) setUrl(resolved || null);
      } catch {
        /* placeholder shows */
      }
    })();
    return () => { active = false; };
  }, [photoId]);

  if (url) return <Image source={{ uri: url }} style={styles.sipperAvatar} />;
  return (
    <View style={[styles.sipperAvatar, styles.sipperAvatarPlaceholder]}>
      <MaterialCommunityIcons name="account" size={16} color={Colors.textMuted} />
    </View>
  );
}

export default function ExploreResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [match, setMatch] = useState<SpiritRecognitionMatch | null>(null);
  const [imageUri, setImageUri] = useState<string>('');
  const [catalogSpirit, setCatalogSpirit] = useState<Spirit | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToRadar, setAddingToRadar] = useState(false);

  useEffect(() => {
    resolveSpirit();
  }, []);

  const resolveSpirit = async () => {
    try {
      setLoading(true);

      let firstMatch: SpiritRecognitionMatch | null = null;
      if (params?.matches) {
        try {
          const parsed = JSON.parse(params.matches as string);
          firstMatch = parsed?.[0] ?? null;
        } catch (error) {
          console.error('Failed to parse matches:', error);
        }
      }
      setMatch(firstMatch);
      if (params?.imageUri) setImageUri(params.imageUri as string);
      if (!firstMatch?.spiritName) return;

      // Try to find this spirit in our catalog by name (+ distillery when possible)
      const results = await apiService.searchSpirits(firstMatch.spiritName);
      const nameLower = firstMatch.spiritName.trim().toLowerCase();
      const distLower = firstMatch.distilleryName?.trim().toLowerCase() ?? '';
      const best =
        (results ?? []).find(
          (s) =>
            s?.name?.trim().toLowerCase() === nameLower &&
            (!distLower || (s?.distilleryName ?? '').toLowerCase() === distLower),
        ) ?? (results ?? []).find((s) => s?.name?.trim().toLowerCase() === nameLower);

      if (best?.id) {
        // Fetch the full record including community stats
        const full = await apiService.getSpirit(best.id);
        setCatalogSpirit(full ?? null);
      }
    } catch (error) {
      console.error('Failed to resolve spirit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToRadar = async () => {
    if (!catalogSpirit?.id) return;
    try {
      setAddingToRadar(true);
      await apiService.addToRadar(catalogSpirit.id);
      Alert.alert('On your radar! 🎯', `${catalogSpirit.name} has been saved to your radar.`);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Failed to add to radar');
    } finally {
      setAddingToRadar(false);
    }
  };

  const handleLogPour = () => {
    router.push({
      pathname: '/camera/spirit-details',
      params: {
        matches: params?.matches ?? '',
        imageUri: imageUri || '',
      },
    });
  };

  // Display values: catalog record wins, Gemini result is the fallback
  const name = catalogSpirit?.name ?? match?.spiritName ?? 'Unknown Spirit';
  const distilleryName = catalogSpirit?.distilleryName ?? match?.distilleryName ?? '';
  const category = catalogSpirit?.category ?? match?.category ?? '';
  const style = catalogSpirit?.style ?? match?.style ?? '';
  const abv = catalogSpirit?.abv ?? match?.abv ?? null;
  const flavorTags = catalogSpirit?.flavorTags ?? [];
  const fellowSippers = catalogSpirit?.fellowSipperPours ?? [];
  const inCatalog = !!catalogSpirit;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Looking it up...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Pressable onPress={() => router.replace('/camera/explore' as any)}>
          <Text style={styles.scanAgainText}>Not the right bottle? Scan again</Text>
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Unverified banner */}
        {!inCatalog && (
          <View style={styles.unverifiedBanner}>
            <MaterialCommunityIcons name="star-shooting" size={18} color={Colors.accent} />
            <Text style={styles.unverifiedText}>
              This spirit isn't in our catalog yet. Be the first to pour it.
            </Text>
          </View>
        )}

        {/* Header: image left, details right */}
        <View style={styles.header}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.bottleImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bottleImage, styles.bottlePlaceholder]}>
              <MaterialCommunityIcons name="bottle-wine" size={48} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.spiritName}>{name}</Text>
            {!!distilleryName && <Text style={styles.distilleryName}>{distilleryName}</Text>}
            <View style={styles.metaWrap}>
              {!!category && <Text style={styles.metaText}>{category}</Text>}
              {!!style && <Text style={styles.metaText}>{style}</Text>}
              {abv != null && <Text style={styles.metaText}>{abv}% ABV</Text>}
            </View>
            {!inCatalog && <Text style={styles.unverifiedTag}>Unverified — AI identified</Text>}
          </View>
        </View>

        {/* Flavour Profile */}
        <Text style={styles.sectionTitle}>Flavour Profile</Text>
        {flavorTags.length > 0 && (
          <FlavorChips
            tags={flavorTags}
            selectedIds={flavorTags.map((t) => t.id)}
            onToggle={() => {}}
          />
        )}
        {catalogSpirit?.officialTastingNotes ? (
          <Text style={styles.tastingNotes}>{catalogSpirit.officialTastingNotes}</Text>
        ) : (
          <Text style={styles.noNotes}>No official tasting notes yet</Text>
        )}

        {/* Community */}
        {inCatalog && (
          <>
            <Text style={styles.sectionTitle}>What Sippers Say</Text>
            <View style={styles.communityCard}>
              <View style={styles.communityRow}>
                <MaterialCommunityIcons name="glass-mug-variant" size={20} color={Colors.accent} />
                <Text style={styles.communityText}>
                  Poured {pluralise(catalogSpirit?.totalPourCount ?? 0, 'time')} on SipHappens
                </Text>
              </View>
              {catalogSpirit?.averageRating != null && (
                <View style={styles.communityRow}>
                  <Ionicons name="star" size={18} color={Colors.accent} />
                  <Text style={styles.communityText}>
                    {catalogSpirit.averageRating} average rating
                  </Text>
                </View>
              )}
              {fellowSippers.length > 0 && (
                <View style={styles.communityRow}>
                  <View style={styles.avatarRow}>
                    {fellowSippers.slice(0, 5).map((s) => (
                      <SipperAvatar key={s.userId} photoId={s.profilePhoto} />
                    ))}
                  </View>
                  <Text style={styles.communityText}>Your Fellow Sippers have tried this</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky actions */}
      <View style={styles.actions}>
        {inCatalog && (
          <Pressable
            style={[styles.primaryButton, addingToRadar && styles.buttonDisabled]}
            onPress={handleAddToRadar}
            disabled={addingToRadar}
          >
            <MaterialCommunityIcons name="radar" size={20} color={Colors.background} />
            <Text style={styles.primaryButtonText}>
              {addingToRadar ? 'Adding...' : 'Add to Radar'}
            </Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={handleLogPour}>
          <Ionicons name="wine" size={20} color={Colors.accent} />
          <Text style={styles.secondaryButtonText}>Log a Pour</Text>
        </Pressable>
        {inCatalog && catalogSpirit?.distilleryId && (
          <Pressable
            onPress={() => router.push(`/distilleries/${catalogSpirit.distilleryId}` as any)}
            style={styles.tertiaryLink}
          >
            <Text style={styles.tertiaryLinkText}>View full distillery page</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  scanAgainText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  unverifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  unverifiedText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bottleImage: {
    width: 140,
    height: 190,
    borderRadius: 12,
  },
  bottlePlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  spiritName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: spacing.xs,
  },
  distilleryName: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metaWrap: {
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  unverifiedTag: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  tastingNotes: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  noNotes: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  communityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: spacing.md,
    gap: spacing.md,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  communityText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  avatarRow: {
    flexDirection: 'row',
  },
  sipperAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -8,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  sipperAvatarPlaceholder: {
    backgroundColor: Colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
  },
  tertiaryLink: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tertiaryLinkText: {
    fontSize: 14,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
