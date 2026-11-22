import type { Random } from '../../lib/random';
import type { Level } from './levels';
import { between, pick, type Kind, type Made } from './sums';
import { fraction, gcd, numeric, tidy, type Fraction, type Value } from './values';

/*
 * The kinds of sums of levels 9–15: decimals, fractions, negative numbers, percent, powers and
 * roots, up to sums hard even for grown-ups, each with the mistakes people typically make.
 */

/** Near enough to be close, for an answer with decimals or a fraction: a tenth of it, or 0.1. */
const nearFor = (answer: Value) => Math.max(0.1, Math.abs(numeric(answer)) / 10);

/** A fraction as it is written in a sum, not reduced: 2/4 stays 2/4. */
const written = (n: number, d: number): Fraction => ({ n, d });

/** A fraction below one, in lowest terms, with a bottom from 2 to `most`: 3/4, never 6/8. */
function proper(r: Random, most: number): Fraction {
  const d = between(r, 2, most);
  const n = between(r, 1, d - 1);
  const divisor = gcd(n, d);
  return written(n / divisor, d / divisor);
}

/** Two fractions added or taken away. */
function fractions(a: Fraction, operator: '+' | '−', b: Fraction): Made {
  const sign = operator === '+' ? 1 : -1;
  const answer = fraction(a.n * b.d + sign * b.n * a.d, a.d * b.d);
  return {
    sum: [a, operator, b],
    answer,
    mistakes: [
      // Tops with tops and bottoms with bottoms: 1/2 + 1/3 → 2/5.
      fraction(a.n + sign * b.n, a.d + b.d),
      // Tops alone, over the bottoms multiplied.
      fraction(a.n + sign * b.n, a.d * b.d),
      // The other operation.
      fraction(a.n * b.d - sign * b.n * a.d, a.d * b.d),
    ],
    near: nearFor(answer),
  };
}

/** A number raised to a power, and the mistake of multiplying by the power instead. */
function power(base: number, exponent: number): Made {
  const answer = base ** exponent;
  return {
    sum: base < 0 ? ['(', base, ')', { power: exponent }] : [base, { power: exponent }],
    answer,
    mistakes: [base * exponent, base ** (exponent - 1), (base + 1) ** exponent, -answer],
    negatives: base < 0,
  };
}

/** The square root of a square, and the mistakes of halving it, or a neighbour. */
function root(n: number): Made {
  return {
    sum: ['√', n * n],
    answer: n,
    mistakes: [(n * n) / 2, n * 2, n + 1, n - 1].filter(Number.isInteger),
  };
}

/** A whole number times another, with the slips of long multiplication. */
function product(a: number, b: number): Made {
  const answer = a * b;
  return {
    sum: [a, '×', b],
    answer,
    mistakes: [answer + 10, answer - 10, answer + a, answer - b, answer + 100],
  };
}

/**
 * A percent of a number that gives a whole number, and the mistakes of giving what is left,
 * a tenth instead of a hundredth, or the percent itself.
 */
function percent(p: number, of: number): Made {
  const answer = (p * of) / 100;
  return {
    sum: [{ percent: p }, 'of', of],
    answer,
    mistakes: [of - answer, answer * 10, p, answer + 10].filter(Number.isInteger),
  };
}

export const harderKinds: Readonly<
  Record<Extract<Level, 9 | 10 | 11 | 12 | 13 | 14 | 15>, readonly Kind[]>
> = {
  9: [
    // Tenths and hundredths added, and the mistake of lining the digits up from the right.
    (r) => {
      const a = between(r, 11, 99);
      const b = between(r, 101, 999);
      const answer = tidy(a / 10 + b / 100);
      return {
        sum: [a / 10, '+', b / 100],
        answer,
        mistakes: [tidy((a + b) / 100), tidy(answer + 0.1), tidy(answer - 0.1)],
        near: nearFor(answer),
      };
    },
    (r) => {
      const b = between(r, 11, 89);
      const a = between(r, b + 1, 99);
      const answer = tidy((a - b) / 10);
      return {
        sum: [a / 10, '−', b / 10],
        answer,
        mistakes: [tidy(answer + 0.1), tidy(answer - 1), tidy((a + b) / 10)],
        near: nearFor(answer),
      };
    },
    // Times 10 or 100, and the mistakes of adding a nought, or moving the point too far.
    (r) => {
      const x = between(r, 101, 999) / 100;
      const by = pick(r, [10, 100]);
      const answer = tidy(x * by);
      return {
        sum: [x, '×', by],
        answer,
        mistakes: [x, tidy(answer / 10), tidy(answer * 10)],
        near: nearFor(answer),
        sized: true,
      };
    },
    // A fraction of a number: 3/4 of 20, and the mistakes of one part, or the rest.
    (r) => {
      const d = pick(r, [2, 3, 4, 5, 10]);
      const n = between(r, 1, d - 1);
      const k = between(r, 2, 12);
      return {
        sum: [written(n, d), 'of', d * k],
        answer: n * k,
        mistakes: [k, (d - n) * k, d * k * n],
      };
    },
    // Fractions with the same bottom.
    (r) => {
      const d = between(r, 3, 12);
      const a = between(r, 1, d - 2);
      return fractions(written(a, d), '+', written(between(r, 1, d - 1 - a), d));
    },
  ],
  10: [
    // A negative number added or taken away, and the mistake of the sign.
    (r) => {
      const a = between(r, -20, 20);
      const b = between(r, 1, 20);
      const plus = r() < 0.5;
      const answer = plus ? a - b : a + b;
      return {
        sum: [a, plus ? '+' : '−', -b],
        answer,
        mistakes: [-answer, plus ? a + b : a - b, answer + 1],
        negatives: true,
      };
    },
    (r) => {
      const a = between(r, -20, 20);
      const b = between(r, 1, 20);
      return {
        sum: [a, '−', b],
        answer: a - b,
        mistakes: [b - a, a + b, a - b + 1],
        negatives: true,
      };
    },
    // Small, unlike bottoms: 1/2 + 1/3.
    (r) => {
      const [d1, d2] = pick(r, [
        [2, 3],
        [2, 5],
        [3, 4],
        [2, 4],
        [3, 6],
        [4, 5],
      ] as const);
      return fractions(written(between(r, 1, d1 - 1), d1), '+', written(between(r, 1, d2 - 1), d2));
    },
    // 10, 25 or 50 percent of a round number.
    (r) => {
      const p = pick(r, [10, 25, 50]);
      return percent(p, between(r, 2, 40) * (p === 25 ? 4 : 10));
    },
  ],
  11: [
    (r) => power(between(r, 2, 15), 2),
    (r) => power(between(r, 2, 5), 3),
    (r) => root(between(r, 2, 15)),
    (r) => {
      const k = between(r, 2, 6);
      return {
        sum: [10, { power: k }],
        answer: 10 ** k,
        mistakes: [10 * k, 10 ** (k - 1), 10 ** (k + 1)],
      };
    },
    // Times and divided with negative numbers, and the mistake of the sign.
    (r) => {
      const a = between(r, 2, 12);
      const b = between(r, 2, 12);
      return r() < 0.5
        ? { sum: [-a, '×', b], answer: -a * b, mistakes: [a * b, -a * b - a], negatives: true }
        : { sum: [-a * b, '÷', -b], answer: a, mistakes: [-a, a + 1], negatives: true };
    },
  ],
  12: [
    // A sum squared, and the mistake of squaring each part: (a + b)² as a² + b².
    (r) => {
      const a = between(r, 2, 9);
      const b = between(r, 1, 9);
      const c = between(r, 1, 30);
      return {
        sum: ['(', a, '+', b, ')', { power: 2 }, '−', c],
        answer: (a + b) ** 2 - c,
        mistakes: [a * a + b * b - c, (a + b) * 2 - c, (a + b) ** 2 + c],
        negatives: true,
      };
    },
    (r) => {
      const a = between(r, 2, 9);
      const b = between(r, 2, 9);
      return {
        sum: [a, { power: 2 }, '−', b, { power: 2 }],
        answer: a * a - b * b,
        mistakes: [(a - b) ** 2, b * b - a * a, (a - b) * 2],
        negatives: true,
      };
    },
    // A product taken away, often below zero, and the mistake of working left to right.
    (r) => {
      const a = between(r, 2, 20);
      const b = between(r, 3, 9);
      const c = between(r, 3, 9);
      return {
        sum: [a, '−', b, '×', c],
        answer: a - b * c,
        mistakes: [(a - b) * c, b * c - a, a - b - c],
        negatives: true,
      };
    },
    (r) => power(-between(r, 2, 5), pick(r, [2, 3])),
  ],
  13: [
    (r) => product(between(r, 12, 99), between(r, 12, 99)),
    (r) => power(between(r, 16, 30), 2),
    // A percent of a number that is not round: 18 % of 350.
    (r) => {
      const p = pick(r, [12, 15, 18, 24, 35, 45, 65, 75, 85]);
      const unit = 100 / gcd(p, 100);
      return percent(p, unit * between(r, 2, Math.floor(900 / unit)));
    },
    // Four digits divided by one, and the slips of long division.
    (r) => {
      const by = between(r, 3, 9);
      const answer = between(r, Math.ceil(1000 / by), Math.floor(9999 / by));
      return {
        sum: [answer * by, '÷', by],
        answer,
        mistakes: [answer + 10, answer - 10, answer + 1, answer * 10],
      };
    },
  ],
  14: [
    (r) => product(between(r, 112, 499), between(r, 12, 49)),
    // A fraction times a fraction, and the mistakes of turning one over, or adding bottoms.
    (r) => {
      const a = proper(r, 9);
      const b = proper(r, 9);
      const answer = fraction(a.n * b.n, a.d * b.d);
      return {
        sum: [a, '×', b],
        answer,
        mistakes: [
          fraction(a.n * b.d, a.d * b.n),
          fraction(a.n + b.n, a.d + b.d),
          fraction(a.n * b.n, a.d + b.d),
        ],
        near: nearFor(answer),
      };
    },
    // Unlike bottoms taken away, the larger fraction first.
    (r) => {
      const a = proper(r, 12);
      const b = proper(r, 12);
      return numeric(a) < numeric(b) ? fractions(b, '−', a) : fractions(a, '−', b);
    },
    (r) => power(2, between(r, 7, 16)),
    (r) => root(between(r, 16, 50)),
  ],
  15: [
    // Powers, a bracket and the order of operations together.
    (r) => {
      const a = between(r, 2, 9);
      const b = between(r, 1, 20);
      const c = between(r, 2, 6);
      const d = between(r, 2, 9);
      return {
        sum: ['(', a, { power: 2 }, '+', b, ')', '×', c, '−', d, { power: 2 }],
        answer: (a * a + b) * c - d * d,
        mistakes: [a * a + b * c - d * d, (a * a + b) * c - d * 2, (a * 2 + b) * c - d * d],
        negatives: true,
      };
    },
    // A decimal times a decimal, and the point put in the wrong place.
    (r) => {
      const a = between(r, 11, 49);
      const b = between(r, 11, 49);
      const answer = tidy((a * b) / 100);
      return {
        sum: [a / 10, '×', b / 10],
        answer,
        mistakes: [tidy((a * b) / 10), tidy((a * b) / 1000), tidy(answer + 0.1)],
        near: nearFor(answer),
      };
    },
    // Divided by a fraction, and the mistakes of multiplying by it, or not turning it over.
    (r) => {
      const q = between(r, 3, 9);
      const p = between(r, 2, q - 1);
      const n = p * between(r, 2, 12);
      return {
        sum: [n, '÷', written(p, q)],
        answer: (n / p) * q,
        mistakes: [fraction(n * p, q), n / p, n * q],
      };
    },
    (r) => power(-between(r, 2, 6), 3),
    // An awkward percent: 37.5 % of 64.
    (r) => percent(pick(r, [12.5, 37.5, 62.5, 87.5]), 8 * between(r, 2, 40)),
  ],
};
