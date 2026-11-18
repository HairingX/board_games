import { useId } from 'react';
import { useLocale, useMessages } from '../i18n/I18n';
import { localeNames, locales, type Locale } from '../i18n/locales';
import { common } from '../ui/text';

/**
 * The language of the one on the home screen. Each language is named in itself, so it can be
 * found whatever language the app speaks now.
 */
export function LanguageChoice({ onChange }: { onChange: (locale: Locale) => void }) {
  const titleId = useId();
  const locale = useLocale();
  const { language } = useMessages(common);

  return (
    <section className="panel" aria-labelledby={titleId}>
      <h2 id={titleId}>{language}</h2>
      <div className="segmented" role="radiogroup" aria-labelledby={titleId}>
        {locales.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            lang={option}
            aria-checked={locale === option}
            onClick={() => {
              onChange(option);
            }}
          >
            {localeNames[option]}
          </button>
        ))}
      </div>
    </section>
  );
}
