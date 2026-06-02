import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Pressable } from 'react-native';
import { Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';
import { Spirit, TasteSummary } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';

export default function SpiritDetailsScreen() {
  const router = useRouter();
  const { spiritId = '' } = useLocalSearchParams();
  
  const [spirit, setSpirit] = useState<Spirit | null>(null);
  const [tasteSummary, setTasteSummary] = useState<TasteSummary | null>(null);
  const [similarSpirits, setSimilarSpirits] = useState<Spirit[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToShelf, setAddingToShelf] = useState(false);

  useEffect(() => {
    loadSpiritDetails();
  }, [spiritId]);

  const loadSpiritDetails = async () => {
    try {
      setLoading(true);
      const [spiritData, tasteData] = await Promise.all([
        apiService.getSpiritDetails(spiritId as string),
        apiService.getTasteSummary(),
      ]);
      
      setSpirit(spiritData);
      setTasteSummary(tasteData);
      
      // Load similar spirits based on category
      if (spiritData?.category) {
        const similar = await apiService.searchSpirits(spiritData.category);
        setSimilarSpirits((similar ?? []).filter((s) => s?.id !== spiritId).slice(0, 6));
      }
    } catch (error: any) {
      console.error('Failed to load spirit details:', error);
      Alert.alert('Error', 'Failed to load spirit details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePourThisNow = () => {
    router.push(`/pour/create?spiritId=${spiritId}` as any);
  };

  const handleAddToShelf = async () => {
    try {
      setAddingToShelf(true);
      await apiService.addToShelf(spiritId as string);
      Alert.alert('Added!', `${spirit?.name ?? 'Spirit'} has been added to your shelf.`);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Failed to add to shelf';
      Alert.alert('Error', message);
    } finally {
      setAddingToShelf(false);
    }
  };

  const calculateTasteMatch = (): number => {
    if (!spirit || !tasteSummary) return 0;
    
    let matchScore = 0;
    let totalFactors = 0;

    // Check flavor tags match
    if (spirit?.flavorTags && spirit.flavorTags.length > 0 && tasteSummary?.flavorDistribution) {
      const userFlavors = new Set(tasteSummary.flavorDistribution.map((f) => f?.name?.toLowerCase?.() ?? ''));
      const spiritFlavors = spirit.flavorTags.map((f) => f?.name?.toLowerCase?.() ?? '');
      const matchingFlavors = spiritFlavors.filter((f) => userFlavors.has(f));
      if (spiritFlavors.length > 0) {
        matchScore += (matchingFlavors.length / spiritFlavors.length) * 50;
        totalFactors += 50;
      }
    }

    // Check region match
    if (spirit?.region && tasteSummary?.regions) {
      const normalizedRegion = (typeof spirit.region === 'string' ? spirit.region : '').split(',').pop()?.trim();
      const userRegions = new Set(
        tasteSummary.regions.map((r) => {
          const regionName = r?.name ?? '';
          return (typeof regionName === 'string' ? regionName : '').split(',').pop()?.trim()?.toLowerCase?.() ?? '';
        })
      );
      if (normalizedRegion && userRegions.has(normalizedRegion.toLowerCase())) {
        matchScore += 30;
      }
      totalFactors += 30;
    }

    // Base score for trying spirits in same category
    if (spirit?.category && tasteSummary?.flavorDistribution?.length > 0) {
      matchScore += 20;
      totalFactors += 20;
    }

    return totalFactors > 0 ? Math.round(matchScore) : 0;
  };

  const getWhyPeopleLoveIt = (): string[] => {
    if (!spirit) return [];
    
    const notes: string[] = [];
    
    // Generate tasting notes based on flavor tags and category
    const flavorNames = (spirit?.flavorTags ?? []).map((f) => f?.name ?? '').filter(Boolean);
    
    if (flavorNames.length > 0) {
      const primaryFlavors = flavorNames.slice(0, 3).join(', ');
      notes.push(`Rich notes of ${primaryFlavors.toLowerCase()}`);
    }
    
    if (spirit?.abv && spirit.abv > 45) {
      notes.push(`Bold ${spirit.abv}% ABV delivers powerful complexity`);
    } else if (spirit?.abv && spirit.abv < 40) {
      notes.push(`Smooth ${spirit.abv}% ABV makes it approachable and versatile`);
    }
    
    if (spirit?.region) {
      const region = spirit.region.split(',').pop()?.trim();
      notes.push(`Authentic ${region} craftsmanship`);
    }
    
    if (notes.length === 0) {
      notes.push('A unique expression worth exploring');
      notes.push('Distinctive character and quality');
    }
    
    return notes.slice(0, 3);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!spirit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Spirit not found</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = spirit?.bottleImage ?? 'https://i.pinimg.com/736x/10/a7/b0/10a7b0da924fe1e621a7df52e1f3b023.jpg';
  const tasteMatch = calculateTasteMatch();
  const whyPeopleLoveIt = getWhyPeopleLoveIt();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Spirit Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Bottle Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.bottleImage}
            resizeMode="contain"
          />
        </View>

        {/* Spirit Name */}
        <Text style={styles.spiritName}>{spirit?.name ?? 'Unknown Spirit'}</Text>

        {/* Core Details Card */}
        <View style={styles.card}>
          {spirit?.distilleryName && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="factory" size={20} color={Colors.accent} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Distillery</Text>
                <Text style={styles.detailValue}>{spirit.distilleryName}</Text>
              </View>
            </View>
          )}

          {spirit?.category && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="view-grid" size={20} color={Colors.accent} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>
                  {[spirit.category, spirit.style].filter(Boolean).join(' • ')}
                </Text>
              </View>
            </View>
          )}

          {spirit?.abv && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="percent" size={20} color={Colors.accent} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>ABV</Text>
                <Text style={styles.detailValue}>{spirit.abv}%</Text>
              </View>
            </View>
          )}

          {spirit?.region && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={Colors.accent} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Region</Text>
                <Text style={styles.detailValue}>{spirit.region}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Flavor Tags */}
        {spirit?.flavorTags && spirit.flavorTags.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Flavor Profile</Text>
            <View style={styles.tagsContainer}>
              {spirit.flavorTags.map((tag) => (
                <Chip
                  key={tag?.id ?? tag?.name}
                  mode="outlined"
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {tag?.name ?? ''}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Why People Love It */}
        {whyPeopleLoveIt.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Why People Love It</Text>
            {whyPeopleLoveIt.map((note, index) => (
              <View key={index} style={styles.noteRow}>
                <MaterialCommunityIcons name="star" size={16} color={Colors.accent} />
                <Text style={styles.noteText}>{note}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Your Taste Match */}
        {tasteSummary && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Taste Match</Text>
            <View style={styles.matchContainer}>
              <View style={styles.matchBarBackground}>
                <LinearGradient
                  colors={['#D4AF37', '#F4D03F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.matchBarFill, { width: `${tasteMatch}%` }]}
                />
              </View>
              <Text style={styles.matchPercentage}>{tasteMatch}% Match</Text>
            </View>
            <Text style={styles.matchDescription}>
              {tasteMatch >= 70
                ? 'Highly recommended based on your taste profile!'
                : tasteMatch >= 40
                ? 'Worth exploring — aligns with some of your preferences.'
                : 'A new flavor adventure awaits!'}
            </Text>
          </View>
        )}

        {/* Similar Spirits */}
        {similarSpirits.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>See Similar Spirits</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
              {similarSpirits.map((similar) => (
                <Pressable
                  key={similar?.id}
                  style={styles.similarCard}
                  onPress={() => router.push(`/spirit/${similar?.id}` as any)}
                >
                  <Image
                    source={{
                      uri: similar?.bottleImage ?? 'https://i.pinimg.com/736x/10/a7/b0/10a7b0da924fe1e621a7df52e1f3b023.jpg',
                    }}
                    style={styles.similarImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.similarName} numberOfLines={2}>
                    {similar?.name ?? ''}
                  </Text>
                  <Text style={styles.similarCategory} numberOfLines={1}>
                    {similar?.category ?? ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Floating Buttons */}
      <View style={styles.bottomButtons}>
        <Button
          mode="contained"
          onPress={handlePourThisNow}
          style={styles.pourButton}
          labelStyle={styles.pourButtonLabel}
          icon="glass-cocktail"
        >
          Pour This Now
        </Button>
        <Button
          mode="outlined"
          onPress={handleAddToShelf}
          style={styles.shelfButton}
          labelStyle={styles.shelfButtonLabel}
          loading={addingToShelf}
          disabled={addingToShelf}
          icon="bookshelf"
        >
          Add to My Shelf
        </Button>
      </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  bottleImage: {
    width: 200,
    height: 300,
    borderRadius: 12,
  },
  spiritName: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: Colors.elevated,
    borderColor: Colors.accent,
  },
  chipText: {
    color: Colors.text,
    fontSize: 13,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  noteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  matchContainer: {
    marginBottom: spacing.sm,
  },
  matchBarBackground: {
    height: 8,
    backgroundColor: Colors.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  matchBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  matchPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
  },
  matchDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  similarScroll: {
    marginTop: spacing.sm,
  },
  similarCard: {
    width: 120,
    marginRight: spacing.md,
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    padding: spacing.sm,
  },
  similarImage: {
    width: '100%',
    height: 140,
    marginBottom: spacing.sm,
  },
  similarName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  similarCategory: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: spacing.sm,
  },
  pourButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 6,
  },
  pourButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1628',
  },
  shelfButton: {
    borderColor: Colors.divider,
    borderRadius: 12,
    paddingVertical: 6,
  },
  shelfButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
