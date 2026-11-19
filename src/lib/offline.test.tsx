import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { offlineStatus, useOfflineStatus } from './offline';

/** A service worker registration whose workers can be changed, as the browser does. */
function fakeRegistration() {
  const registration = Object.assign(new EventTarget(), {
    active: null as ServiceWorker | null,
    installing: null as ServiceWorker | null,
  });
  const worker = () => new EventTarget() as ServiceWorker;
  return {
    registration,
    asRegistration: registration as unknown as ServiceWorkerRegistration,
    worker,
  };
}

describe('offlineStatus', () => {
  it('is ready once a service worker is active, fetching while one installs', () => {
    const { registration, asRegistration, worker } = fakeRegistration();
    expect(offlineStatus(undefined)).toBe('unknown');
    expect(offlineStatus(asRegistration)).toBe('unknown');
    registration.installing = worker();
    expect(offlineStatus(asRegistration)).toBe('fetching');
    registration.active = worker();
    expect(offlineStatus(asRegistration)).toBe('ready');
  });
});

describe('useOfflineStatus', () => {
  it('follows the service worker as it installs and takes over, and as a new one is found', () => {
    const { registration, asRegistration, worker } = fakeRegistration();
    const installing = worker();
    registration.installing = installing;
    const { result, unmount } = renderHook(() => useOfflineStatus(asRegistration));
    expect(result.current).toBe('fetching');

    act(() => {
      registration.active = installing;
      registration.installing = null;
      installing.dispatchEvent(new Event('statechange'));
    });
    expect(result.current).toBe('ready');

    const next = worker();
    act(() => {
      registration.installing = next;
      registration.dispatchEvent(new Event('updatefound'));
    });
    expect(result.current).toBe('ready');
    unmount();
  });

  it('is unknown without a registration', () => {
    expect(renderHook(() => useOfflineStatus(undefined)).result.current).toBe('unknown');
  });
});
