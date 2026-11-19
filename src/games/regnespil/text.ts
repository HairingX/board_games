import { formatNumber, genitive, plural } from '../../i18n/format';
import type { Translations } from '../../i18n/locales';
import type { Sword } from './swords';
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
  easier: 'Lettere',
  harder: 'Sværere',
  levelOf: (name: string) => `${genitive('da', name)} niveau`,
  swordOf: (name: string) => `${genitive('da', name)} sværd`,
  /** The swords by how hard a fight they make. */
  swords: { træ: 'Let', jern: 'Mellem', flamme: 'Svær' } satisfies Record<Sword, string>,
  setupTitle: 'Klar til eventyret',
  setupIntro:
    'Hver spiller har sit eget niveau til regnestykkerne og sit eget sværd til kampen: jo sværere sværd, jo stærkere monstre.',
  toFight: 'Til kamp!',
  /** The monster fought, named at the top of the fight. */
  slime: 'Slimklatten',
  attack: 'Angreb',
  defend: 'Forsvar',
  stakeDodge: 'Rigtigt: du undviger slimets angreb',
  stakeRight: 'Rigtigt: dit slag rammer slimet',
  stakeWrong: (hearts: number) =>
    `Forkert: ${formatNumber('da', hearts)} ${plural('da', hearts, { one: 'hjerte', other: 'hjerter' })} mindre`,
  fightLabel: 'Helten står over for et blåt slim i skovens lysning.',
  hearts: (left: number, of: number) =>
    `Heltens hjerter: ${formatNumber('da', left)} af ${formatNumber('da', of)}`,
  lives: (count: number) => `Slimets liv: ${formatNumber('da', count)}`,
  combo: (count: number, of: number) =>
    `Rigtige i træk: ${formatNumber('da', count)} af ${formatNumber('da', of)}`,
  won: 'Slimet er besejret!',
  lost: 'Helten er træt og hviler sig.',
  again: 'Ny kamp',
  tryAgain: 'Prøv igen',
  /** The sounds to compare while the game's sounds are chosen. */
  listen: {
    title: 'Lyttetest',
    intro:
      'Fjenderne får hver deres stemme efter deres størrelse. Slå kampmusikken til for at høre dem, som de lyder i kampen.',
    withMusic: 'Kampmusik under',
    monsters: 'Fjendernes stemmer',
    slime: 'Slim',
    troll: 'Trold',
    giant: 'Kæmpe',
  },
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
    easier: 'Easier',
    harder: 'Harder',
    levelOf: (name) => `${genitive('en', name)} level`,
    swordOf: (name) => `${genitive('en', name)} sword`,
    swords: { træ: 'Easy', jern: 'Medium', flamme: 'Hard' },
    setupTitle: 'Ready for the adventure',
    setupIntro:
      'Each player has their own level for the sums and their own sword for the fight: the harder the sword, the stronger the monsters.',
    toFight: 'To battle!',
    slime: 'The slime',
    attack: 'Attack',
    defend: 'Defend',
    stakeDodge: 'Right: you dodge the slime’s attack',
    stakeRight: 'Right: your stroke hits the slime',
    stakeWrong: (hearts) =>
      `Wrong: ${formatNumber('en', hearts)} ${plural('en', hearts, { one: 'heart', other: 'hearts' })} less`,
    fightLabel: 'The hero faces a blue slime in the forest clearing.',
    hearts: (left, of) =>
      `The hero’s hearts: ${formatNumber('en', left)} of ${formatNumber('en', of)}`,
    lives: (count) => `The slime’s lives: ${formatNumber('en', count)}`,
    combo: (count, of) =>
      `Right in a row: ${formatNumber('en', count)} of ${formatNumber('en', of)}`,
    won: 'The slime is beaten!',
    lost: 'The hero is tired and rests.',
    again: 'New fight',
    tryAgain: 'Try again',
    listen: {
      title: 'Listening test',
      intro:
        'Each enemy has a voice of its own, by its size. Turn the fight music on to hear them as they sound in the fight.',
      withMusic: 'Fight music under',
      monsters: 'The enemies’ voices',
      slime: 'Slime',
      troll: 'Troll',
      giant: 'Giant',
    },
  },
};
