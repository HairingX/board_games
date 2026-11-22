import { describe, expect, it } from 'vitest';
import { capital, formatLanguages, formatLongDate, formatNumber, plural, timeAgo } from './format';

const minute = 60 * 1000;
const day = 24 * 60 * minute;
const now = Date.UTC(2026, 10, 18, 12);

describe('capital', () => {
  it('begins words with a capital letter, as the language writes it', () => {
    expect(capital('da', 'ørnens rede')).toBe('Ørnens rede');
    expect(capital('en', 'the slime’s')).toBe('The slime’s');
  });
});

describe('timeAgo', () => {
  it.each([
    [0, 'lige nu'],
    [-5000, 'lige nu'],
    [30 * 1000, 'lige nu'],
    [5 * minute, 'for 5 minutter siden'],
    [3 * 60 * minute, 'for 3 timer siden'],
    [day, 'i går'],
    [4 * day, 'for 4 dage siden'],
    [65 * day, 'for 2 måneder siden'],
    [800 * day, 'for 2 år siden'],
  ])('describes %d ms ago in Danish as %j', (ago, text) => {
    expect(timeAgo('da', now - ago, now)).toBe(text);
  });

  it.each([
    [0, 'just now'],
    [5 * minute, '5 minutes ago'],
    [day, 'yesterday'],
  ])('describes %d ms ago in English as %j', (ago, text) => {
    expect(timeAgo('en', now - ago, now)).toBe(text);
  });
});

describe('formatNumber', () => {
  it('writes a number as the language does, the same each time', () => {
    expect(formatNumber('da', 1234)).toBe('1.234');
    expect(formatNumber('en', 1234)).toBe('1,234');
    expect(formatNumber('da', 5)).toBe('5');
  });
});

describe('plural', () => {
  const card = { one: 'card', other: 'cards' };

  it('picks the form that goes with the count', () => {
    expect(plural('en', 1, card)).toBe('card');
    expect(plural('en', 0, card)).toBe('cards');
    expect(plural('da', 1, { one: 'spiller', other: 'spillere' })).toBe('spiller');
    expect(plural('da', 3, { one: 'spiller', other: 'spillere' })).toBe('spillere');
  });

  it('uses other for a form not given', () => {
    expect(plural('en', 1, { other: 'sheep' })).toBe('sheep');
  });
});

describe('formatLongDate', () => {
  it('writes the day in full', () => {
    const date = new Date(2026, 10, 18);
    expect(formatLongDate('da', date)).toBe('18. november 2026');
    expect(formatLongDate('en', date)).toBe('November 18, 2026');
  });
});

describe('formatLanguages', () => {
  it('names the languages in the language spoken, as alternatives', () => {
    expect(formatLanguages('da', ['da'])).toBe('dansk');
    expect(formatLanguages('en', ['da', 'de'])).toBe('Danish or German');
  });

  it('gives a language it cannot name by its code', () => {
    expect(formatLanguages('en', ['qq'])).toBe('qq');
  });
});
