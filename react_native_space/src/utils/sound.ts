import { Audio } from 'expo-av';

// Fire-and-forget sound playback; failures are swallowed so audio never blocks UI.
async function play(asset: number, label: string) {
  try {
    const { sound } = await Audio.Sound.createAsync(asset, { shouldPlay: true, volume: 1.0 });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.log(`[sound] ${label} failed:`, error);
  }
}

// Ice-in-glass sound on successful login.
export function playIceSound() {
  return play(require('../../assets/sounds/login-ice.mp3'), 'login ice');
}

// Pouring sound when a bottle is scanned.
export function playPourSound() {
  return play(require('../../assets/sounds/scan-pour.mp3'), 'scan pour');
}
