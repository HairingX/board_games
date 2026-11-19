/**
 * The math game's levels. A level, not a school grade, decides what the tasks hold; each says
 * roughly which grade it suits, from what Danish schools teach when (docs/regnespil-research.md),
 * as guidance only. Levels 9–12, with fractions, decimals, negatives and powers, come later.
 */
export const levels = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Level = (typeof levels)[number];

/** The Danish school grades each level suits, from and to; 0 is "0. klasse". */
export const grades: Readonly<Record<Level, readonly [number, number]>> = {
  1: [0, 1],
  2: [1, 1],
  3: [1, 2],
  4: [2, 2],
  5: [2, 3],
  6: [3, 4],
  7: [4, 4],
  8: [4, 5],
};
