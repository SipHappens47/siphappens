import React from 'react';
import { Stack } from 'expo-router';

export default function SpiritLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[spiritId]" />
      <Stack.Screen name="explore-result" />
    </Stack>
  );
}
