import type { Voice } from './babble';

/*
 * The characters' voices: each a tone of its own, high or low, quick or slow, and bright enough
 * to be heard from a phone's small speaker, which gives almost nothing below a few hundred
 * hertz: a soft tone low down was all but silent there, as the owner heard. So each speaks in
 * a tone rich in overtones, its "vowel" where a phone's speaker plays well, and at a volume
 * from its measured loudness, so all are heard alike, just under the answers' chimes.
 *
 * Measured as for the sound files (the loudest tenth of a second, in dB below full scale), from
 * three syllables at full volume through a filter that cuts below 600 Hz, as a phone's speaker
 * does. A voice added or changed here is measured the same way.
 */

/** How loud the voices speak, in dB below full scale: just under the chimes (about −15 dB). */
export const voiceLoudness = -17;

/** A voice with the volume that brings it, as measured, to the voices' loudness. */
function spoken(voice: Omit<Voice, 'volume'>, measured: number): Voice {
  return { ...voice, volume: 10 ** ((voiceLoudness - measured) / 20) };
}

export const voices = {
  hero: spoken({ wave: 'square', vowel: 1400, pitch: 330, pace: 11, spread: 3 }, -11.9),
  fairy: spoken({ wave: 'sine', vowel: 2400, pitch: 880, pace: 15, spread: 5 }, -11.2),
  /**
   * The monsters, each in a voice that fits its size, heard as it attacks: a slime light and
   * bubbly, a troll low and rough, a giant boss deeper and slower still.
   */
  slime: spoken({ wave: 'square', vowel: 1200, pitch: 260, pace: 9, spread: 4 }, -11.6),
  troll: spoken({ wave: 'sawtooth', vowel: 700, pitch: 70, pace: 6, spread: 1 }, -18),
  giant: spoken({ wave: 'square', vowel: 600, pitch: 55, pace: 5, spread: 1 }, -16.3),
} as const satisfies Record<string, Voice>;
