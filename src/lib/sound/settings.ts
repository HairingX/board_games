import type { SoundSettings } from './engine';

/** Where the phone keeps whether music and effects play. */
export const soundSaveKey = 'lyd';

/** The settings saved, or music and effects on when none were. */
export function reviveSoundSettings(saved: unknown): SoundSettings {
  const { music, effects } = (typeof saved === 'object' && saved !== null ? saved : {}) as Record<
    string,
    unknown
  >;
  return {
    music: typeof music === 'boolean' ? music : true,
    effects: typeof effects === 'boolean' ? effects : true,
  };
}
