import React from 'react';
import { Stack } from 'expo-router';

export default function DistilleriesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[distilleryId]" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="spirit-form" />
    </Stack>
  );
}
