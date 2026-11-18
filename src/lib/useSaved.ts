import { useCallback, useEffect, useState } from 'react';
import { keepSavesSafe } from './persistence';
import { saves as defaultSaves, type Saves } from './saves';

/**
 * State that is saved on the device every time it changes, and read back when the game opens.
 * Undefined until the save has been read. `revive` makes the state from what was saved, which
 * is undefined when nothing was, or anything an earlier version saved. Pass a `revive` that
 * stays the same between renders, such as a module function, or the save is read again.
 * After each save it asks the browser to keep the saves, as changes come from a tap.
 */
export function useSaved<T>(
  key: string,
  revive: (saved: unknown) => T,
  saves: Saves = defaultSaves,
): [T | undefined, (next: T) => void] {
  const [state, setState] = useState<T>();

  useEffect(() => {
    let current = true;
    void saves
      .read(key)
      .catch(() => undefined)
      .then((saved) => {
        if (current) setState(revive(saved));
      });
    return () => {
      current = false;
    };
  }, [key, revive, saves]);

  const save = useCallback(
    (next: T) => {
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
