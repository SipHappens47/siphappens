import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../src/services/api';
import { playIceSound } from '../../src/utils/sound';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

// Explore a Bottle: identical capture flow to the pour camera, but the result
// opens the read-only explore screen instead of pour creation.
export default function ExploreCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera access is required to scan bottles</Text>
          <Button mode="contained" onPress={requestPermission} style={styles.button}>
            Grant Permission
          </Button>
          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.linkButton}
          >
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Resize, recognize and route to the explore result — shared by camera
  // capture and gallery selection.
  const processImage = async (uri: string) => {
    try {
      setAnalyzing(true);

      const resizedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!resizedImage?.base64) {
        Alert.alert('Error', 'Failed to process image');
        return;
      }

      const result = await apiService.recognizeSpirit(resizedImage.base64);

      if ((result?.matches?.length ?? 0) > 0) {
        router.push({
          pathname: '/spirit/explore-result' as any,
          params: {
            matches: JSON.stringify(result.matches),
            imageUri: resizedImage.uri,
          },
        });
      } else {
        Alert.alert(
          'No Matches Found',
          "We couldn't identify this bottle. Try a clearer shot of the label.",
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Explore image processing error:', error);
      Alert.alert('Error', 'Failed to analyze bottle. Please try again.');
    } finally {
      setCapturing(false);
      setAnalyzing(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef?.current || capturing || analyzing) return;
    try {
      setCapturing(true);
      playIceSound();
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (!photo?.uri) {
        Alert.alert('Error', 'Failed to capture image');
        setCapturing(false);
        return;
      }
      await processImage(photo.uri);
    } catch (error) {
      console.error('Explore camera error:', error);
      Alert.alert('Error', 'Failed to analyze bottle. Please try again.');
      setCapturing(false);
      setAnalyzing(false);
    }
  };

  const pickFromGallery = async () => {
    if (capturing || analyzing) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to choose a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (!result?.canceled && result?.assets?.[0]?.uri) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Explore gallery pick error:', error);
      Alert.alert('Error', 'Failed to load photo. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <IconButton
              icon="close"
              size={28}
              iconColor={Colors.white}
              onPress={() => router.back()}
              style={styles.closeButton}
            />
            <Text style={styles.modeLabel}>Explore a Bottle</Text>
            <View style={{ width: 48 }} />
          </View>

          <View style={styles.bottomBar}>
            {analyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color={Colors.white} />
                <Text style={styles.analyzingText}>Identifying bottle...</Text>
              </View>
            ) : (
              <View style={styles.captureRow}>
                <Pressable style={styles.galleryButton} onPress={pickFromGallery}>
                  <MaterialCommunityIcons name="image-multiple" size={26} color={Colors.white} />
                  <Text style={styles.galleryLabel}>Gallery</Text>
                </Pressable>

                <Pressable
                  style={styles.captureButton}
                  onPress={takePicture}
                  disabled={capturing}
                >
                  <View style={styles.captureButtonInner} />
                </Pressable>

                <View style={styles.galleryButton} />
              </View>
            )}
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  galleryButton: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryLabel: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 2,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
  },
  analyzingContainer: {
    alignItems: 'center',
  },
  analyzingText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: spacing.md,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
    marginBottom: spacing.md,
  },
  linkButton: {
    marginTop: spacing.sm,
  },
});
