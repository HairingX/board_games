import type { Transition } from 'motion/react';

/**
 * The motion every game shares, in one place so that cards, pieces and dice move alike.
 * Springs suit things moved by a hand; short eased tweens suit things leaving the screen.
 */
export const motionTokens = {
  /** A card turning over: soft enough to see, quick enough not to wait for. */
  flip: { type: 'spring', stiffness: 210, damping: 19, mass: 0.9 } satisfies Transition,
  /** A card arriving on the table. */
  arrive: { type: 'spring', stiffness: 320, damping: 28 } satisfies Transition,
  /** A card leaving the table. */
  leave: { duration: 0.32, ease: 'easeIn' } satisfies Transition,
  /** How a thrown card travels: sideways distance in pixels and tilt in degrees. */
  throw: { distance: 440, tilt: 18 },
  /** How far a card sinks when it goes back into the pile, as scale and pixels down. */
  sink: { scale: 0.9, drop: 24 },
  /** The tilt in degrees of a card dragged this many pixels sideways. */
  dragTilt: { degrees: 14, distance: 240 },
  /**
   * A drag counts as a throw past this many pixels, counting velocity at this weight; how
   * freely the card follows the finger, from 0 (not at all) to 1.
   */
  swipe: { distance: 120, velocityWeight: 0.2, elastic: 0.8 },
  /** How far, in pixels, a note such as a new version's rises from below as it arrives. */
  toast: { rise: 80 },
  /** How much something gives way under the finger. */
  press: { scale: 0.97 },
  /**
   * A pixel figure breathing while it stands: lifted one pixel for part of each breath, as the
   * pack has no standing animation. In seconds.
   */
  breath: { every: 1.4, lifted: 0.5 },
  /** A figure that bounces, as a slime does: frames a second through its four frames. */
  bounce: { framesPerSecond: 6 },
  /** A figure running or walking, through the four frames of its sheet's walk: frames a second. */
  walk: { framesPerSecond: 10 },
  /**
   * What a figure does once, in seconds and pixels: a sword stroke lunging forward, being hit
   * (blinking), a cheering jump, and vanishing.
   */
  act: {
    attack: { seconds: 0.35, lunge: 5 },
    hurt: { seconds: 0.6, blink: 0.08 },
    cheer: { seconds: 0.7, height: 6 },
    vanish: { seconds: 0.5 },
    /**
     * Running at another figure, the act's `reach` pixels, a moment there, and back: slow enough
     * to hope, as the owner asked, since the answer shows as it arrives.
     */
    charge: { out: 0.45, hold: 0.2, back: 0.4 },
    /**
     * Shoved backwards and over, where the act's `reach` took the figure: lying down a while,
     * then up and back home.
     */
    knocked: { push: 6, fall: 0.12, down: 0.7, rise: 0.4, drop: 3 },
    /** Walking home from where the act's `reach` took the figure. */
    return: { seconds: 0.4 },
    /**
     * Walking slowly the act's `reach` toward another figure, over the act's own `lasts`, as a
     * monster comes at the hero while a sum is thought over; this long if the act says not.
     */
    approach: { seconds: 15 },
    /** Stepping into place from where the act says it was, as a hero whose turn it is now. */
    step: { seconds: 0.4 },
    /**
     * A body slam: a high jump the act's `reach` toward another figure, landing on it, a
     * moment there, and a hop back.
     */
    pounce: { out: 0.45, hold: 0.25, back: 0.5, height: 22 },
    /** Spinning round like a top, its other side showing this many times. */
    spin: { seconds: 0.8, turns: 9 },
    /**
     * Swelling up with a roar, as a monster enters a new phase: growing to `size` times its
     * size, trembling a while by `shake` pixels, and shrinking back.
     */
    swell: { up: 0.3, hold: 0.6, down: 0.3, size: 1.4, shake: 1 },
    /** A high jump, clear of a stroke. */
    leap: { seconds: 0.55, height: 16 },
    /** Burrowing into the ground, a moment under it, and up again. */
    sink: { down: 0.15, under: 0.4, up: 0.2 },
  },
  /** How long a sign over a figure's head shows, in seconds. */
  sign: { seconds: 1.6 },
  /** An effect's frames a second, such as a sword's sweep or a puff of smoke. */
  effect: { framesPerSecond: 14, flight: 0.45 },
  /** How long a fight waits after an answer before the next sum: shorter when it was right. */
  fightPause: { right: 0.9, wrong: 1.8 },
} as const;
