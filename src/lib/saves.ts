import { openDB, type IDBPDatabase } from 'idb';

const databaseName = 'smaaspil';
const storeName = 'saves';

/** Where the games keep their progress: one value per key. */
export interface Saves {
  read: (key: string) => Promise<unknown>;
  write: (key: string, value: unknown) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

/**
 * The saves in the browser's IndexedDB. Writes ask for strict durability, so a save has
 * reached the disk before it counts as done. Where IndexedDB cannot be opened, as in some
 * private modes, the saves live in memory and last until the app is closed.
 */
export function openSaves(): Saves {
  // Opened inside a promise, because openDB throws at once where IndexedDB is missing.
  const database: Promise<IDBPDatabase | undefined> = Promise.resolve()
    .then(() =>
      openDB(databaseName, 1, {
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
  };
}

/** The saves every game shares. */
export const saves: Saves = openSaves();
