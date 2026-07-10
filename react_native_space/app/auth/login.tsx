import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { playIceSound } from '../../src/utils/sound';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { user, login } = useAuth();
  const router = useRouter();
  const { height } = useWindowDimensions();
  
  const isSmallScreen = height < 700;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('[Login] handleLogin called');
    console.log('[Login] Form values - email:', email, 'password length:', password?.length);
    
    if (!validate()) {
      console.log('[Login] Validation failed');
      return;
    }

    console.log('[Login] Starting login process...');
    setLoading(true);
    try {
      console.log('[Login] Attempting login with email:', email.trim());
      const response = await login(email.trim(), password);
      console.log('[Login] Login successful, response:', response);

      // Celebratory ice-in-glass chime as we head into the app
      playIceSound();

      // Always redirect to tabs for both user and distillery accounts
      console.log('[Login] Redirecting to tabs');
      router.replace('/tabs');
    } catch (error: any) {
      console.error('[Login] Login failed:', error?.response?.status, error?.response?.data, error?.message);
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message ?? error?.message ?? 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
            <View style={[styles.header, { marginBottom: isSmallScreen ? spacing.md : spacing.lg }]}>
              <Text style={[styles.title, { fontSize: isSmallScreen ? 24 : 32 }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { fontSize: isSmallScreen ? 13 : 16 }]}>Log in to continue your journey</Text>
            </View>

            <View style={[styles.form, { gap: isSmallScreen ? spacing.sm : spacing.md }]}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors?.email}
            />
            {errors?.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <TextInput
              label="Password"
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
            />
            {errors?.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={[styles.buttonContent, { paddingVertical: isSmallScreen ? 10 : spacing.md }]}
            >
              Log In
            </Button>

            <Button
              mode="text"
              onPress={() => router.push('/auth/forgot-password' as Href)}
              style={styles.linkButton}
              labelStyle={[styles.linkButtonLabel, { fontSize: isSmallScreen ? 13 : 15 }]}
            >
              Forgot password?
            </Button>

            <Button
              mode="text"
              onPress={() => router.push('/auth/signup')}
              style={styles.linkButton}
              labelStyle={[styles.linkButtonLabel, { fontSize: isSmallScreen ? 13 : 15 }]}
            >
              Don't have an account? Sign Up
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: -spacing.sm,
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
