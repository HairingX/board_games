import { useCallback, useEffect, useRef, useState } from 'react';
import { keepSavesSafe } from './persistence';
import { saves as defaultSaves, type Saves } from './saves';

/**
 * State that is saved on the device every time it changes, and read back when the game opens.
 * Undefined until the save has been read. `revive` makes the state from what was saved, which
 * is undefined when nothing was, or anything an earlier version saved. Pass a `revive` that
 * stays the same between renders, such as a module function, or the save is read again.
 * After each save it asks the browser to keep the saves, as changes come from a tap. A change
 * made before the save has been read wins over what is read.
 */
export function useSaved<T>(
  key: string,
  revive: (saved: unknown) => T,
  saves: Saves = defaultSaves,
): [T | undefined, (next: T) => void] {
  const [state, setState] = useState<T>();
  /** Whether the state was changed since this key was read, so the read must not undo it. */
  const changed = useRef(false);

  useEffect(() => {
    let current = true;
    changed.current = false;
    void saves
      .read(key)
      .catch(() => undefined)
      .then((saved) => {
        if (current && !changed.current) setState(revive(saved));
      });
    return () => {
      current = false;
    };
  }, [key, revive, saves]);

  const save = useCallback(
    (next: T) => {
      changed.current = true;
      setState(next);
      void saves
        .write(key, next)
        .then(() => keepSavesSafe(undefined, saves))
        .catch(() => undefined);
    },
    [key, saves],
  );

  return [state, save];
}
