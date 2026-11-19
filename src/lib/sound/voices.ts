import type { Voice } from './babble';

/** The characters' voices: each a tone of its own, high or low, quick or slow. */
export const voices = {
  hero: { wave: 'triangle', vowel: 1100, pitch: 330, pace: 11, spread: 3 },
  troll: { wave: 'sawtooth', vowel: 550, pitch: 98, pace: 7, spread: 2 },
  fairy: { wave: 'sine', vowel: 2400, pitch: 880, pace: 15, spread: 5 },
  /** A monster's growl before it attacks: low, rough and slow. */
  growl: { wave: 'sawtooth', vowel: 380, pitch: 70, pace: 6, spread: 1 },
  /** A deeper rumble, to compare with the growl. */
  rumble: { wave: 'square', vowel: 300, pitch: 55, pace: 5, spread: 1 },
} as const satisfies Record<string, Voice>;
