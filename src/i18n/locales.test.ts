import { describe, expect, it } from 'vitest';
import { bestLocale, isLocale, localeNames, locales } from './locales';

describe('locales', () => {
  it('speaks Danish and English, each named in itself', () => {
    expect(locales).toEqual(['da', 'en']);
    expect(localeNames).toEqual({ da: 'Dansk', en: 'English' });
  });

  it('picks the first of the phone’s languages the app speaks', () => {
    expect(bestLocale(['de-DE', 'en-GB', 'da'])).toBe('en');
    expect(bestLocale(['da-DK'])).toBe('da');
    expect(bestLocale(['fr', 'de'])).toBe('da');
    expect(bestLocale([])).toBe('da');
  });

  it('knows its own languages', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(1)).toBe(false);
  });
});
