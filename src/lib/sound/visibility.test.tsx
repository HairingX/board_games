import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sound, SoundEngine } from './engine';
import { usePausedWhenHidden } from './visibility';

function showPage(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  showPage('visible');
  vi.restoreAllMocks();
});

describe('usePausedWhenHidden', () => {
  it('pauses the sound while the app is out of sight, and wakes it when it is back', () => {
    const engine = new SoundEngine();
    const sleep = vi.spyOn(engine, 'sleep').mockReturnValue(undefined);
    const wake = vi.spyOn(engine, 'wake').mockReturnValue(undefined);
    const { unmount } = renderHook(() => {
      usePausedWhenHidden(engine);
    });
    showPage('hidden');
    expect(sleep).toHaveBeenCalledOnce();
    showPage('visible');
    expect(wake).toHaveBeenCalledOnce();
    unmount();
    showPage('hidden');
    expect(sleep).toHaveBeenCalledOnce();
  });

  it('looks after the app’s own sound when none is given', () => {
    const sleep = vi.spyOn(sound, 'sleep').mockReturnValue(undefined);
    renderHook(() => {
      usePausedWhenHidden();
    });
    showPage('hidden');
    expect(sleep).toHaveBeenCalledOnce();
  });
});
