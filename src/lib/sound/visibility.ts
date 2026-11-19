import { useEffect } from 'react';
import { sound as defaultSound, type SoundEngine } from './engine';

/**
 * Pauses the app's sound whenever the app is out of sight, minimised or behind another, and
 * starts it again when it is back, so nothing plays on unheard and spends the battery.
 */
export function usePausedWhenHidden(sound: SoundEngine = defaultSound): void {
  useEffect(() => {
    function onVisibility(): void {
      if (document.visibilityState === 'hidden') sound.sleep();
      else sound.wake();
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [sound]);
}
