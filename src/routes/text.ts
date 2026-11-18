import { formatLongDate, formatNumber, plural } from '../i18n/format';
import type { Translations } from '../i18n/locales';

/** The app around the games: its home screen, how games are saved, and the language. */
const da = {
  loadFailed: 'Spillet kunne ikke hentes.',
  loading: 'Henter spillet…',
  noSuchGame: 'Det spil findes ikke.',

  switchPlayer: 'Skift spiller',
  newVersion: (app: string) => `Der er en ny version af ${app}.`,
  update: 'Opdatér',
  offline: 'Virker uden internet',
  tagline: 'Små spil til sofaen, middagsbordet og køreturen.',
  noGames: 'Spillene er på vej.',
  soon: 'Kommer snart',
  /** On a game's tile when its content is written in other languages: "På dansk". */
  writtenIn: (languages: string) => `På ${languages}`,

  readAloud: 'Oplæsning',
  cannotSpeak: 'Denne browser kan ikke læse op.',
  noVoicesYet: 'Telefonen har ikke vist nogen stemmer. Prøv at lukke appen og åbne den igen.',
  noVoice: (language: string) =>
    `Telefonen har ingen stemme på ${language}, så spillene kan ikke læse op endnu.`,
  voices: (count: number, language: string, listen: string) =>
    `Telefonen har ${formatNumber('da', count)} ${plural('da', count, { one: 'stemme', other: 'stemmer' })} på ${language}. Tryk »${listen}« for at høre, hvordan ${plural('da', count, { one: 'den', other: 'de' })} lyder.`,
  listen: 'Lyt',
  listenTo: (name: string) => `Lyt til ${name}`,
  onPhone: 'På telefonen',
  needsInternet: 'Kræver internet',
  phoneDefault: 'telefonens valg',
  sample: 'Hvad er syv gange otte? Er det fireoghalvtreds, seksoghalvtreds eller otteoghalvtreds?',
  betterVoices:
    'Bedre stemmer hentes på telefonen. På iPhone: Indstillinger → Tilgængelighed → Oplæst indhold → Stemmer, og vælg en med »Forbedret« eller »Premium«. På Android: Indstillinger → Tekst til tale.',
  phoneLanguages: (languages: string) => `Telefonens sprog: ${languages}`,

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

    switchPlayer: 'Switch player',
    newVersion: (app) => `There is a new version of ${app}.`,
    update: 'Update',
    offline: 'Works offline',
    tagline: 'Small games for the sofa, the dinner table and the car.',
    noGames: 'The games are on their way.',
    soon: 'Coming soon',
    writtenIn: (languages) => `In ${languages}`,

    readAloud: 'Reading aloud',
    cannotSpeak: 'This browser cannot read aloud.',
    noVoicesYet: 'The phone has not shown any voices. Try closing the app and opening it again.',
    noVoice: (language) =>
      `The phone has no voice in ${language}, so the games cannot read aloud yet.`,
    voices: (count, language, listen) =>
      `The phone has ${formatNumber('en', count)} ${plural('en', count, { one: 'voice', other: 'voices' })} in ${language}. Tap “${listen}” to hear how ${plural('en', count, { one: 'it sounds', other: 'they sound' })}.`,
    listen: 'Listen',
    listenTo: (name) => `Listen to ${name}`,
    onPhone: 'On the phone',
    needsInternet: 'Needs the internet',
    phoneDefault: 'the phone’s choice',
    sample: 'What is seven times eight? Is it fifty-four, fifty-six or fifty-eight?',
    betterVoices:
      'Better voices are added on the phone. On iPhone: Settings → Accessibility → Spoken Content → Voices, and choose one marked Enhanced or Premium. On Android: Settings → Text-to-speech.',
    phoneLanguages: (languages) => `The phone’s languages: ${languages}`,

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
