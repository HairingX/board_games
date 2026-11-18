import { useSyncExternalStore } from 'react';

/** The event Chromium browsers fire when the app can be installed with a button. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

let waiting: InstallPromptEvent | undefined;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * Listens for the browser offering to install the app, which it does once, early, so this runs
 * when the app starts. Safari never offers it; there the app is added from the Share menu.
 */
export function listenForInstall(target: Window = window): void {
  target.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    waiting = event as InstallPromptEvent;
    notify();
  });
  target.addEventListener('appinstalled', () => {
    waiting = undefined;
    notify();
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shows the browser's install dialog; undefined while the browser offers no such dialog. */
export function useInstall(): (() => Promise<void>) | undefined {
  const event = useSyncExternalStore(subscribe, () => waiting);
  return event
    ? async () => {
        await event.prompt();
        waiting = undefined;
        notify();
      }
    : undefined;
}
