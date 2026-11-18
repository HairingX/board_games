import { saves as defaultSaves, type Saves } from './saves';

/** Whether the app runs from the Home Screen or as an installed app, not in a browser tab. */
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches;
}

/** The parts of StorageManager this module uses, so tests can stand in for it. */
export type StorageAccess = Pick<StorageManager, 'persist' | 'persisted'>;

/** The browser's storage manager, which is missing outside secure (https) pages. */
function browserStorage(): StorageAccess | null {
  return 'storage' in navigator ? navigator.storage : null;
}

/** Where it is remembered that a browser tab has asked once. */
const askedKey = 'app/persistence-asked';

/**
 * Asks the browser to keep the saves even when the device runs short of space, and tells
 * whether it will. Call it from a tap, after something worth keeping was saved: Firefox asks
 * the user, the others decide by themselves, and an installed app is usually granted. A
 * browser tab asks only once ever, so that nobody is asked again after saying no; an installed
 * app asks until it is granted, which Chrome and Safari do without asking the user.
 */
export async function keepSavesSafe(
  storage: StorageAccess | null = browserStorage(),
  saves: Saves = defaultSaves,
  installed: boolean = isInstalled(),
): Promise<boolean> {
  try {
    if (!storage) return false;
    if (await storage.persisted()) return true;
    if (!installed && (await saves.read(askedKey)) === true) return false;
    await saves.write(askedKey, true);
    return await storage.persist();
  } catch {
    return false;
  }
}

/** Whether the browser has promised to keep the saves; false where it cannot say. */
export async function savesAreKept(
  storage: StorageAccess | null = browserStorage(),
): Promise<boolean> {
  try {
    return storage ? await storage.persisted() : false;
  } catch {
    return false;
  }
}
