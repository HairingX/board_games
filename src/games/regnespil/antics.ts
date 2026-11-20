import { seeded } from '../../lib/random';
import { pick } from './sums';

/*
 * What makes each turn of a fight a little different, as the owner asked, drawn from the
 * fight's seed so a reopened fight plays the same: how the slime gets out of the way of a
 * stroke that does not land, and now and then, between the sums, a little scene where it
 * teases the heroes. None of it changes what an answer costs or gives.
 */

/** How the slime gets out of the way of a stroke: a high leap, burrowing, or a step back. */
export const evasions = ['leap', 'sink', 'sidestep'] as const;
export type Evasion = (typeof evasions)[number];

/** How it teases between the sums: hopping about crossly, or throwing pebbles at the hero. */
export const teases = ['taunt', 'pebbles'] as const;
export type Tease = (typeof teases)[number];

/**
 * How often the slime teases after a turn, never two turns running, and not before the heroes
 * have had a few sums to get going.
 */
export const teasing = { share: 0.45, from: 2 } as const;

/** Numbers of the fight's own for a turn, apart from those that decide its blows. */
const stream = (seed: number, round: number, salt: number) => seeded(seed + round * 7919 + salt);

/** How the slime gets out of the way at this turn. */
export function evasionFor(seed: number, round: number): Evasion {
  return pick(stream(seed, round, 1), evasions);
}

/** Whether, and how, the slime teases after this turn, if it did not after the last. */
export function teaseFor(seed: number, round: number): Tease | undefined {
  if (round < teasing.from) return undefined;
  if (teaseFor(seed, round - 1) !== undefined) return undefined;
  const random = stream(seed, round, 2);
  return random() < teasing.share ? pick(random, teases) : undefined;
}
