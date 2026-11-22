import type { Random } from '../../lib/random';
import type { Fraction, Value } from './values';

/*
 * What every kind of sum is made of: how it is shown, as tokens, and its answer with the
 * answers typical mistakes give.
 */

export type Operator = '+' | '−' | '×' | '÷';

/** Raises what comes before it to a power, shown small and high: 3². */
export interface Power {
  power: number;
}

/** A number of percent: 15 %. */
export interface Percent {
  percent: number;
}

/**
 * A sum as it is shown: numbers, fractions, percents, operators and brackets, a power after
 * what it raises, a square root before what it is of, and "of", as in "3/4 of 20" or
 * "15 % of 200".
 */
export type Token = number | Fraction | Percent | Operator | '(' | ')' | Power | '√' | 'of';

/** A sum, its answer, and the answers typical mistakes give, likeliest first. */
export interface Made {
  sum: Token[];
  answer: Value;
  mistakes: Value[];
  /** Whether answers below zero may be offered: only once negative numbers are taught. */
  negatives?: boolean;
  /** How near a wrong answer is still close; by default within 2, or a tenth of the answer. */
  near?: number;
  /**
   * Whether the mistakes are in the answer's size itself, as moving the point, so finding the
   * right size is the sum; then wrong answers far from the right one in size are kept.
   */
  sized?: boolean;
}

/** A kind of sum: made afresh, at random, each time. */
export type Kind = (random: Random) => Made;

/** A whole number from `from` to `to`, both included. */
export function between(random: Random, from: number, to: number): number {
  return from + Math.floor(random() * (to - from + 1));
}

export function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}
