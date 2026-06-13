import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, Pressable, Image } from 'react-native';
import { Text, TextInput, Button, Checkbox, SegmentedButtons } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { uploadService } from '../../src/services/upload';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

type AccountType = 'sipper' | 'distillery' | null;

export default function SignupScreen() {
  // Account type selection
  const [accountType, setAccountType] = useState<AccountType>(null);
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  
  // Distillery-specific fields
  const [distilleryName, setDistilleryName] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroImageUri, setHeroImageUri] = useState<string | null>(null);
  const [spiritTypes, setSpiritTypes] = useState<string[]>([]);
  
  const { user, signup } = useAuth();
  const router = useRouter();
  const { height } = useWindowDimensions();
  
  const isSmallScreen = height < 700;

  const SPIRIT_TYPE_OPTIONS = [
    'Whisky', 'Gin', 'Rum', 'Vodka', 'Tequila', 'Mezcal',
    'Cognac', 'Brandy', 'Agave', 'Liqueur', 'Other'
  ];

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
    if (!name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleSpiritType = (type: string) => {
    setSpiritTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const pickImage = async (type: 'logo' | 'hero') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (type === 'logo') {
          setLogoUri(asset.uri);
        } else {
          setHeroImageUri(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImages = async () => {
    const uploadedFiles: { logo?: string; heroImage?: string } = {};

    try {
      // The distillery logo/heroImage columns hold direct URLs, so resolve the
      // uploaded file to its public URL instead of storing the file id.
      if (logoUri) {
        const fileId = await uploadService.uploadImage(logoUri, 'distillery-logo.jpg', true);
        uploadedFiles.logo = await uploadService.getImageUrl(fileId, 'view');
      }

      if (heroImageUri) {
        const fileId = await uploadService.uploadImage(heroImageUri, 'distillery-hero.jpg', true);
        uploadedFiles.heroImage = await uploadService.getImageUrl(fileId, 'view');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload images');
    }

    return uploadedFiles;
  };

  const handleSignup = async () => {
    console.log('[Signup] handleSignup called');
    
    if (!validate()) {
      console.log('[Signup] Validation failed');
      return;
    }
    
    if (!ageVerified) {
      console.log('[Signup] Age not verified');
      Alert.alert('Age Verification', 'Please confirm you are of legal drinking age.');
      return;
    }

    if (accountType === 'distillery' && !distilleryName?.trim()) {
      Alert.alert('Validation Error', 'Distillery name is required');
      return;
    }

    console.log('[Signup] Starting signup process...');
    setLoading(true);
    try {
      let uploadedImages = {};
      
      // Upload images if distillery account
      if (accountType === 'distillery' && (logoUri || heroImageUri)) {
        uploadedImages = await uploadImages();
      }

      const signupData: any = {
        email: email.trim(),
        password,
        name: name.trim(),
        ageVerified: true,
        ageVerificationTimestamp: new Date().toISOString(),
        isDistilleryAccount: accountType === 'distillery',
      };

      if (accountType === 'distillery') {
        signupData.distilleryData = {
          distilleryName: distilleryName.trim(),
          region: region.trim() || undefined,
          country: country.trim() || undefined,
          bio: bio.trim() || undefined,
          logo: (uploadedImages as any)?.logo || undefined,
          heroImage: (uploadedImages as any)?.heroImage || undefined,
          spiritTypes: spiritTypes.join(',') || undefined,
        };
      }

      console.log('[Signup] Attempting signup with data:', { ...signupData, password: '***' });
      const response = await signup(signupData.email, signupData.password, signupData.name, signupData);
      console.log('[Signup] Signup successful, response:', response);
      
      // Always redirect to tabs for both user and distillery accounts
      console.log('[Signup] Redirecting to tabs');
      router.replace('/tabs');
    } catch (error: any) {
      console.error('[Signup] Signup failed:', error?.response?.status, error?.response?.data, error?.message);
      Alert.alert(
        'Signup Failed',
        error?.response?.data?.message ?? error?.message ?? 'Unable to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Account type selection screen
  if (!accountType) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to SipHappens</Text>
            <Text style={styles.subtitle}>Choose your account type</Text>
          </View>

          <View style={styles.accountTypeContainer}>
            <Pressable
              style={styles.accountTypeCard}
              onPress={() => setAccountType('sipper')}
            >
              <MaterialCommunityIcons name="glass-mug-variant" size={48} color={Colors.accent} />
              <Text style={styles.accountTypeTitle}>Sign up as a Sipper</Text>
              <Text style={styles.accountTypeDescription}>
                Discover, track, and share your spirits journey
              </Text>
            </Pressable>

            <Pressable
              style={styles.accountTypeCard}
              onPress={() => setAccountType('distillery')}
            >
              <MaterialCommunityIcons name="factory" size={48} color={Colors.accent} />
              <Text style={styles.accountTypeTitle}>Sign up as a Distillery</Text>
              <Text style={styles.accountTypeDescription}>
                Showcase your spirits and connect with enthusiasts
              </Text>
            </Pressable>
          </View>

          <Button
            mode="text"
            onPress={() => router.push('/auth/login')}
            style={styles.linkButton}
            labelStyle={styles.linkButtonLabel}
          >
            Already have an account? Log In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { minHeight: '100%' }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.content}>
            <Pressable onPress={() => setAccountType(null)} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <View style={[styles.header, { marginBottom: isSmallScreen ? spacing.sm : spacing.md }]}>
              <Text style={[styles.title, { fontSize: isSmallScreen ? 22 : 28 }]}>
                {accountType === 'distillery' ? 'Distillery Account' : 'Create Account'}
              </Text>
              <Text style={[styles.subtitle, { fontSize: isSmallScreen ? 12 : 14 }]}>
                {accountType === 'distillery' ? 'Register your distillery' : 'Start your spirits journey'}
              </Text>
            </View>

            <View style={[styles.form, { gap: isSmallScreen ? 6 : spacing.sm }]}>
              {accountType === 'distillery' && (
                <>
                  <TextInput
                    label="Distillery Name *"
                    value={distilleryName}
                    onChangeText={setDistilleryName}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="words"
                    dense={isSmallScreen}
                  />

                  <TextInput
                    label="Region"
                    value={region}
                    onChangeText={setRegion}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="words"
                    dense={isSmallScreen}
                    placeholder="e.g., Western Cape, Kentucky"
                  />

                  <TextInput
                    label="Country"
                    value={country}
                    onChangeText={setCountry}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="words"
                    dense={isSmallScreen}
                    placeholder="e.g., South Africa, USA"
                  />

                  <TextInput
                    label="Short Bio"
                    value={bio}
                    onChangeText={setBio}
                    mode="outlined"
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                    dense={isSmallScreen}
                    placeholder="Tell us about your distillery..."
                  />

                  <Text style={styles.sectionTitle}>Spirit Types</Text>
                  <View style={styles.spiritTypesContainer}>
                    {SPIRIT_TYPE_OPTIONS.map((type) => (
                      <Pressable
                        key={type}
                        style={[
                          styles.spiritTypeChip,
                          spiritTypes.includes(type) && styles.spiritTypeChipSelected,
                        ]}
                        onPress={() => toggleSpiritType(type)}
                      >
                        <Text
                          style={[
                            styles.spiritTypeChipText,
                            spiritTypes.includes(type) && styles.spiritTypeChipTextSelected,
                          ]}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Images (Optional)</Text>
                  <View style={styles.imageUploadContainer}>
                    <Pressable style={styles.imageUploadBox} onPress={() => pickImage('logo')}>
                      {logoUri ? (
                        <Image source={{ uri: logoUri }} style={styles.uploadedImage} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="image-plus" size={32} color={Colors.textMuted} />
                          <Text style={styles.imageUploadText}>Logo</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable style={styles.imageUploadBox} onPress={() => pickImage('hero')}>
                      {heroImageUri ? (
                        <Image source={{ uri: heroImageUri }} style={styles.uploadedImage} />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="image-plus" size={32} color={Colors.textMuted} />
                          <Text style={styles.imageUploadText}>Hero Image</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </>
              )}

              <TextInput
                label="Contact Name *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                error={!!errors?.name}
                autoCapitalize="words"
                dense={isSmallScreen}
              />
              {errors?.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <TextInput
                label="Email *"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors?.email}
                dense={isSmallScreen}
              />
              {errors?.email && <Text style={styles.errorText}>{errors.email}</Text>}

              <TextInput
                label="Password *"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword((s) => !s)}
                  />
                }
                error={!!errors?.password}
                dense={isSmallScreen}
              />
              {errors?.password && <Text style={styles.errorText}>{errors.password}</Text>}

              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={ageVerified ? 'checked' : 'unchecked'}
                  onPress={() => setAgeVerified(!ageVerified)}
                  color={Colors.accent}
                />
                <Text style={[styles.checkboxLabel, { fontSize: isSmallScreen ? 12 : 13 }]}>
                  I confirm I am of legal drinking age.
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={handleSignup}
                loading={loading}
                disabled={loading || !ageVerified}
                style={styles.button}
                contentStyle={[styles.buttonContent, { paddingVertical: isSmallScreen ? 10 : spacing.md }]}
              >
                {accountType === 'distillery' ? 'Register Distillery' : 'Sign Up'}
              </Button>

              <Button
                mode="text"
                onPress={() => router.push('/auth/login')}
                style={styles.linkButton}
                labelStyle={[styles.linkButtonLabel, { fontSize: isSmallScreen ? 13 : 15 }]}
              >
                Already have an account? Log In
              </Button>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  accountTypeContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  accountTypeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.divider,
  },
  accountTypeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  accountTypeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  form: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  spiritTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  spiritTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  spiritTypeChipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  spiritTypeChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  spiritTypeChipTextSelected: {
    color: Colors.background,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageUploadBox: {
    flex: 1,
    height: 120,
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.divider,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: spacing.xs,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: -spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  checkboxLabel: {
    flex: 1,
    color: Colors.textSecondary,
    marginLeft: spacing.xs,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: 12,
  },
  buttonContent: {
  },
  linkButton: {
    marginTop: spacing.xs,
  },
  linkButtonLabel: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
// AUTH_SCREEN_VERSION_1772793707
