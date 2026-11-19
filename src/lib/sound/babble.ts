import type { Random } from '../random';

/** How a voice sounds: made from a tone in the phone, or from short recorded voice clips. */
export type Timbre =
  | { kind: 'tone'; wave: OscillatorType; /** The vowel's colour, in hertz. */ vowel: number }
  | { kind: 'clips' };

/**
 * A character's babbling voice: no words, only syllables in the character's own pitch and pace,
 * so it speaks every language.
 */
export interface Voice {
  timbre: Timbre;
  /** For a tone, its pitch in hertz; for clips, how much faster than recorded they play. */
  pitch: number;
  /** Syllables a second. */
  pace: number;
  /** How far, in semitones, a syllable may stray from the voice's pitch. */
  spread: number;
}

/** One syllable: when it starts and how long it lasts, in seconds, and how high it is. */
export interface Syllable {
  at: number;
  length: number;
  /** Semitones above or below the voice's pitch. */
  step: number;
  /** Which recorded clip to play, for a voice made from clips. */
  clip: number;
}

/** How much of each syllable's turn it sounds; the rest is the pause before the next. */
const sounding = 0.8;

/** How far, in semitones, the last syllable falls, as a sentence's end does. */
const endFall = 3;

/**
 * The syllables of something said in the voice: each at a pitch near the voice's own, the
 * last a little lower, as a sentence ends.
 */
export function babble(voice: Voice, count: number, random: Random = Math.random): Syllable[] {
  const turn = 1 / voice.pace;
  return Array.from({ length: count }, (_, index) => ({
    at: index * turn,
    length: turn * sounding,
    step: Math.round((random() * 2 - 1) * voice.spread) - (index === count - 1 ? endFall : 0),
    clip: Math.floor(random() * 1000),
  }));
}

/** A pitch moved up or down by semitones. */
export function shift(pitch: number, step: number): number {
  return pitch * 2 ** (step / 12);
}
