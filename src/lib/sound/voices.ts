import type { Voice } from './babble';

/** The characters' voices: each a tone of its own, high or low, quick or slow. */
export const voices = {
  hero: { wave: 'triangle', vowel: 1100, pitch: 330, pace: 11, spread: 3, volume: 0.35 },
  fairy: { wave: 'sine', vowel: 2400, pitch: 880, pace: 15, spread: 5 },
  /**
   * The monsters, each in a voice that fits its size, heard as it attacks: a slime light and
   * bubbly, a troll low and rough, a giant boss deeper and slower still. They speak up, so a
   * monster's cries are heard over the fight, as the owner asked.
   */
  slime: { wave: 'triangle', vowel: 900, pitch: 220, pace: 9, spread: 4, volume: 0.45 },
  troll: { wave: 'sawtooth', vowel: 380, pitch: 70, pace: 6, spread: 1 },
  giant: { wave: 'square', vowel: 300, pitch: 55, pace: 5, spread: 1 },
} as const satisfies Record<string, Voice>;
