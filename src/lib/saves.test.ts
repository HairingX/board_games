import { afterEach, describe, expect, it, vi } from 'vitest';
import { moveSave, openSaves } from './saves';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('openSaves', () => {
  it('writes, reads back and removes values in IndexedDB', async () => {
    const saves = openSaves();
    await saves.write('spil', { cards: ['a'] });
    expect(await openSaves().read('spil')).toEqual({ cards: ['a'] });
    await saves.remove('spil');
    expect(await saves.read('spil')).toBeUndefined();
  });

  it('lists every key and value', async () => {
    const saves = openSaves();
    await saves.write('liste/a', 1);
    expect(await saves.entries()).toContainEqual(['liste/a', 1]);
    await saves.remove('liste/a');
  });

  it('keeps the values in memory when IndexedDB cannot be opened', async () => {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('blocked');
    });
    const saves = openSaves();
    await saves.write('spil', 1);
    expect(await saves.read('spil')).toBe(1);
    expect(await saves.entries()).toEqual([['spil', 1]]);
    await saves.remove('spil');
    expect(await saves.read('spil')).toBeUndefined();
  });
});

describe('moveSave', () => {
  it('moves a save once, never over one that is there, and not from nothing', async () => {
    const saves = openSaves();
    await saves.write('flyt/fra', 'gammel');
    await moveSave(saves, 'flyt/fra', 'flyt/til');
    expect(await saves.read('flyt/til')).toBe('gammel');
    expect(await saves.read('flyt/fra')).toBeUndefined();

    await saves.write('flyt/fra', 'ny');
    await moveSave(saves, 'flyt/fra', 'flyt/til');
    expect(await saves.read('flyt/til')).toBe('gammel');

    await moveSave(saves, 'flyt/intet', 'flyt/andet');
    expect(await saves.read('flyt/andet')).toBeUndefined();
    for (const key of ['flyt/fra', 'flyt/til']) await saves.remove(key);
  });
});
