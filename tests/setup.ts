import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';

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
