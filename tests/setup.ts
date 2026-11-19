import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, vi } from 'vitest';
import { familySaveKey } from '../src/family/FamilyContext';
import { rememberedSaveKey } from '../src/family/remembered';
import { localeSaveKey } from '../src/i18n/I18n';
import { betaSaveKey } from '../src/lib/beta';
import { soundSaveKey } from '../src/lib/sound/settings';
import { saves } from '../src/lib/saves';

MotionGlobalConfig.skipAnimations = true;

// jsdom has no matchMedia; the app runs in a browser tab unless a test says otherwise.
window.matchMedia = (query: string) =>
  Object.assign(new EventTarget(), {
    matches: false,
    media: query,
    onchange: null,
  }) as MediaQueryList;

// jsdom's phone speaks American English; the tests are written for a Danish one.
Object.defineProperty(navigator, 'languages', { value: ['da-DK', 'da'], configurable: true });

// jsdom has no ResizeObserver; every browser the app runs in does. Here nothing is ever resized.
globalThis.ResizeObserver = class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

afterEach(async () => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
  await saves.remove(familySaveKey);
  await saves.remove(rememberedSaveKey);
  await saves.remove(localeSaveKey);
  await saves.remove(betaSaveKey);
  await saves.remove(soundSaveKey);
});

// The service worker is registered only in a built app; in tests no update is ever waiting.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(() => Promise.resolve()),
  })),
}));
