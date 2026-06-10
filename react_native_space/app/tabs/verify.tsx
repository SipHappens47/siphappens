import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminVerificationContent } from '../../src/components/AdminVerificationContent';
import { Colors } from '../../src/constants/colors';

// Admin-only tab (hidden for everyone except the SipHappens admin account).
export default function VerifyTabScreen() {
  return (
    <View style={styles.container}>
      <AdminVerificationContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
