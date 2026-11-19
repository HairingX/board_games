import { formatNumber, genitive } from '../i18n/format';
import type { Translations } from '../i18n/locales';

/** Words every screen uses. */
const da = {
  back: 'Tilbage',
  home: 'Til forsiden',
  backHome: 'Tilbage til forsiden',
  cancel: 'Annullér',
  start: 'Start',
  language: 'Sprog',
  sound: 'Lyd',
  music: 'Musik',
  effects: 'Lydeffekter',
  players: (names: string) => `Spillere: ${names}`,
  turn: (name: string) => `Nu er det ${genitive('da', name)} tur`,
  /** Said of a score or progress: "3 af 10". */
  countOf: (count: number, total: number) =>
    `${formatNumber('da', count)} af ${formatNumber('da', total)}`,
};

export const common: Translations<typeof da> = {
  da,
  en: {
    back: 'Back',
    home: 'Home',
    backHome: 'Back home',
    cancel: 'Cancel',
    start: 'Start',
    language: 'Language',
    sound: 'Sound',
    music: 'Music',
    effects: 'Sound effects',
    players: (names) => `Players: ${names}`,
    turn: (name) => `It’s ${genitive('en', name)} turn`,
    countOf: (count, total) => `${formatNumber('en', count)} of ${formatNumber('en', total)}`,
  },
};
