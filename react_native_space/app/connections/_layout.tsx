import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export default function ConnectionsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: '#D4AF37',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 30,
          color: Colors.text,
        },
        headerLeft: () => (
          <Pressable onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={Colors.text}
            />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Fellow Sippers',
        }}
      />
    </Stack>
  );
}
