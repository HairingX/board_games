import { createContext, use, useEffect, type ReactNode } from 'react';
import { useSaved } from '../lib/useSaved';
import { bestLocale, isLocale, locales, type Locale, type Translations } from './locales';

/** The language the app speaks; Danish, the first language, where no I18nProvider says else. */
const LocaleContext = createContext<Locale>(locales[0]);
const SetLocaleContext = createContext<((locale: Locale) => void) | undefined>(undefined);

/** Where the language chosen for the app is saved on the phone. */
export const localeSaveKey = 'sprog';

/** The language saved, or the phone's own when none was chosen. */
export function reviveLocale(saved: unknown): Locale {
  return isLocale(saved) ? saved : bestLocale(navigator.languages);
}

/**
 * The language the app speaks on this phone: the phone's own, if the app speaks it, until one
 * is chosen in the app. The page's language follows it.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useSaved(localeSaveKey, reviveLocale);

  useEffect(() => {
    if (locale) document.documentElement.lang = locale;
  }, [locale]);

  if (!locale) return null;
  return (
    <LocaleContext value={locale}>
      <SetLocaleContext value={setLocale}>{children}</SetLocaleContext>
    </LocaleContext>
  );
}

/** The language the app speaks. */
export function useLocale(): Locale {
  return use(LocaleContext);
}

/** Changes the language the app speaks and saves the choice, inside an I18nProvider. */
export function useSetLocale(): (locale: Locale) => void {
  const setLocale = use(SetLocaleContext);
  if (!setLocale) throw new Error('useSetLocale is used outside an I18nProvider.');
  return setLocale;
}

/** The messages in the language the app speaks. */
export function useMessages<Messages>(translations: Translations<Messages>): Messages {
  return translations[useLocale()];
}
