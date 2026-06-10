import React, { useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Platform, View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { uploadService } from '../../src/services/upload';
import { ADMIN_EMAIL } from '../../src/constants/admin';

export default function TabsLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Resolve the current user's profile photo (stored as a file id) to a URL for the header avatar.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      if (user?.profilePhoto) {
        try {
          const url = await uploadService.getImageUrl(user.profilePhoto, 'view');
          if (active) setAvatarUrl(url || null);
        } catch {
          if (active) setAvatarUrl(null);
        }
      } else if (active) {
        setAvatarUrl(null);
      }
    })();
    return () => { active = false; };
  }, [user?.profilePhoto]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent, // Muted Warm Gold for active tab
        tabBarInactiveTintColor: Colors.textMuted, // Muted text for inactive tabs
        tabBarStyle: {
          backgroundColor: Colors.surface, // Card surface for tab bar
          borderTopColor: Colors.divider, // Subtle divider
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.surface, // Card surface for header
          borderBottomWidth: 1,
          borderBottomColor: Colors.divider,
        },
        headerTintColor: '#D4AF37', // Gold accent
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 30,
          color: Colors.text,
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
            <Pressable
              onPress={() => router.push('/connections')}
              style={{ marginRight: 12 }}
            >
              <MaterialCommunityIcons
                name="account-multiple"
                size={28}
                color={Colors.textSecondary}
              />
            </Pressable>
            <Pressable onPress={() => router.push('/profile')}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.elevated }}
                />
              ) : (
                <MaterialCommunityIcons
                  name="account-circle"
                  size={28}
                  color={Colors.textSecondary}
                />
              )}
            </Pressable>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'The Bar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="glass-cocktail" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="barcode-scan" size={36} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shelf"
        options={{
          title: 'My Shelf',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          title: 'Verify',
          // Hidden for everyone except the SipHappens admin account
          href: isAdmin ? '/tabs/verify' : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-decagram" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
