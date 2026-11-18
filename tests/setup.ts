import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach } from 'vitest';

MotionGlobalConfig.skipAnimations = true;

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
});
