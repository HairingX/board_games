import type { Random } from '../random';

/**
 * A character's babbling voice: no words, only syllables of a tone made in the phone, in the
 * character's own pitch and pace, so it speaks every language. The owner chose tones over
 * recorded voice clips, which sounded worse.
 */
export interface Voice {
  /** The tone's shape: soft as a sine, bright as a triangle, rough as a sawtooth. */
  wave: OscillatorType;
  /** The vowel's colour, in hertz: where the tone is let through. */
  vowel: number;
  /** The voice's pitch, in hertz. */
  pitch: number;
  /** Syllables a second. */
  pace: number;
  /** How far, in semitones, a syllable may stray from the voice's pitch. */
  spread: number;
  /** How loud it speaks, from 0 to 1, if not as most voices do. */
  volume?: number;
}

/** One syllable: when it starts and how long it lasts, in seconds, and how high it is. */
export interface Syllable {
  at: number;
  length: number;
  /** Semitones above or below the voice's pitch. */
  step: number;
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
  }));
}

/** A pitch moved up or down by semitones. */
export function shift(pitch: number, step: number): number {
  return pitch * 2 ** (step / 12);
}
