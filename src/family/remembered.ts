/** Where the phone keeps who was playing and where, so the app opens there again. */
export const rememberedSaveKey = 'sted';

/**
 * How long a grown-up behind the grown-ups' lock is remembered after the app was last used, in
 * milliseconds: a minimised app or a reload goes straight back, but the next morning the code is
 * asked for again, so a child opening the app does not land on a grown-up.
 */
export const lockedGrace = 30 * 60 * 1000;

/** Who was playing, where, and when the app was last used. */
export interface Remembered {
  /** The profile's id, or null when no one was chosen. */
  player: string | null;
  /** Whether choosing the player asked for the grown-ups' code. */
  locked: boolean;
  /** The location's hash the player was on. */
  place: string;
  /** When the app was last used, in milliseconds since 1970. */
  at: number;
}

export const nobody: Remembered = { player: null, locked: false, place: '#/', at: 0 };

/**
 * Who to open the app as, from what was saved: the player, unless they are behind the lock and
 * the app has not been used for a while. `now` is when the app opened.
 */
export function reviveRemembered(saved: unknown, now: number = Date.now()): Remembered {
  if (typeof saved !== 'object' || saved === null) return nobody;
  const { player, locked, place, at } = saved as Record<string, unknown>;
  if (
    (player !== null && typeof player !== 'string') ||
    typeof locked !== 'boolean' ||
    typeof place !== 'string' ||
    typeof at !== 'number'
  ) {
    return nobody;
  }
  const expired = locked && now - at > lockedGrace;
  return expired ? nobody : { player, locked, place, at };
}
