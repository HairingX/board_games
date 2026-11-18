import { useId } from 'react';
import { useLocale, useMessages, useSetLocale } from '../i18n/I18n';
import { isLocale, localeNames, locales } from '../i18n/locales';
import { common } from './text';
import './LanguageSelect.css';

/**
 * The app's language, as the phone's own list: each language named in itself, so it can be
 * found whatever language the app speaks now. Small where it sits in a corner.
 */
export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const { language } = useMessages(common);

  return (
    <div className={compact ? 'language language-compact' : 'language'}>
      <label htmlFor={id} className={compact ? 'visually-hidden' : undefined}>
        {language}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
      >
        {locales.map((option) => (
          <option key={option} value={option} lang={option}>
            {localeNames[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
