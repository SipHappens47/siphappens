import { Audio } from 'expo-av';

// Plays the ice-in-glass chime once (e.g. on the post-login loading screen).
// Fire-and-forget: any failure is swallowed so it never blocks navigation.
export async function playIceSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/ice-glass.wav'),
      { shouldPlay: true, volume: 1.0 },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.log('[sound] ice clink failed:', error);
  }
}
