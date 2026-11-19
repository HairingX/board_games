import type { Level } from './levels';
import { between, pick, type Kind, type Made } from './sums';

/*
 * The kinds of sums of levels 1–8, whole numbers only: from adding within ten to the order of
 * operations, each with the mistakes children typically make.
 */

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
export const basicKinds: Readonly<
  Record<Extract<Level, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>, readonly Kind[]>
> = {
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
