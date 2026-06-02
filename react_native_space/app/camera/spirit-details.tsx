import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { FlavorTag, SpiritRecognitionMatch } from '../../src/types';
import { FlavorChips } from '../../src/components/FlavorChips';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function SpiritDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [matches, setMatches] = useState<SpiritRecognitionMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<SpiritRecognitionMatch | null>(null);
  const [imageUri, setImageUri] = useState<string>('');
  
  const [name, setName] = useState('');
  const [distillery, setDistillery] = useState('');
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [abv, setAbv] = useState('');
  const [region, setRegion] = useState('');
  
  const [flavorTags, setFlavorTags] = useState<FlavorTag[]>([]);
  const [selectedFlavorTagIds, setSelectedFlavorTagIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFlavorTags();
    
    if (params?.matches) {
      try {
        const parsedMatches = JSON.parse(params.matches as string);
        setMatches(parsedMatches ?? []);
        if ((parsedMatches?.length ?? 0) > 0) {
          selectMatch(parsedMatches[0]);
        }
      } catch (error) {
        console.error('Failed to parse matches:', error);
      }
    }
    
    if (params?.imageUri) {
      setImageUri(params.imageUri as string);
    }
  }, []);

  const loadFlavorTags = async () => {
    try {
      const tags = await apiService.getFlavorTags();
      setFlavorTags(tags ?? []);
    } catch (error) {
      console.error('Failed to load flavor tags:', error);
    }
  };

  const selectMatch = (match: SpiritRecognitionMatch) => {
    setSelectedMatch(match);
    setName(match?.spiritName ?? '');
    setDistillery(match?.distilleryName ?? '');
    setCategory(match?.category ?? '');
    setStyle(match?.style ?? '');
    setAbv(match?.abv?.toString() ?? '');
    setRegion(match?.region ?? '');
  };

  const handleToggleFlavorTag = (tagId: string) => {
    setSelectedFlavorTagIds((prev) =>
      prev?.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...(prev ?? []), tagId]
    );
  };

  const handleSave = async () => {
    if (!name?.trim()) {
      Alert.alert('Error', 'Spirit name is required');
      return;
    }

    setSaving(true);
    try {
      // Upload the scanned photo as the bottle image
      let bottleImageValue = undefined;
      if (imageUri) {
        bottleImageValue = await uploadService.uploadImage(
          imageUri,
          `bottle-${Date.now()}.jpg`,
          true
        );
      }

      let distilleryId = undefined;
      if (distillery?.trim()) {
        const distilleries = await apiService.searchDistilleries(distillery.trim());
        if ((distilleries?.length ?? 0) > 0) {
          distilleryId = distilleries[0]?.id;
        } else {
          const newDistillery = await apiService.createDistillery({
            name: distillery.trim(),
          });
          distilleryId = newDistillery?.id;
        }
      }

      const spirit = await apiService.createSpirit({
        name: name.trim(),
        distilleryId,
        category: category?.trim() || undefined,
        style: style?.trim() || undefined,
        abv: abv ? parseFloat(abv) : undefined,
        region: region?.trim() || undefined,
        bottleImage: bottleImageValue,
        flavorTagIds: selectedFlavorTagIds,
      });

      router.replace({
        pathname: '/pour/create',
        params: { 
          spiritId: spirit?.id ?? '',
          imageUri: imageUri || '', // Pass the scan photo to the pour creation screen
        },
      });
    } catch (error: any) {
      console.error('Failed to save spirit:', error);
      console.error('Error details:', error?.response?.data);
      
      // Handle validation errors (message can be an array)
      let errorMessage = 'Failed to save spirit. Please try again.';
      if (error?.response?.data?.message) {
        const msg = error.response.data.message;
        errorMessage = Array.isArray(msg) ? msg.join(', ') : msg;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Spirit Details</Text>

        {(matches?.length ?? 0) > 1 && (
          <View style={styles.matchesSection}>
            <Text style={styles.sectionTitle}>AI Suggestions</Text>
            {matches.map((match, index) => (
              <Card
                key={index}
                style={[
                  styles.matchCard,
                  selectedMatch?.spiritName === match?.spiritName && styles.matchCardSelected,
                ]}
                onPress={() => selectMatch(match)}
              >
                <Card.Content>
                  <Text style={styles.matchName}>{match?.spiritName ?? ''}</Text>
                  <Text style={styles.matchDistillery}>{match?.distilleryName ?? ''}</Text>
                  <Text style={styles.matchConfidence}>
                    Confidence: {((match?.confidence ?? 0) * 100).toFixed(0)}%
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            label="Spirit Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Distillery"
            value={distillery}
            onChangeText={setDistillery}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Whiskey, Rum, Gin"
          />

          <TextInput
            label="Style"
            value={style}
            onChangeText={setStyle}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Bourbon, Single Malt"
          />

          <TextInput
            label="ABV (%)"
            value={abv}
            onChangeText={setAbv}
            mode="outlined"
            style={styles.input}
            keyboardType="decimal-pad"
          />

          <TextInput
            label="Region"
            value={region}
            onChangeText={setRegion}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Scotland, Kentucky"
          />

          {imageUri && (
            <View style={styles.imageContainer}>
              <Text style={styles.sectionTitle}>Scan Photo</Text>
              <Image source={{ uri: imageUri }} style={styles.image} />
            </View>
          )}

          <Text style={styles.sectionTitle}>Flavor Tags</Text>
          <FlavorChips
            tags={flavorTags}
            selectedIds={selectedFlavorTagIds}
            onToggle={handleToggleFlavorTag}
          />
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
            Continue to Pour Entry
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  matchesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: spacing.sm,
  },
  matchCard: {
    marginBottom: spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  matchCardSelected: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  matchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  matchDistillery: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  matchConfidence: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 4,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  imageContainer: {
    marginTop: spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
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
