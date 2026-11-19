import type { ReactNode } from 'react';
import { formatPercent } from '../../i18n/format';
import { useLocale, useMessages } from '../../i18n/I18n';
import type { Token } from './sums';
import { text } from './text';
import { formatSigned, ValueView } from './ValueView';

const operators: ReadonlySet<Token> = new Set(['+', '−', '×', '÷', 'of']);

/**
 * A sum as the language writes it, "= ?" after it: fractions stacked, powers raised, a negative
 * number after an operator in brackets, as in 3 − (−5); and read aloud in words to screen
 * readers.
 */
export function SumView({ sum }: { sum: readonly Token[] }) {
  const locale = useLocale();
  const t = useMessages(text);

  const signs: Readonly<Record<string, string>> = t.signs;

  function shown(token: Token, before: Token | undefined): ReactNode {
    if (typeof token === 'string') return signs[token] ?? token;
    if (typeof token === 'number') {
      const number = formatSigned(locale, token);
      return token < 0 && before !== undefined && operators.has(before) ? `(${number})` : number;
    }
    if ('n' in token) return <ValueView value={token} />;
    if ('power' in token) return <sup className="power">{token.power}</sup>;
    return formatPercent(locale, token.percent);
  }

  /** Whether the token stands close to the one before it, with no space between. */
  const close = (token: Token, before: Token | undefined) =>
    before === undefined ||
    before === '(' ||
    before === '√' ||
    token === ')' ||
    (typeof token === 'object' && 'power' in token);

  function spoken(token: Token): string {
    if (typeof token === 'string') return t.spoken[token];
    if (typeof token === 'number') return formatSigned(locale, token);
    if ('n' in token) return t.over(formatSigned(locale, token.n), formatSigned(locale, token.d));
    if ('power' in token) return t.power(token.power);
    return t.percent(formatSigned(locale, token.percent));
  }

  return (
    <p className="sum" role="img" aria-label={sum.map(spoken).join(' ')}>
      {sum.map((token, index) => {
        const before = sum[index - 1];
        return (
          <span key={index}>
            {close(token, before) ? '' : ' '}
            {shown(token, before)}
          </span>
        );
      })}{' '}
      = ?
    </p>
  );
}
