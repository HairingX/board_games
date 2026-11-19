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

/**
 * A new task at the level: one of its kinds of sums, with the right answer and two typical
 * mistakes, distinct, and not below zero unless negative numbers are taught, in a random order.
 * Should a sum's mistakes not give two, the answer's next neighbours fill in.
 */
export function makeTask(level: Level, random: Random = Math.random): Task {
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
