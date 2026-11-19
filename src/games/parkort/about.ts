import type { Locale, Translations } from '../../i18n/locales';
import type { GameAbout } from '../../lib/games';

/** Parkort's name and what it is, for its tile and its screens. */
export const about: Translations<GameAbout> = {
  da: {
    title: 'Parkort',
    stress: 'Par',
    description: 'Spørgsmål der får jer til at snakke om det, der fylder.',
  },
  en: {
    title: 'Parkort',
    stress: 'Par',
    description: 'Questions that get you talking about what matters to you.',
  },
};

/** The questions are written in Danish only, for now. */
export const languages: readonly Locale[] = ['da'];
