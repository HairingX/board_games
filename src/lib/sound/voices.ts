import type { Voice } from './babble';

/** The characters' voices: each a tone of its own, high or low, quick or slow. */
export const voices = {
  hero: { wave: 'triangle', vowel: 1100, pitch: 330, pace: 11, spread: 3 },
  troll: { wave: 'sawtooth', vowel: 550, pitch: 98, pace: 7, spread: 2 },
  fairy: { wave: 'sine', vowel: 2400, pitch: 880, pace: 15, spread: 5 },
} as const satisfies Record<string, Voice>;
