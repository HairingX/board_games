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
  /** Whom the levels beyond school suit. */
  beyond: { upper: 'gymnasieniveau', adult: 'for voksne', master: 'for mestre' },
  signs: { '+': '+', '−': '−', '×': '·', '÷': ':', of: 'af' } satisfies Record<
    Operator | 'of',
    string
  >,
  /** How a sum is read aloud by a screen reader. */
  spoken: {
    '+': 'plus',
    '−': 'minus',
    '×': 'gange',
    '÷': 'divideret med',
    '(': 'parentes',
    ')': 'parentes slut',
    '√': 'kvadratroden af',
    of: 'af',
  } satisfies Record<Operator | '(' | ')' | '√' | 'of', string>,
  /** A fraction read aloud, its top and bottom already written as numbers. */
  over: (top: string, bottom: string) => `${top} over ${bottom}`,
  /** A power read aloud. */
  power: (exponent: number) =>
    exponent === 2
      ? 'i anden'
      : exponent === 3
        ? 'i tredje'
        : `i ${formatNumber('da', exponent)}. potens`,
  /** A percent read aloud, its number already written. */
  percent: (number: string) => `${number} procent`,
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
    beyond: { upper: 'upper secondary', adult: 'for grown-ups', master: 'for masters' },
    signs: { '+': '+', '−': '−', '×': '×', '÷': '÷', of: 'of' },
    spoken: {
      '+': 'plus',
      '−': 'minus',
      '×': 'times',
      '÷': 'divided by',
      '(': 'bracket',
      ')': 'close bracket',
      '√': 'the square root of',
      of: 'of',
    },
    over: (top, bottom) => `${top} over ${bottom}`,
    power: (exponent) =>
      exponent === 2
        ? 'squared'
        : exponent === 3
          ? 'cubed'
          : `to the power of ${formatNumber('en', exponent)}`,
    percent: (number) => `${number} percent`,
    right: 'Right!',
    close: (answer) => `Close. The right answer is ${answer}.`,
    far: (answer) => `The right answer is ${answer}.`,
    next: 'Next',
    tally: (right, total) => `${formatNumber('en', right)} of ${formatNumber('en', total)} right`,
  },
};
