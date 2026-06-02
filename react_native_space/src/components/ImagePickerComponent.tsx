import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { spacing } from '../constants/theme';

interface ImagePickerComponentProps {
  imageUri?: string;
  onImageSelected: (uri: string) => void;
  onImageRemoved?: () => void;
  label?: string;
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  imageUri,
  onImageSelected,
  onImageRemoved,
  label = 'Add Photo',
}) => {
  const [loading, setLoading] = useState(false);

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select images.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result?.canceled && result?.assets?.[0]?.uri) {
        onImageSelected?.(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    onImageRemoved?.();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (imageUri) {
    return (
      <View style={styles.imageContainer}>
        <Pressable onPress={pickImage} style={{ flex: 1 }}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </Pressable>
        {onImageRemoved && (
          <IconButton
            icon="close-circle"
            size={24}
            iconColor={Colors.error}
            style={styles.removeButton}
            onPress={removeImage}
          />
        )}
        <Pressable style={styles.changeButton} onPress={pickImage}>
          <IconButton icon="camera" size={20} iconColor={Colors.white} />
          <Text style={styles.changeText}>Change Photo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable style={styles.picker} onPress={pickImage}>
      <IconButton icon="camera" size={32} iconColor={Colors.primary} />
      <Text style={styles.label}>{label ?? 'Add Photo'}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  picker: {
    borderWidth: 2,
    borderColor: Colors.divider,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: Colors.white,
  },
  changeButton: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  changeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: -spacing.sm,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
