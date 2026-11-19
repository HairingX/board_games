/*
 * The answers' values: whole numbers and decimals as numbers, and fractions exactly, in lowest
 * terms, so 2/4 and 1/2 are one answer, never two.
 */

export interface Fraction {
  n: number;
  /** Above 1; a fraction over 1 is a whole number. */
  d: number;
}

export type Value = number | Fraction;

export function isFraction(value: Value): value is Fraction {
  return typeof value === 'object';
}

/** The greatest common divisor, never below zero. */
export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/** A number with the noise of binary fractions taken off, as 0.1 + 0.2 to 0.3. */
export function tidy(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/** The fraction n/d in lowest terms, its sign on top, or a whole number if it is one. */
export function fraction(n: number, d: number): Value {
  const divisor = gcd(n, d) * Math.sign(d);
  const top = n / divisor;
  const bottom = d / divisor;
  return bottom === 1 ? top : { n: top, d: bottom };
}

/** The value as a number, to compare by size. */
export function numeric(value: Value): number {
  return isFraction(value) ? value.n / value.d : value;
}

/** Whether two answers are the same value. */
export function same(a: Value, b: Value): boolean {
  return Math.abs(numeric(a) - numeric(b)) < 1e-9;
}

/** A value a step further on: a number by `step`, a fraction by `step` over its bottom. */
export function beside(value: Value, step: number): Value {
  return isFraction(value) ? fraction(value.n + step, value.d) : tidy(value + step);
}

/** A key that tells answers apart, as React's lists need. */
export function valueKey(value: Value): string {
  return isFraction(value) ? `${String(value.n)}/${String(value.d)}` : String(tidy(value));
}
