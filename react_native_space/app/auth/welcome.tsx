import React from 'react';
import { View, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { spacing } from '../../src/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  
  // Responsive sizing based on screen height
  const isSmallScreen = height < 700;
  const isMediumScreen = height >= 700 && height < 850;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.mainContainer}>
        {/* TOP SECTION - Logo & Title */}
        <View style={styles.topSection}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={{ 
              width: 119, 
              height: 119,
              marginBottom: spacing.xl
            }} 
            resizeMode="contain"
          />
          <Text style={styles.title}>SipHappens</Text>
        </View>

        {/* MIDDLE SECTION - Text Content */}
        <View style={styles.middleSection}>
          <Text style={styles.headline}>
            Discover the World of Spirits.
          </Text>
          
          <Text style={styles.subtext}>
            Track what you drink.{'\n'}
            Discover what you'll love.{'\n'}
            Build your own spirits universe.
          </Text>
          
          <Text style={styles.tagline}>
            Build your personal tasting journey.
          </Text>
        </View>

        {/* BOTTOM SECTION - Buttons */}
        <View style={styles.bottomSection}>
          <Button
            mode="contained"
            onPress={() => router.push('/auth/signup')}
            style={styles.button}
            contentStyle={{ paddingVertical: 12 }}
            labelStyle={{ fontSize: 16, fontWeight: '600' }}
          >
            Get Started
          </Button>
          
          <Button
            mode="text"
            onPress={() => router.push('/auth/login')}
            style={styles.linkButton}
            labelStyle={{ fontSize: 14, color: Colors.textSecondary, fontWeight: '500' }}
          >
            Already have an account? Log In
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: spacing.md + 19,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  middleSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  bottomSection: {
    width: '100%',
    paddingBottom: spacing.md,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  buttonContent: {
  },
  buttonLabel: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  linkButton: {
    marginTop: spacing.xs,
  },
  linkButtonLabel: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
// WELCOME_SCREEN_VERSION_1772794528
// COMPACT_LAYOUT_1772794998
// CENTERED_LAYOUT_1772795195
// TIGHTER_SPACING_PREMIUM_ICON_1772795468
// COMPACT_TO_FIT_1772795994
// EXPANDED_SPACING_1772796153
// COMPRESSED_TO_FIT_NO_SCROLL_1772796294
// THREE_SECTION_LAYOUT_1772796825
// NEW_CLEANER_LOGO_MORE_SPACING_1772797524
// PREMIUM_LOGO_V3_MOVED_DOWN_5MM_1772798197
// LOGO_5MM_BIGGER_1772798997
