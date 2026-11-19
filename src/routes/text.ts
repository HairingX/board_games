import { formatLongDate } from '../i18n/format';
import type { Translations } from '../i18n/locales';

/** The app around the games: its home screen, its settings, and how games are saved. */
const da = {
  loadFailed: 'Spillet kunne ikke hentes.',
  loading: 'Henter spillet…',
  noSuchGame: 'Det spil findes ikke.',
  noSuchPage: 'Den side findes ikke.',

  switchPlayer: 'Skift spiller',
  switchFrom: (name: string) => `${name}, skift spiller`,
  continue: 'Fortsæt',
  settings: 'Indstillinger',
  beta: 'Beta',
  betaNote: 'Prøv dele af spillene, der stadig bygges.',
  testPage: 'Testside',
  newVersion: (app: string) => `Der er en ny version af ${app}.`,
  update: 'Opdatér',
  about: (app: string) => `Om ${app}`,
  offline: {
    ready: '✓ Alle spil er hentet og virker uden internet.',
    fetching: 'Henter spillene, så de virker uden internet …',
    unknown: (app: string) => `${app} virker uden internet, når appen har været åbnet én gang.`,
  },
  credits:
    'Tegninger, musik og lyde fra Ninja Adventure af Pixel-boy og AAA, frigivet til alle (CC0).',
  tagline: 'Små spil til sofaen, middagsbordet og køreturen.',
  noGames: 'Spillene er på vej.',
  soon: 'Kommer snart',
  /** On a game's tile when its content is written in other languages: "På dansk". */
  writtenIn: (languages: string) => `På ${languages}`,

  savedTitle: 'Jeres gemte spil',
  kept: '✓ Telefonen gemmer jeres spil sikkert, også når der bliver trangt om pladsen.',
  installed: 'Jeres spil gemmes på telefonen, hver gang I vender et kort.',
  inBrowser: (app: string) =>
    `Jeres spil gemmes i browseren. Føj ${app} til hjemmeskærmen, så gemmes de mere sikkert, og alt virker uden internet.`,
  install: 'Føj til hjemmeskærmen',
  installSteps:
    'På iPhone og iPad: Tryk på Del-knappen, og vælg »Føj til hjemmeskærm«. I andre browsere finder du det i menuen. På iPhone har appen sine egne gemte spil, så tag en sikkerhedskopi her, og hent den i appen.',
  saveBackup: 'Gem sikkerhedskopi',
  restoreBackup: 'Hent sikkerhedskopi',
  chooseBackup: 'Vælg sikkerhedskopi',
  backupSaved: 'Sikkerhedskopien er gemt som en fil.',
  notBackup: (app: string) => `Filen er ikke en sikkerhedskopi fra ${app}.`,
  restoreQuestion: (made: Date) =>
    `Kopien fra ${formatLongDate('da', made)} erstatter de spil, der er gemt her nu. Er I sikre?`,
  yesRestore: 'Ja, hent kopien',
  restored: (made: Date) => `Sikkerhedskopien fra ${formatLongDate('da', made)} er hentet.`,
};

export const appText: Translations<typeof da> = {
  da,
  en: {
    loadFailed: 'The game could not be loaded.',
    loading: 'Loading the game…',
    noSuchGame: 'There is no such game.',
    noSuchPage: 'There is no such page.',

    switchPlayer: 'Switch player',
    switchFrom: (name) => `${name}, switch player`,
    continue: 'Continue',
    settings: 'Settings',
    beta: 'Beta',
    betaNote: 'Try parts of the games that are still being built.',
    testPage: 'Test page',
    newVersion: (app) => `There is a new version of ${app}.`,
    update: 'Update',
    about: (app) => `About ${app}`,
    offline: {
      ready: '✓ Every game is fetched and works offline.',
      fetching: 'Fetching the games, so they work offline …',
      unknown: (app) => `${app} works offline once the app has been opened.`,
    },
    credits:
      'Drawings, music and sounds from Ninja Adventure by Pixel-boy and AAA, given to everyone (CC0).',
    tagline: 'Small games for the sofa, the dinner table and the car.',
    noGames: 'The games are on their way.',
    soon: 'Coming soon',
    writtenIn: (languages) => `In ${languages}`,

    savedTitle: 'Your saved games',
    kept: '✓ The phone keeps your games safe, even when space runs low.',
    installed: 'Your games are saved on the phone every time you turn a card.',
    inBrowser: (app) =>
      `Your games are saved in the browser. Add ${app} to the home screen, and they are kept more safely, and everything works offline.`,
    install: 'Add to home screen',
    installSteps:
      'On iPhone and iPad: Tap the Share button, and choose “Add to Home Screen”. In other browsers you find it in the menu. On iPhone the app has its own saved games, so make a backup here, and restore it in the app.',
    saveBackup: 'Save a backup',
    restoreBackup: 'Restore a backup',
    chooseBackup: 'Choose a backup',
    backupSaved: 'The backup is saved as a file.',
    notBackup: (app) => `The file is not a backup from ${app}.`,
    restoreQuestion: (made) =>
      `The copy from ${formatLongDate('en', made)} replaces the games saved here now. Are you sure?`,
    yesRestore: 'Yes, restore the copy',
    restored: (made) => `The backup from ${formatLongDate('en', made)} is restored.`,
  },
};
