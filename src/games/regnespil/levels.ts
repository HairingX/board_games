/**
 * The math game's levels. A level, not a school grade, decides what the tasks hold. Levels
 * 1–12 each say roughly which grade they suit, from what Danish schools teach when
 * (docs/regnespil-research.md), as guidance only; 13–15 go beyond school, hard even for
 * grown-ups, as the owner wants.
 */
export const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
export type Level = (typeof levels)[number];

/** Whom a level suits: the Danish school grades, from and to, or beyond school. */
export type Guide = readonly [number, number] | 'upper' | 'adult' | 'master';

export const guides: Readonly<Record<Level, Guide>> = {
  1: [0, 1],
  2: [1, 1],
  3: [1, 2],
  4: [2, 2],
  5: [2, 3],
  6: [3, 4],
  7: [4, 4],
  8: [4, 5],
  9: [5, 5],
  10: [6, 6],
  11: [7, 8],
  12: [8, 9],
  13: 'upper',
  14: 'adult',
  15: 'master',
};
