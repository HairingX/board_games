/** The languages the app speaks; the first is used when the phone asks for none of them. */
export const locales = ['da', 'en'] as const;
export type Locale = (typeof locales)[number];

/** Each language's name in itself, as a language menu shows it. */
export const localeNames: Readonly<Record<Locale, string>> = { da: 'Dansk', en: 'English' };

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

/** The first of the phone's languages the app speaks, such as "en" for "en-GB"; else Danish. */
export function bestLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return locales[0];
}

/**
 * Messages for every language, the Danish ones setting the shape the others must match: the
 * same keys, and the same arguments for messages that take some.
 */
export type Translations<Messages> = Readonly<Record<Locale, Messages>>;
