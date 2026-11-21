import { seeded } from '../../lib/random';
import { pick } from './sums';

/*
 * What makes each turn of a fight a little different, as the owner asked, drawn from the
 * fight's seed so a reopened fight plays the same: how the monster strikes back, how it gets
 * out of the way of a stroke that does not land, and now and then, between the sums, how it
 * teases the heroes, each from what the monster has (`monsters.ts`). None of it changes what
 * an answer costs or gives.
 */

/**
 * How often the monster teases after a turn, never two turns running, and not before the
 * heroes have had a few sums to get going.
 */
export const teasing = { share: 0.45, from: 2 } as const;

/** Numbers of the fight's own for a turn, apart for each kind of choice. */
const stream = (seed: number, round: number, salt: number) => seeded(seed + round * 7919 + salt);

/** How the monster strikes back at this turn, of the ways it has. */
export function strikeFor<T>(seed: number, round: number, ways: readonly T[]): T {
  return pick(stream(seed, round, 0), ways);
}

/** How the monster gets out of the way at this turn, of the ways it has. */
export function evasionFor<T>(seed: number, round: number, ways: readonly T[]): T {
  return pick(stream(seed, round, 1), ways);
}

/** Whether, and how, the monster teases after this turn, if it did not after the last. */
export function teaseFor<T>(seed: number, round: number, ways: readonly T[]): T | undefined {
  if (round < teasing.from) return undefined;
  if (teaseFor(seed, round - 1, ways) !== undefined) return undefined;
  const random = stream(seed, round, 2);
  return random() < teasing.share ? pick(random, ways) : undefined;
}
