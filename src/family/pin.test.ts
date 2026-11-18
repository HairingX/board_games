import { describe, expect, it } from 'vitest';
import { answers, grownUpQuestion, hashPin, pinMatches } from './pin';

describe('pin', () => {
  it('keeps the code only as a salted hash, and knows it again', async () => {
    const saved = await hashPin('2580');
    expect(JSON.stringify(saved)).not.toContain('2580');
    expect(await pinMatches('2580', saved)).toBe(true);
    expect(await pinMatches('2581', saved)).toBe(false);
  });

  it('salts each code differently', async () => {
    const one = await hashPin('1111');
    const two = await hashPin('1111');
    expect(one.salt).not.toBe(two.salt);
    expect(one.hash).not.toBe(two.hash);
  });

  it('asks a grown-up to multiply two numbers from 13 to 29', () => {
    expect(grownUpQuestion(() => 0)).toEqual({ a: 13, b: 13 });
    expect(grownUpQuestion(() => 0.999)).toEqual({ a: 29, b: 29 });
    const question = grownUpQuestion();
    expect(question.a).toBeGreaterThanOrEqual(13);
    expect(answers(question, ` ${String(question.a * question.b)} `)).toBe(true);
    expect(answers(question, '1')).toBe(false);
  });
});
