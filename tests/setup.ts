import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, vi } from 'vitest';

MotionGlobalConfig.skipAnimations = true;

// jsdom has no matchMedia; the app runs in a browser tab unless a test says otherwise.
window.matchMedia = (query: string) =>
  Object.assign(new EventTarget(), {
    matches: false,
    media: query,
    onchange: null,
  }) as MediaQueryList;

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
});

// The service worker is registered only in a built app; in tests no update is ever waiting.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(() => Promise.resolve()),
  })),
}));
