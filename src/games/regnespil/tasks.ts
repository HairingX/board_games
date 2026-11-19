import { shuffle, type Random } from '../../lib/random';
import type { Level } from './levels';

/*
 * The tasks are made, never stored: each from its level's kinds of sums, with two wrong answers
 * made from the mistakes children typically make, so a wrong choice says something.
 */

export type Operator = '+' | '−' | '×' | '÷';

/** A sum as it is shown: numbers, operators and brackets, in order. */
export type Token = number | Operator | '(' | ')';

export interface Task {
  sum: readonly Token[];
  answer: number;
  /** Three answers to choose from, the right one among them, in the order they are shown. */
  choices: readonly number[];
}

/** A whole number from `from` to `to`, both included. */
function between(random: Random, from: number, to: number): number {
  return from + Math.floor(random() * (to - from + 1));
}

function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}

/** A sum, its answer, and the answers typical mistakes give, likeliest first. */
interface Made {
  sum: Token[];
  answer: number;
  mistakes: number[];
}

/** The two digits of a number below 100, tens and ones. */
const digits = (n: number) => [Math.floor(n / 10), n % 10] as const;

function plus(a: number, b: number): Made {
  return {
    sum: [a, '+', b],
    answer: a + b,
    mistakes: [a + b - 1, a + b + 1, a + b + 10, a + b - 10, a - b],
  };
}

function minus(a: number, b: number): Made {
  const [aTens, aOnes] = digits(a % 100);
  const [bTens, bOnes] = digits(b % 100);
  // Taking the smaller digit from the larger: 52 − 17 → 45.
  const smallerFromLarger =
    Math.floor(a / 100) * 100 + (aTens - bTens) * 10 + Math.abs(aOnes - bOnes);
  return {
    sum: [a, '−', b],
    answer: a - b,
    mistakes: [smallerFromLarger, a - b + 1, a - b - 1, a - b + 10, a - b - 10, a + b],
  };
}

function times(a: number, b: number): Made {
  return {
    sum: [a, '×', b],
    answer: a * b,
    // Neighbours in the same table: 7 · 8 → 7 · 7 or 7 · 9; and the wrong operation.
    mistakes: [a * (b - 1), a * (b + 1), (a - 1) * b, (a + 1) * b, a + b, a * b + 10],
  };
}

function divide(answer: number, by: number): Made {
  const total = answer * by;
  return {
    sum: [total, '÷', by],
    answer,
    mistakes: [answer + 1, answer - 1, total - by, answer + 10, answer * 10],
  };
}

/** Order of operations: a + b × c, where working left to right gives (a + b) × c. */
function plusTimes(a: number, b: number, c: number): Made {
  return {
    sum: [a, '+', b, '×', c],
    answer: a + b * c,
    mistakes: [(a + b) * c, a + b * c + 1, a + b + c, a * b + c],
  };
}

/** Brackets first: a × (b + c), where forgetting them gives a × b + c. */
function timesBracket(a: number, b: number, c: number): Made {
  return {
    sum: [a, '×', '(', b, '+', c, ')'],
    answer: a * (b + c),
    mistakes: [a * b + c, a * (b + c) + a, a + b + c, a * (b + c) - 1],
  };
}

/** Brackets first: (a − b) × c, where forgetting them gives a − b × c. */
function bracketTimes(a: number, b: number, c: number): Made {
  return {
    sum: ['(', a, '−', b, ')', '×', c],
    answer: (a - b) * c,
    mistakes: [a - b * c, (a - b) * c + c, (a - b) * c - 1, a - b + c],
  };
}

/** Each level's kinds of sums; one is picked at random for each task, so they mix. */
const kinds: Readonly<Record<Level, readonly ((random: Random) => Made)[]>> = {
  1: [
    (r) => {
      const sum = between(r, 2, 10);
      const a = between(r, 1, sum - 1);
      return plus(a, sum - a);
    },
    (r) => {
      const a = between(r, 2, 10);
      return minus(a, between(r, 1, a - 1));
    },
  ],
  2: [
    // Within 20 without crossing ten.
    (r) => {
      const ones = between(r, 1, 8);
      return plus(10 + ones, between(r, 1, 9 - ones));
    },
    (r) => {
      const ones = between(r, 2, 9);
      return minus(10 + ones, between(r, 1, ones));
    },
    // Doubles, and pairs that make ten.
    (r) => {
      const a = between(r, 2, 10);
      return plus(a, a);
    },
    (r) => {
      const a = between(r, 1, 9);
      return pick(r, [plus(a, 10 - a), minus(10, a)]);
    },
  ],
  3: [
    // Within 20 crossing ten: 8 + 5, 14 − 6.
    (r) => {
      const a = between(r, 2, 9);
      return plus(a, between(r, 11 - a, 9));
    },
    (r) => {
      const a = between(r, 11, 18);
      return minus(a, between(r, a - 9, 9));
    },
  ],
  4: [
    // Within 100: two-digit and one- or two-digit, with and without crossing ten.
    (r) => {
      const a = between(r, 11, 89);
      return plus(a, between(r, 2, Math.min(99 - a, 49)));
    },
    (r) => {
      const a = between(r, 21, 99);
      return minus(a, between(r, 2, a - 10));
    },
  ],
  5: [
    (r) => times(between(r, 1, 10), pick(r, [2, 5, 10])),
    (r) => times(pick(r, [2, 5, 10]), between(r, 1, 10)),
    // Doubling and halving.
    (r) => times(2, between(r, 11, 49)),
    (r) => divide(between(r, 6, 49), 2),
    // Whole tens and hundreds to 1000.
    (r) => {
      const a = between(r, 1, 7) * 100 + between(r, 0, 9) * 10;
      return pick(r, [plus(a, between(r, 1, 2) * 100), minus(a, between(r, 1, 9) * 10)]);
    },
  ],
  6: [
    (r) => times(between(r, 2, 10), between(r, 2, 10)),
    (r) => divide(between(r, 2, 10), between(r, 2, 10)),
    (r) => {
      const a = between(r, 120, 760);
      return pick(r, [plus(a, between(r, 101, 239)), minus(a, between(r, 101, a - 10))]);
    },
  ],
  7: [
    (r) => times(between(r, 12, 99), between(r, 2, 9)),
    (r) => times(between(r, 102, 249), between(r, 2, 4)),
    (r) => times(between(r, 2, 99), pick(r, [10, 100])),
    (r) => divide(between(r, 11, 30), between(r, 2, 9)),
  ],
  8: [
    (r) => plusTimes(between(r, 2, 20), between(r, 2, 9), between(r, 2, 9)),
    (r) => timesBracket(between(r, 2, 9), between(r, 2, 6), between(r, 1, 4)),
    (r) => {
      const b = between(r, 2, 9);
      return bracketTimes(between(r, b + 1, 20), b, between(r, 2, 5));
    },
  ],
};

/**
 * A new task at the level: one of its kinds of sums, with the right answer and two typical
 * mistakes, distinct and not below zero, in a random order. Should a sum's mistakes not give
 * two, the answer's next neighbours fill in.
 */
export function makeTask(level: Level, random: Random = Math.random): Task {
  const { sum, answer, mistakes } = pick(random, kinds[level])(random);
  const wrong = [...mistakes, answer + 1, answer + 2]
    .filter((value) => value >= 0 && value !== answer)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 2);
  return { sum, answer, choices: shuffle([answer, ...wrong], random) };
}

/**
 * How a chosen answer went: right; close, as a wrong answer near the right one, so the child
 * was nearly there; or far off.
 */
export type Verdict = 'right' | 'close' | 'far';

export function judge(chosen: number, answer: number): Verdict {
  if (chosen === answer) return 'right';
  return Math.abs(chosen - answer) <= Math.max(2, answer / 10) ? 'close' : 'far';
}
