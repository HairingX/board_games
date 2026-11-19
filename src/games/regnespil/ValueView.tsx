import { formatNumber } from '../../i18n/format';
import { useLocale } from '../../i18n/I18n';
import type { Locale } from '../../i18n/locales';
import { isFraction, type Value } from './values';
import './regnespil.css';

/** A number as the sums write it: the language's way, with a true minus sign, as in print. */
export function formatSigned(locale: Locale, value: number): string {
  return formatNumber(locale, value).replace('-', '−');
}

/** A value in one line of text, for words about it: 12, −3,5 or 3/4. */
export function formatValue(locale: Locale, value: Value): string {
  return isFraction(value)
    ? `${formatSigned(locale, value.n)}/${formatNumber(locale, value.d)}`
    : formatSigned(locale, value);
}

/** A value as it is printed: a fraction with its top over its bottom, a minus before it. */
export function ValueView({ value }: { value: Value }) {
  const locale = useLocale();
  if (!isFraction(value)) return formatSigned(locale, value);
  return (
    <>
      {value.n < 0 && '−'}
      <span className="fraction">
        <span>{formatNumber(locale, Math.abs(value.n))}</span>
        <span>{formatNumber(locale, value.d)}</span>
      </span>
    </>
  );
}
