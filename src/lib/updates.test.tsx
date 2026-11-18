import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadNewVersion, updateCheckInterval, useUpdateChecks, type Updatable } from './updates';

function Checks({ registration }: { registration: Updatable | undefined }) {
  useUpdateChecks(registration);
  return null;
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(document, 'visibilityState');
});

describe('useUpdateChecks', () => {
  it('asks for a new version when the app comes back on screen, not when it is hidden', () => {
    const update = vi.fn(() => Promise.resolve());
    render(<Checks registration={{ update }} />);
    setVisibility('hidden');
    expect(update).not.toHaveBeenCalled();
    setVisibility('visible');
    expect(update).toHaveBeenCalledOnce();
  });

  it('asks every hour while the app is open, and stops when it closes', () => {
    vi.useFakeTimers();
    const update = vi.fn(() => Promise.resolve());
    const { unmount } = render(<Checks registration={{ update }} />);
    vi.advanceTimersByTime(updateCheckInterval);
    expect(update).toHaveBeenCalledOnce();
    unmount();
    vi.advanceTimersByTime(updateCheckInterval);
    setVisibility('visible');
    expect(update).toHaveBeenCalledOnce();
  });

  it('carries on when the server cannot be reached', async () => {
    const update = vi.fn(() => Promise.reject(new Error('offline')));
    render(<Checks registration={{ update }} />);
    setVisibility('visible');
    await act(() => Promise.resolve());
    expect(update).toHaveBeenCalledOnce();
  });

  it('does nothing before the service worker is registered', () => {
    expect(() => render(<Checks registration={undefined} />)).not.toThrow();
  });
});

describe('loadNewVersion', () => {
  it('lets the waiting service worker take over a page it runs', () => {
    const takeOver = vi.fn(() => Promise.resolve());
    const reload = vi.fn();
    loadNewVersion({ controller: {} as ServiceWorker }, takeOver, reload);
    expect(takeOver).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
  });

  it('loads the page again on a first visit, when no service worker runs it yet', () => {
    const takeOver = vi.fn(() => Promise.resolve());
    const reload = vi.fn();
    loadNewVersion({ controller: null }, takeOver, reload);
    expect(reload).toHaveBeenCalledOnce();
    expect(takeOver).not.toHaveBeenCalled();
  });
});
