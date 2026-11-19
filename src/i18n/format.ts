import type { Locale, Translations } from './locales';

/*
 * Numbers, plurals, dates and times in the language's own way, by the browser's Intl, which
 * knows every language. The formatters are made once for each language and kept.
 */

function cached<Made>(make: (locale: Locale) => Made): (locale: Locale) => Made {
  const made = new Map<Locale, Made>();
  return (locale) => {
    const known = made.get(locale);
    if (known) return known;
    const fresh = make(locale);
    made.set(locale, fresh);
    return fresh;
  };
}

const numbers = cached((locale) => new Intl.NumberFormat(locale));
const percents = cached(
  (locale) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }),
);
const pluralRules = cached((locale) => new Intl.PluralRules(locale));
const longDates = cached((locale) => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }));
const relativeTimes = cached((locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }));

/** A number as the language writes it: 1.234 in Danish, 1,234 in English. */
export function formatNumber(locale: Locale, value: number): string {
  return numbers(locale).format(value);
}

/**
 * A name as the owner of something, as the language writes it: Danish "Idas", but "Jonas’"
 * after an s, x or z; English "Ida’s".
 */
export function genitive(locale: Locale, name: string): string {
  if (locale === 'en') return `${name}’s`;
  return /[sxz]$/i.test(name) ? `${name}’` : `${name}s`;
}

/** A number of percent as the language writes it: 37,5 % in Danish, 37.5% in English. */
export function formatPercent(locale: Locale, percent: number): string {
  return percents(locale).format(percent / 100);
}

/**
 * The form of a word that goes with the count, by the language's own rules. Danish and English
 * have one and other; a language with more forms adds them, and other is used for any missing.
 */
export function plural(
  locale: Locale,
  count: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string },
): string {
  return forms[pluralRules(locale).select(count)] ?? forms.other;
}

/** A day as the language writes it in full: 18. november 2026, November 18, 2026. */
export function formatLongDate(locale: Locale, date: Date): string {
  return longDates(locale).format(date);
}

const units: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

/** Under a minute ago, which Intl would call "nu", too short for "Sidst spillet nu". */
const justNow: Translations<string> = { da: 'lige nu', en: 'just now' };

/** How long ago `then` was: "lige nu", "for 5 minutter siden", "i går". */
export function timeAgo(locale: Locale, then: number, now: number): string {
  const elapsed = Math.max(0, now - then);
  const unit = units.find(([, length]) => elapsed >= length);
  return unit
    ? relativeTimes(locale).format(-Math.floor(elapsed / unit[1]), unit[0])
    : justNow[locale];
}

const andLists = cached((locale) => new Intl.ListFormat(locale, { type: 'conjunction' }));

/** Names as the language lists them together: "Patrick og Ina", "Patrick, Ina and Mille". */
export function formatList(locale: Locale, items: readonly string[]): string {
  return andLists(locale).format(items);
}

const languageNames = cached(
  (locale) => new Intl.DisplayNames(locale, { type: 'language', fallback: 'none' }),
);
const orLists = cached((locale) => new Intl.ListFormat(locale, { type: 'disjunction' }));

/**
 * Languages named in the language spoken, as alternatives: "dansk", "Danish or German". A
 * language the browser cannot name is given by its code.
 */
export function formatLanguages(locale: Locale, languages: readonly string[]): string {
  return orLists(locale).format(
    languages.map((language) => languageNames(locale).of(language) ?? language),
  );
}
