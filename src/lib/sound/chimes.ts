/*
 * The answers' sounds: short tunes of tones made in the phone, the same every time, so a child
 * who cannot read learns at once how an answer went, and how far off it was: a rising tune that
 * lands for right; a half step down for close, "nearly"; and a clear fall of four notes for
 * far off, the last one gliding down, as the owner chose by ear, soft in tone and never a buzzer, as
 * harsh sounds for mistakes make children anxious about maths. All three are about as loud,
 * so none is missed; the music gives way under each.
 */

/** A note of a chime: when it starts and how long it rings, in seconds, and how high it is. */
export interface ChimeNote {
  at: number;
  length: number;
  /** Semitones above or below the chime's pitch. */
  step: number;
  /** Semitones the note glides by as it rings, as a falling "wah"; it holds its pitch without. */
  slide?: number;
}

export interface Chime {
  /** The tone's shape: bright as a triangle, soft as a sine. */
  wave: OscillatorType;
  /** The pitch the notes are counted from, in hertz. */
  pitch: number;
  /** How loud each note starts, from 0 to 1, before the effects' own volume. */
  volume: number;
  notes: readonly ChimeNote[];
}

/** G5, where the answers start; G4, an octave lower, where the fall for far off starts. */
const high = 784;
const low = 392;

export const chimes = {
  /** Right: up a major chord, landing on its fifth and ringing, bright and glad. */
  right: {
    wave: 'triangle',
    pitch: high,
    volume: 0.55,
    notes: [
      { at: 0, length: 0.12, step: 0 },
      { at: 0.07, length: 0.12, step: 4 },
      { at: 0.14, length: 0.34, step: 7 },
    ],
  },
  /** Close: the same bright tone, a half step down: nearly. */
  close: {
    wave: 'triangle',
    pitch: high,
    volume: 0.5,
    notes: [
      { at: 0, length: 0.13, step: 0 },
      { at: 0.12, length: 0.28, step: -1 },
    ],
  },
  /** Far off: four notes stepping down by half steps, the last gliding further: not this time. */
  far: {
    wave: 'triangle',
    pitch: low,
    volume: 0.6,
    notes: [
      { at: 0, length: 0.2, step: 0 },
      { at: 0.2, length: 0.2, step: -1 },
      { at: 0.4, length: 0.2, step: -2 },
      { at: 0.6, length: 0.6, step: -3, slide: -2 },
    ],
  },
} as const satisfies Record<'right' | 'close' | 'far', Chime>;
