import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';

export default function TabsLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

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
              <MaterialCommunityIcons
                name="account-circle"
                size={28}
                color={Colors.textSecondary}
              />
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
    </Tabs>
  );
}
