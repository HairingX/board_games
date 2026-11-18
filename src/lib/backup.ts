import type { Saves } from './saves';

/** What a backup file holds: every save, under the app's name and the backup's version. */
export interface Backup {
  app: 'smaaspil';
  version: 1;
  /** When the backup was made, as an ISO date and time. */
  madeAt: string;
  saves: Record<string, unknown>;
}

/** A backup of every save, made at the given time. */
export async function makeBackup(saves: Saves, now: Date): Promise<Backup> {
  return {
    app: 'smaaspil',
    version: 1,
    madeAt: now.toISOString(),
    saves: Object.fromEntries(await saves.entries()),
  };
}

/** The backup in a file's text, or undefined when the text is no backup of this app. */
export function readBackup(text: string): Backup | undefined {
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== 'object' || value === null) return undefined;
    const backup = value as Partial<Record<keyof Backup, unknown>>;
    const valid =
      backup.app === 'smaaspil' &&
      backup.version === 1 &&
      typeof backup.madeAt === 'string' &&
      typeof backup.saves === 'object' &&
      backup.saves !== null &&
      !Array.isArray(backup.saves);
    return valid ? (value as Backup) : undefined;
  } catch {
    return undefined;
  }
}

/** Replaces every save with those in the backup. */
export async function restoreBackup(saves: Saves, backup: Backup): Promise<void> {
  for (const [key] of await saves.entries()) await saves.remove(key);
  for (const [key, value] of Object.entries(backup.saves)) await saves.write(key, value);
}

/** The name a backup made on the given day is saved under. */
export function backupFileName(now: Date): string {
  return `smaaspil-sikkerhedskopi-${now.toISOString().slice(0, 10)}.json`;
}
