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
 * A task at the level: one of its kinds of sums, with the right answer and two typical
 * mistakes, distinct, and not below zero unless negative numbers are taught, in a random order.
 * Should a sum's mistakes not give two, the answer's next neighbours fill in.
 */
function anyTask(level: Level, random: Random): Task {
  const { sum, answer, mistakes, negatives = false, near } = pick(random, kinds[level])(random);
  const wrong = [...mistakes, beside(answer, 1), beside(answer, 2)]
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
