import { describe, expect, it, vi } from 'vitest';
import { isInstalled, keepSavesSafe, savesAreKept, type StorageAccess } from './persistence';
import { openSaves } from './saves';

function storage(persisted: boolean, granted = true): StorageAccess {
  return {
    persisted: vi.fn(() => Promise.resolve(persisted)),
    persist: vi.fn(() => Promise.resolve(granted)),
  };
}

describe('keepSavesSafe', () => {
  it('does not ask when the saves are kept already', async () => {
    const access = storage(true);
    expect(await keepSavesSafe(access, openSaves(), false)).toBe(true);
    expect(access.persist).not.toHaveBeenCalled();
  });

  it('asks a browser tab only once ever', async () => {
    const saves = openSaves();
    await saves.remove('app/persistence-asked');
    const access = storage(false, false);
    expect(await keepSavesSafe(access, saves, false)).toBe(false);
    expect(await keepSavesSafe(access, saves, false)).toBe(false);
    expect(access.persist).toHaveBeenCalledOnce();
  });

  it('asks an installed app until it is granted', async () => {
    const access = storage(false, true);
    const saves = openSaves();
    await keepSavesSafe(access, saves, true);
    expect(await keepSavesSafe(access, saves, true)).toBe(true);
    expect(access.persist).toHaveBeenCalledTimes(2);
  });

  it('cannot keep the saves without a storage manager, or when it fails', async () => {
    expect(await keepSavesSafe(null, openSaves(), true)).toBe(false);
    const failing: StorageAccess = {
      persisted: () => Promise.reject(new Error('broken')),
      persist: () => Promise.resolve(true),
    };
    expect(await keepSavesSafe(failing, openSaves(), true)).toBe(false);
  });

  it('uses the browser and the shared saves by default', async () => {
    expect(await keepSavesSafe()).toBe(false);
  });
});

describe('savesAreKept', () => {
  it('tells what the browser promises', async () => {
    expect(await savesAreKept(storage(true))).toBe(true);
    expect(await savesAreKept(storage(false))).toBe(false);
  });

  it('says no where it cannot tell', async () => {
    expect(await savesAreKept(null)).toBe(false);
    expect(await savesAreKept()).toBe(false);
    expect(
      await savesAreKept({
        persisted: () => Promise.reject(new Error('broken')),
        persist: () => Promise.resolve(true),
      }),
    ).toBe(false);
  });
});

describe('isInstalled', () => {
  it('follows the display mode', () => {
    expect(isInstalled()).toBe(false);
    const matchMedia = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue({ matches: true } as MediaQueryList);
    expect(isInstalled()).toBe(true);
    matchMedia.mockRestore();
  });
});
