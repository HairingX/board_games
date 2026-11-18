import { useLocale, useMessages, useSetLocale } from '../i18n/I18n';
import { localeNames, locales } from '../i18n/locales';
import { appText } from './text';

/**
 * The language the app speaks. It follows the phone until one is chosen here. Each language is
 * named in itself, so it can be found whatever language the app speaks now.
 */
export function LanguageChoice() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const { language } = useMessages(appText);

  return (
    <section className="panel" aria-labelledby="language-title">
      <h2 id="language-title">{language}</h2>
      <div className="segmented" role="radiogroup" aria-labelledby="language-title">
        {locales.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            lang={option}
            aria-checked={locale === option}
            onClick={() => {
              setLocale(option);
            }}
          >
            {localeNames[option]}
          </button>
        ))}
      </div>
    </section>
  );
}
