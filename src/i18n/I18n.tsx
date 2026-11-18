import { createContext, use, useEffect, type ReactNode } from 'react';
import { locales, type Locale, type Translations } from './locales';

/** The language the app speaks; Danish, the first language, where no I18nProvider says else. */
const LocaleContext = createContext<Locale>(locales[0]);

/**
 * Speaks the language given to everything inside. The page's language follows it, so the phone
 * reads the text aloud and hyphenates it right.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** The language the app speaks. */
export function useLocale(): Locale {
  return use(LocaleContext);
}

/** The messages in the language the app speaks. */
export function useMessages<Messages>(translations: Translations<Messages>): Messages {
  return translations[useLocale()];
}
