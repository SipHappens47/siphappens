import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

// Two-step password reset: request a 6-digit code by email, then enter the
// code + a new password. Matches the backend /auth/forgot-password and
// /auth/reset-password endpoints.
export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleRequest = async () => {
    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await apiService.forgotPassword(email.trim());
      Alert.alert('Check your email', 'If that email has an account, we sent a 6-digit reset code.');
      setStep('reset');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (code.trim().length !== 6) {
      Alert.alert('Invalid code', 'The reset code is 6 digits.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await apiService.resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert('Password reset', 'Your password has been changed. Please log in.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message ?? 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { minHeight: '100%' }]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {step === 'request'
                  ? "Enter your email and we'll send you a reset code."
                  : 'Enter the code from your email and a new password.'}
              </Text>
            </View>

            <View style={styles.form}>
              {step === 'request' ? (
                <>
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Button
                    mode="contained"
                    onPress={handleRequest}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                  >
                    Send Reset Code
                  </Button>
                </>
              ) : (
                <>
                  <TextInput
                    label="6-digit code"
                    value={code}
                    onChangeText={setCode}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TextInput
                    label="New password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword((s) => !s)}
                      />
                    }
                  />
                  <Button
                    mode="contained"
                    onPress={handleReset}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                  >
                    Reset Password
                  </Button>
                  <Button mode="text" onPress={() => setStep('request')} style={styles.linkButton}>
                    Didn't get a code? Try again
                  </Button>
                </>
              )}

              <Button mode="text" onPress={() => router.replace('/auth/login')} style={styles.linkButton}>
                Back to Log In
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
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: 12,
  },
  linkButton: {
    marginTop: spacing.xs,
  },
});
