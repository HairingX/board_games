import { formatNumber } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import type { Token } from './tasks';
import { text } from './text';

/** A sum as the language writes it, "= ?" after it, and read aloud in words to screen readers. */
export function SumView({ sum }: { sum: readonly Token[] }) {
  const locale = useLocale();
  const t = useMessages(text);
  const shown = sum
    .map((token) => (typeof token === 'number' ? formatNumber(locale, token) : token))
    .map((token) => (token in t.signs ? t.signs[token as keyof typeof t.signs] : token))
    .join(' ')
    .replaceAll('( ', '(')
    .replaceAll(' )', ')');
  const spoken = sum
    .map((token) => (typeof token === 'number' ? formatNumber(locale, token) : t.spoken[token]))
    .join(' ');
  return (
    <p className="sum" role="img" aria-label={spoken}>
      {shown} = ?
    </p>
  );
}
