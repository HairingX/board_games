/*
 * The answers' sounds: short tunes of tones made in the phone, the same every time, so a child
 * who cannot read learns at once how an answer went. From the analysis of the pack's sounds,
 * whose fight sounds told what happened but not how it went (a rising "boing" for an answer far
 * off, a loud clang for a close one), and from research on sounds that give feedback: a rising
 * tune that lands is heard as right; one that rises without landing as nearly; a soft, low one
 * that falls a little as not this time, kindly, never a buzzer, as harsh sounds for mistakes
 * make children anxious about maths. Right is the loudest, far off the softest.
 */

/** A note of a chime: when it starts and how long it rings, in seconds, and how high it is. */
export interface ChimeNote {
  at: number;
  length: number;
  /** Semitones above or below the chime's pitch. */
  step: number;
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

/** G5, where the bright chimes start; E4, where the soft one does. */
const high = 784;
const low = 330;

export const chimes = {
  /** Right: up a major chord, landing on its fifth and ringing, bright and glad. */
  right: {
    wave: 'triangle',
    pitch: high,
    volume: 0.5,
    notes: [
      { at: 0, length: 0.12, step: 0 },
      { at: 0.07, length: 0.12, step: 4 },
      { at: 0.14, length: 0.34, step: 7 },
    ],
  },
  /** Close: the same bright tone up a step, short, without landing: nearly. */
  close: {
    wave: 'triangle',
    pitch: high,
    volume: 0.4,
    notes: [
      { at: 0, length: 0.12, step: 0 },
      { at: 0.11, length: 0.14, step: 2 },
    ],
  },
  /** Far off: two low, soft notes falling a little: not this time. */
  far: {
    wave: 'sine',
    pitch: low,
    volume: 0.25,
    notes: [
      { at: 0, length: 0.16, step: 0 },
      { at: 0.16, length: 0.28, step: -3 },
    ],
  },
} as const satisfies Record<'right' | 'close' | 'far', Chime>;
