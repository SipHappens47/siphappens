import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { uploadService } from '../../src/services/upload';
import { ImagePickerComponent } from '../../src/components/ImagePickerComponent';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function ShelfSpiritFormScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const distilleryId = user?.distilleryId;
  const spiritId = (Array.isArray(params?.spiritId) ? params.spiritId[0] : params?.spiritId) as string | undefined;
  const isEdit = !!spiritId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('');
  const [abv, setAbv] = useState('');
  const [region, setRegion] = useState('');
  const [tastingNotes, setTastingNotes] = useState('');
  const [bottleUri, setBottleUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadSpirit();
    }
  }, []);

  const loadSpirit = async () => {
    try {
      setLoading(true);
      const spirit = await apiService.getSpirit(spiritId!);
      setName(spirit?.name ?? '');
      setCategory(spirit?.category ?? '');
      setStyle(spirit?.style ?? '');
      setAbv(spirit?.abv != null ? String(spirit.abv) : '');
      setRegion(spirit?.region ?? '');
      setTastingNotes((spirit as any)?.officialTastingNotes ?? '');
      setBottleUri((spirit as any)?.bottleImage ?? undefined);
    } catch (error) {
      console.error('Failed to load spirit:', error);
      Alert.alert('Error', 'Failed to load spirit');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!distilleryId) {
      Alert.alert('Error', 'No distillery linked to this account');
      return;
    }
    if (!name?.trim()) {
      Alert.alert('Error', 'Spirit name is required');
      return;
    }
    if (!bottleUri) {
      Alert.alert('Error', 'A bottle photo is required for shelf spirits');
      return;
    }

    setSaving(true);
    try {
      let bottleUrl = bottleUri;
      if (!bottleUri.startsWith('http')) {
        const fileId = await uploadService.uploadImage(bottleUri, `shelf-bottle-${Date.now()}.jpg`, true);
        bottleUrl = await uploadService.getImageUrl(fileId, 'view');
      }

      const payload = {
        name: name.trim(),
        category: category?.trim() || undefined,
        style: style?.trim() || undefined,
        abv: abv ? parseFloat(abv) : undefined,
        region: region?.trim() || undefined,
        bottleImage: bottleUrl,
        officialTastingNotes: tastingNotes?.trim() || undefined,
      };

      if (isEdit) {
        await apiService.updateShelfSpirit(distilleryId, spiritId!, payload);
      } else {
        await apiService.addShelfSpirit(distilleryId, payload);
      }

      Alert.alert('Success', isEdit ? 'Spirit updated!' : 'Spirit added to your shelf!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Failed to save shelf spirit:', error);
      const msg = error?.response?.data?.message;
      Alert.alert('Error', (Array.isArray(msg) ? msg.join(', ') : msg) ?? 'Failed to save spirit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!distilleryId || !spiritId) return;
    Alert.alert(
      'Remove Spirit',
      'Remove this spirit from your shelf? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await apiService.deleteShelfSpirit(distilleryId, spiritId);
              Alert.alert('Removed', 'Spirit removed from your shelf', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Failed to delete shelf spirit:', error);
              Alert.alert('Error', error?.response?.data?.message ?? 'Failed to remove spirit');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
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
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Spirit' : 'Add Spirit'}</Text>
        {isEdit ? (
          <IconButton icon="delete" size={24} iconColor={Colors.error} onPress={handleDelete} />
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.photoSection}>
            <Text style={styles.sectionLabel}>Bottle Photo *</Text>
            <ImagePickerComponent
              imageUri={bottleUri}
              onImageSelected={setBottleUri}
              onImageRemoved={() => setBottleUri(undefined)}
              label="Add Bottle Photo"
            />
          </View>

          <View style={styles.form}>
            <TextInput
              label="Spirit Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Category"
              value={category}
              onChangeText={setCategory}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Whiskey, Gin, Rum"
            />

            <TextInput
              label="Style"
              value={style}
              onChangeText={setStyle}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Single Malt, London Dry"
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
              placeholder="e.g., South Africa"
            />

            <TextInput
              label="Official Tasting Notes"
              value={tastingNotes}
              onChangeText={setTastingNotes}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={4}
              placeholder="Describe the nose, palate, and finish..."
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {isEdit ? 'Save Changes' : 'Add to Shelf'}
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
