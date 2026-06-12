import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import { apiService } from '../../src/services/api';
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

  const takePicture = async () => {
    if (!cameraRef?.current || capturing || analyzing) return;

    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      setAnalyzing(true);

      const resizedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
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
      console.error('Explore camera error:', error);
      Alert.alert('Error', 'Failed to analyze bottle. Please try again.');
    } finally {
      setCapturing(false);
      setAnalyzing(false);
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
              <Pressable
                style={styles.captureButton}
                onPress={takePicture}
                disabled={capturing}
              >
                <View style={styles.captureButtonInner} />
              </Pressable>
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
