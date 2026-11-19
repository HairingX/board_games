import type { SoundSettings } from './engine';

/** Where the phone keeps how loud music and effects play. */
export const soundSaveKey = 'lyd';

/**
 * The levels saved, each from 0 to 1, or both as mixed when none were. An earlier version
 * kept whether each was on: on is as mixed, off is 0.
 */
export function reviveSoundSettings(saved: unknown): SoundSettings {
  const { music, effects } = (typeof saved === 'object' && saved !== null ? saved : {}) as Record<
    string,
    unknown
  >;
  return { music: level(music), effects: level(effects) };
}

function level(value: unknown): number {
  if (typeof value === 'number' && value >= 0 && value <= 1) return value;
  return value === false ? 0 : 1;
}
