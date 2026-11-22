import { shuffle, type Random } from '../../lib/random';
import { basicKinds } from './basic';
import { harderKinds } from './harder';
import type { Level } from './levels';
import { pick, type Token } from './sums';
import { beside, numeric, same, type Value } from './values';

export type { Operator, Token } from './sums';

/*
 * The tasks are made, never stored: each from its level's kinds of sums, with two wrong answers
 * made from the mistakes people typically make, so a wrong choice says something.
 */

export interface Task {
  sum: readonly Token[];
  answer: Value;
  /** Three answers to choose from, the right one among them, in the order they are shown. */
  choices: readonly Value[];
  /** How near a wrong answer is still close. */
  near: number;
}

const kinds = { ...basicKinds, ...harderKinds };

/** How many of the sums shown last a new one may not repeat. */
export const freshFor = 5;

/** A sum as a key, the same for the same sum, to tell whether it was shown lately. */
export function sumKey(sum: readonly Token[]): string {
  return JSON.stringify(sum);
}

/**
 * A new task at the level that repeats none of the sums shown lately (`recent`, as keys from
 * `sumKey`, the latest last), so the same sum never comes twice in a row: it is drawn again
 * until it is new. A level with few sums may repeat one shown a while ago, never the last.
 */
export function makeTask(
  level: Level,
  random: Random = Math.random,
  recent: readonly string[] = [],
): Task {
  return freshTask(() => anyTask(level, random), recent);
}

/** A task from `draw`, drawn again while it repeats a sum shown lately, as `makeTask` says. */
export function freshTask(draw: () => Task, recent: readonly string[]): Task {
  const lately = new Set(recent.slice(-freshFor));
  const last = recent.at(-1);
  let task = draw();
  for (let tries = 0; tries < drawsAtMost && lately.has(sumKey(task.sum)); tries++) {
    task = draw();
  }
  for (let tries = 0; tries < drawsAtMost && sumKey(task.sum) === last; tries++) {
    task = draw();
  }
  return task;
}

/**
 * How many times a sum is drawn again before giving up; with a fair random source a level's
 * sums are far too many for it ever to be reached.
 */
const drawsAtMost = 100;

/**
 * How a wrong answer to a bigger sum (from `from`) must be as big as the right one, give or
 * take a share (`within`), so it cannot be ruled out by its size alone, as the owner found:
 * 22 squared among 484, 44 and 22 needs no sum. Slips filling in are this far apart (`step`
 * for answers from `from`), which keeps the last digit, so none is ruled out by it either.
 */
export const believable = { from: 20, within: 0.5, step: 10 } as const;

/** Whether a wrong answer is about as big as the right one, so its size alone gives nothing away. */
function aboutAsBig(value: Value, answer: Value): boolean {
  const size = Math.abs(numeric(answer));
  return (
    size < believable.from || Math.abs(Math.abs(numeric(value)) - size) <= size * believable.within
  );
}

/**
 * A task at the level: one of its kinds of sums, with the right answer and two typical
 * mistakes, distinct, and not below zero unless negative numbers are taught, in a random order.
 * A mistake much bigger or smaller than the right answer is left out, unless finding the size
 * is the sum. Should a sum's mistakes not give two, slips beside the answer fill in: its
 * neighbours, or for a bigger answer ten or twenty either side, in a random order, so the
 * right answer is not always the smallest or the middle one.
 */
function anyTask(level: Level, random: Random): Task {
  const made = pick(random, kinds[level])(random);
  const { sum, answer, mistakes, negatives = false, near, sized = false } = made;
  const { step } = believable;
  // Ten either side, or twenty, in a random order, and a neighbour if none of those will do.
  const slips = (
    Math.abs(numeric(answer)) < believable.from
      ? [1, 2]
      : [...shuffle([step, -step, 2 * step, -2 * step], random), 1, -1]
  ).map((by) => beside(answer, by));
  const wrong = [...mistakes, ...slips]
    .filter((value) => sized || aboutAsBig(value, answer))
    .filter((value) => (negatives || numeric(value) >= 0) && !same(value, answer))
    .filter((value, index, all) => all.findIndex((other) => same(other, value)) === index)
    .slice(0, 2);
  return {
    sum,
    answer,
    choices: shuffle([answer, ...wrong], random),
    near: near ?? Math.max(2, Math.abs(numeric(answer)) / 10),
  };
}

/**
 * How a chosen answer went: right; close, as a wrong answer near the right one, so the child
 * was nearly there; or far off.
 */
export type Verdict = 'right' | 'close' | 'far';

export function judge(chosen: Value, answer: Value, near: number): Verdict {
  if (same(chosen, answer)) return 'right';
  return Math.abs(numeric(chosen) - numeric(answer)) <= near ? 'close' : 'far';
}
