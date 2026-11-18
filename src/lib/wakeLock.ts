import { useEffect } from 'react';

/**
 * Keeps the screen on while `active`, so that it does not go dark while a card lies on the
 * table. The browser lets go of the lock whenever the app is hidden, so it is asked for again
 * each time the app is shown. Where the browser has no wake lock, or refuses it, as on low
 * battery, the screen simply follows the phone's setting.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let stopped = false;

    async function request(): Promise<void> {
      try {
        const granted = await navigator.wakeLock.request('screen');
        if (stopped) await granted.release();
        else lock = granted;
      } catch {
        lock = undefined;
      }
    }

    function onVisibilityChange(): void {
      if (document.visibilityState === 'visible') void request();
    }

    void request();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void lock?.release();
    };
  }, [active]);
}
