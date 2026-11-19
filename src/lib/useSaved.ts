import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
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

/**
 * Like `useSaved`, for several keys at once, such as each player's own progress in a game:
 * undefined until every one has been read. `revive` makes each from what was saved under its
 * key, given its place in `keys`; it may change between renders. A change made to one before
 * they have been read wins over what is read for it.
 */
export function useSavedEach<T>(
  keys: readonly string[],
  revive: (saved: unknown, index: number) => T,
  saves: Saves = defaultSaves,
): [readonly T[] | undefined, (index: number, next: T) => void] {
  /** The keys as one value, so the same keys read once however often the list is made. */
  const joined = keys.join('\n');
  const [state, setState] = useState<{ keys: string; values: readonly T[] }>();
  /** The values changed since these keys were read, by their place, so the read keeps them. */
  const changed = useRef(new Map<number, T>());
  const onRead = useEffectEvent((saved: readonly unknown[]) =>
    saved.map((value, index) =>
      changed.current.has(index) ? (changed.current.get(index) as T) : revive(value, index),
    ),
  );

  useEffect(() => {
    let current = true;
    changed.current = new Map();
    void Promise.all(joined.split('\n').map((key) => saves.read(key).catch(() => undefined))).then(
      (saved) => {
        if (current) setState({ keys: joined, values: onRead(saved) });
      },
    );
    return () => {
      current = false;
    };
  }, [joined, saves]);

  const save = useCallback(
    (index: number, next: T) => {
      changed.current.set(index, next);
      setState((known) =>
        known?.keys === joined
          ? { keys: joined, values: known.values.map((value, at) => (at === index ? next : value)) }
          : known,
      );
      const key = joined.split('\n')[index] as string;
      void saves
        .write(key, next)
        .then(() => keepSavesSafe(undefined, saves))
        .catch(() => undefined);
    },
    [joined, saves],
  );

  return [state?.keys === joined ? state.values : undefined, save];
}
