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
  /** How much something gives way under the finger. */
  press: { scale: 0.97 },
  /**
   * A pixel figure breathing while it stands: lifted one pixel for part of each breath, as the
   * pack has no standing animation. In seconds.
   */
  breath: { every: 1.4, lifted: 0.5 },
} as const;
