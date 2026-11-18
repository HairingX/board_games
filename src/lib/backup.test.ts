import { describe, expect, it } from 'vitest';
import { backupFileName, makeBackup, readBackup, restoreBackup } from './backup';
import { openSaves } from './saves';

const now = new Date('2026-11-18T12:00:00Z');

describe('backups', () => {
  it('holds every save and puts them back in place of the saves there', async () => {
    const from = openSaves();
    await from.write('backup-test/a', { cards: 1 });
    const backup = await makeBackup(from, now);
    expect(backup).toMatchObject({ app: 'smaaspil', version: 1, madeAt: now.toISOString() });
    expect(backup.saves['backup-test/a']).toEqual({ cards: 1 });

    await from.write('backup-test/b', 'gone after restore');
    await restoreBackup(from, backup);
    expect(await from.read('backup-test/a')).toEqual({ cards: 1 });
    expect(await from.read('backup-test/b')).toBeUndefined();
    await from.remove('backup-test/a');
  });

  it('reads back a backup from its text', () => {
    const text = JSON.stringify({ app: 'smaaspil', version: 1, madeAt: 'x', saves: {} });
    expect(readBackup(text)).toEqual({ app: 'smaaspil', version: 1, madeAt: 'x', saves: {} });
  });

  it.each([
    'not json',
    'null',
    '[]',
    '{"app":"other","version":1,"madeAt":"x","saves":{}}',
    '{"app":"smaaspil","version":2,"madeAt":"x","saves":{}}',
    '{"app":"smaaspil","version":1,"madeAt":1,"saves":{}}',
    '{"app":"smaaspil","version":1,"madeAt":"x","saves":null}',
    '{"app":"smaaspil","version":1,"madeAt":"x","saves":[]}',
  ])('refuses %s', (text) => {
    expect(readBackup(text)).toBeUndefined();
  });

  it('names the file by the day', () => {
    expect(backupFileName(now)).toBe('smaaspil-sikkerhedskopi-2026-11-18.json');
  });
});
