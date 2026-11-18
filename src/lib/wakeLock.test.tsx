import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWakeLock } from './wakeLock';

function Screen({ active }: { active: boolean }) {
  useWakeLock(active);
  return null;
}

function fakeWakeLock(request: () => Promise<WakeLockSentinel>) {
  const wakeLock = { request: vi.fn(request) };
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: wakeLock });
  return wakeLock;
}

/** A wake lock as granted, and the spy on letting it go. */
function sentinel() {
  const release = vi.fn(() => Promise.resolve());
  return { lock: { release } as unknown as WakeLockSentinel, release };
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'wakeLock');
  Reflect.deleteProperty(document, 'visibilityState');
});

describe('useWakeLock', () => {
  it('keeps the screen on while active, and lets go when done', async () => {
    const { lock, release } = sentinel();
    const wakeLock = fakeWakeLock(() => Promise.resolve(lock));
    const { unmount } = render(<Screen active />);
    await act(() => Promise.resolve());
    expect(wakeLock.request).toHaveBeenCalledWith('screen');
    unmount();
    expect(release).toHaveBeenCalledOnce();
  });

  it('asks again each time the app is shown', async () => {
    const wakeLock = fakeWakeLock(() => Promise.resolve(sentinel().lock));
    render(<Screen active />);
    await act(() => Promise.resolve());
    setVisibility('hidden');
    setVisibility('visible');
    await act(() => Promise.resolve());
    expect(wakeLock.request).toHaveBeenCalledTimes(2);
  });

  it('lets go of a lock granted after the screen was left', async () => {
    const { lock, release } = sentinel();
    let grant: (value: WakeLockSentinel) => void = () => undefined;
    fakeWakeLock(
      () =>
        new Promise((resolve) => {
          grant = resolve;
        }),
    );
    const { unmount } = render(<Screen active />);
    unmount();
    await act(async () => {
      grant(lock);
      await Promise.resolve();
    });
    expect(release).toHaveBeenCalledOnce();
  });

  it('carries on when the lock is refused', async () => {
    const wakeLock = fakeWakeLock(() => Promise.reject(new Error('low battery')));
    const { unmount } = render(<Screen active />);
    await act(() => Promise.resolve());
    expect(wakeLock.request).toHaveBeenCalledOnce();
    unmount();
  });

  it('does nothing while inactive or where there is no wake lock', () => {
    const wakeLock = fakeWakeLock(() => Promise.resolve(sentinel().lock));
    render(<Screen active={false} />);
    expect(wakeLock.request).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, 'wakeLock');
    expect(() => render(<Screen active />)).not.toThrow();
  });
});
