import { useEffect } from 'react';

/** How often an open app asks whether a new version has been published. */
export const updateCheckInterval = 60 * 60 * 1000;

/** The part of a service worker registration this module uses: asking for a new version. */
export interface Updatable {
  update: () => Promise<unknown>;
}

/**
 * Asks for a new version each time the app comes back on screen, and every hour while it is
 * open. Browsers look for a new version only when a page loads, and a phone keeps an app
 * running in the background, so without this an update is found only once the app has been
 * closed completely. A new version found waits for the player to choose "Opdatér".
 */
export function useUpdateChecks(registration: Updatable | undefined): void {
  useEffect(() => {
    if (!registration) return;

    function check(): void {
      // Offline, or the server cannot be reached: the next check tries again.
      registration?.update().catch(() => undefined);
    }

    function onVisibilityChange(): void {
      if (document.visibilityState === 'visible') check();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = setInterval(check, updateCheckInterval);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(timer);
    };
  }, [registration]);
}

/**
 * Loads the new version that is waiting. Normally the waiting service worker is told to take
 * over, which reloads the page. On a first visit the page is not yet run by a service worker,
 * so the new one is active already and loading the page again is all it takes.
 */
export function loadNewVersion(
  workers: Pick<ServiceWorkerContainer, 'controller'>,
  takeOver: () => Promise<void>,
  reload: () => void,
): void {
  if (workers.controller) void takeOver();
  else reload();
}
