import { useEffect, useReducer } from 'react';

/**
 * Whether every game is on the phone, to play without the internet: everything the games use
 * is fetched when the app is first opened, before its service worker takes over, so once one
 * is active it all is. While a new version is fetched, the one before still works offline.
 */
export type OfflineStatus = 'ready' | 'fetching' | 'unknown';

export function offlineStatus(registration: ServiceWorkerRegistration | undefined): OfflineStatus {
  if (registration?.active) return 'ready';
  return registration?.installing ? 'fetching' : 'unknown';
}

/** The status, kept up to date as the app's service worker is fetched and takes over. */
export function useOfflineStatus(
  registration: ServiceWorkerRegistration | undefined,
): OfflineStatus {
  const [, changed] = useReducer((count: number) => count + 1, 0);

  useEffect(() => {
    if (!registration) return;
    let watched: ServiceWorker | null = null;
    function watch(): void {
      watched?.removeEventListener('statechange', changed);
      watched = registration?.installing ?? null;
      watched?.addEventListener('statechange', changed);
      changed();
    }
    watch();
    registration.addEventListener('updatefound', watch);
    return () => {
      registration.removeEventListener('updatefound', watch);
      watched?.removeEventListener('statechange', changed);
    };
  }, [registration]);

  return offlineStatus(registration);
}
