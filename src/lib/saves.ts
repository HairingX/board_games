import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const databaseName = 'smaaspil';
const storeName = 'saves';

/** The database's shape: one store of values under text keys. */
interface SavesSchema extends DBSchema {
  saves: { key: string; value: unknown };
}

/** Where the games keep their progress: one value per key. */
export interface Saves {
  read: (key: string) => Promise<unknown>;
  write: (key: string, value: unknown) => Promise<void>;
  remove: (key: string) => Promise<void>;
  /** Every saved key and value. */
  entries: () => Promise<[string, unknown][]>;
}

/**
 * The saves in the browser's IndexedDB. Writes ask for strict durability, so a save has
 * reached the disk before it counts as done. Where IndexedDB cannot be opened, as in some
 * private modes, the saves live in memory and last until the app is closed.
 */
export function openSaves(): Saves {
  // Opened inside a promise, because openDB throws at once where IndexedDB is missing.
  const database: Promise<IDBPDatabase<SavesSchema> | undefined> = Promise.resolve()
    .then(() =>
      openDB<SavesSchema>(databaseName, 1, {
        upgrade(db) {
          db.createObjectStore(storeName);
        },
      }),
    )
    .catch(() => undefined);
  const memory = new Map<string, unknown>();

  return {
    async read(key) {
      const db = await database;
      return db ? db.get(storeName, key) : memory.get(key);
    },
    async write(key, value) {
      const db = await database;
      if (!db) {
        memory.set(key, value);
        return;
      }
      const transaction = db.transaction(storeName, 'readwrite', { durability: 'strict' });
      await transaction.store.put(value, key);
      await transaction.done;
    },
    async remove(key) {
      const db = await database;
      if (db) await db.delete(storeName, key);
      else memory.delete(key);
    },
    async entries() {
      const db = await database;
      if (!db) return [...memory.entries()];
      const transaction = db.transaction(storeName);
      const [keys, values] = await Promise.all([
        transaction.store.getAllKeys(),
        transaction.store.getAll(),
      ]);
      return keys.map((key, index): [string, unknown] => [key, values[index]]);
    },
  };
}

/** The saves every game shares. */
export const saves: Saves = openSaves();

/**
 * Moves the value saved under one key to another, unless there is already one there or nothing
 * to move: so a save can move to a new key once, without overwriting.
 */
export async function moveSave(saves: Saves, from: string, to: string): Promise<void> {
  if ((await saves.read(to)) !== undefined) return;
  const value = await saves.read(from);
  if (value === undefined) return;
  await saves.write(to, value);
  await saves.remove(from);
}
