import { formatNumber } from '../../i18n/format';
import type { Translations } from '../../i18n/locales';
import type { Operator } from './tasks';

/** Regnespil's words. Sums are shown with the signs each language writes. */
const da = {
  level: 'Niveau',
  /** Which grade a level suits, as guidance: "ca. 1.–2. klasse". */
  grade: (from: number, to: number) =>
    from === to
      ? `ca. ${formatNumber('da', from)}. klasse`
      : `ca. ${formatNumber('da', from)}.–${formatNumber('da', to)}. klasse`,
  signs: { '+': '+', '−': '−', '×': '·', '÷': ':' } satisfies Record<Operator, string>,
  /** How a sum is read aloud by a screen reader. */
  spoken: {
    '+': 'plus',
    '−': 'minus',
    '×': 'gange',
    '÷': 'divideret med',
    '(': 'parentes',
    ')': 'parentes slut',
  } satisfies Record<Operator | '(' | ')', string>,
  right: 'Rigtigt!',
  close: (answer: string) => `Tæt på. Det rigtige svar er ${answer}.`,
  far: (answer: string) => `Det rigtige svar er ${answer}.`,
  next: 'Næste',
  tally: (right: number, total: number) =>
    `${formatNumber('da', right)} af ${formatNumber('da', total)} rigtige`,
};

export const text: Translations<typeof da> = {
  da,
  en: {
    level: 'Level',
    grade: (from, to) => `about age ${formatNumber('en', from + 6)}–${formatNumber('en', to + 7)}`,
    signs: { '+': '+', '−': '−', '×': '×', '÷': '÷' },
    spoken: {
      '+': 'plus',
      '−': 'minus',
      '×': 'times',
      '÷': 'divided by',
      '(': 'bracket',
      ')': 'close bracket',
    },
    right: 'Right!',
    close: (answer) => `Close. The right answer is ${answer}.`,
    far: (answer) => `The right answer is ${answer}.`,
    next: 'Next',
    tally: (right, total) => `${formatNumber('en', right)} of ${formatNumber('en', total)} right`,
  },
};
