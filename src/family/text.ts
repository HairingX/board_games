import { formatNumber, plural } from '../i18n/format';
import type { Translations } from '../i18n/locales';
import type { ProfileColor, Role } from './family';

const da = {
  whoIsPlaying: 'Hvem spiller?',
  hasPin: 'Kode',
  enterPin: 'Skriv din kode.',
  forgotPin: 'Glemt koden?',
  welcome: (app: string) => `Velkommen til ${app}`,
  firstIntro: 'Først et par ord om dig. Bagefter kan du tilføje resten af familien, også børnene.',

  pinTyped: (typed: number, length: number) =>
    `${formatNumber('da', typed)} af ${formatNumber('da', length)} cifre`,
  wrongPin: 'Det var ikke den rigtige kode. Prøv igen.',
  deleteDigit: 'Slet',

  pinFor: (name: string) => `Kode til ${name}`,
  pinMismatch: 'Koderne var ikke ens. Vælg koden igen.',
  pinWhy: (name: string, screen: string) =>
    `Koden skal tastes, når ${name} vælges på »${screen}«. Vælg fire cifre, som børnene ikke kender.`,
  noPin: 'Ingen kode',
  pinAgain: 'Skriv koden igen',
  pinTip:
    'Tip: Med »Guidet adgang« på iPhone eller »Fastgør app« på Android kan børnene heller ikke forlade appen.',

  forgotWhy:
    'Svar på regnestykket, så kan du komme ind og vælge en ny kode, næste gang et barn skal spille.',
  forgotSum: (a: number, b: number) =>
    `Hvad er ${formatNumber('da', a)} × ${formatNumber('da', b)}?`,
  wrongAnswer: 'Det var ikke rigtigt. Prøv igen.',
  answer: 'Svar',

  name: 'Navn',
  roleChoice: 'Voksen eller barn',
  roles: { voksen: 'Voksen', barn: 'Barn' } satisfies Record<Role, string>,
  color: 'Farve',
  colors: {
    plum: 'Blomme',
    teal: 'Petrol',
    terracotta: 'Terrakotta',
    olive: 'Oliven',
    ochre: 'Okker',
    slate: 'Skifer',
  } satisfies Record<ProfileColor, string>,
  save: 'Gem',

  family: 'Familien',
  editProfile: (name: string) => `Ret ${name}`,
  newInFamily: 'Ny i familien',
  pin: 'Kode',
  changePin: 'Skift kode',
  remove: (name: string) => `Fjern ${name}`,
  familyNote:
    'En voksen med kode kan ikke vælges af børnene. Den sidste voksne bliver i familien, så længe der er børn.',
  removeQuestion: (name: string) => `Vil du fjerne ${name} fra familien?`,
  yesRemove: 'Ja, fjern',
  addToFamily: 'Tilføj en i familien',
  done: 'Færdig',

  whoIsIn: 'Hvem er med?',
  howMany: (min: number, max: number) =>
    min === max
      ? `Vælg ${formatNumber('da', min)} ${plural('da', min, { one: 'spiller', other: 'spillere' })}.`
      : `Vælg ${formatNumber('da', min)}–${formatNumber('da', max)} spillere.`,
  newPlayer: 'Ny spiller',
  addPlayer: 'Tilføj en ny spiller',
};

export const familyText: Translations<typeof da> = {
  da,
  en: {
    whoIsPlaying: 'Who’s playing?',
    hasPin: 'Code',
    enterPin: 'Enter your code.',
    forgotPin: 'Forgot the code?',
    welcome: (app) => `Welcome to ${app}`,
    firstIntro:
      'First, a little about you. Afterwards you can add the rest of the family, children too.',

    pinTyped: (typed, length) =>
      `${formatNumber('en', typed)} of ${formatNumber('en', length)} digits`,
    wrongPin: 'That wasn’t the right code. Try again.',
    deleteDigit: 'Delete',

    pinFor: (name) => `Code for ${name}`,
    pinMismatch: 'The codes weren’t the same. Choose the code again.',
    pinWhy: (name, screen) =>
      `The code is needed when ${name} is chosen on “${screen}”. Choose four digits the children don’t know.`,
    noPin: 'No code',
    pinAgain: 'Enter the code again',
    pinTip:
      'Tip: With Guided Access on iPhone or App pinning on Android, the children can’t leave the app either.',

    forgotWhy:
      'Answer the sum, and you can come in and choose a new code before a child plays next.',
    forgotSum: (a, b) => `What is ${formatNumber('en', a)} × ${formatNumber('en', b)}?`,
    wrongAnswer: 'That wasn’t right. Try again.',
    answer: 'Answer',

    name: 'Name',
    roleChoice: 'Grown-up or child',
    roles: { voksen: 'Grown-up', barn: 'Child' },
    color: 'Colour',
    colors: {
      plum: 'Plum',
      teal: 'Teal',
      terracotta: 'Terracotta',
      olive: 'Olive',
      ochre: 'Ochre',
      slate: 'Slate',
    },
    save: 'Save',

    family: 'The family',
    editProfile: (name) => `Edit ${name}`,
    newInFamily: 'New in the family',
    pin: 'Code',
    changePin: 'Change code',
    remove: (name) => `Remove ${name}`,
    familyNote:
      'The children can’t choose a grown-up who has a code. The last grown-up stays in the family as long as there are children.',
    removeQuestion: (name) => `Do you want to remove ${name} from the family?`,
    yesRemove: 'Yes, remove',
    addToFamily: 'Add someone to the family',
    done: 'Done',

    whoIsIn: 'Who’s in?',
    howMany: (min, max) =>
      min === max
        ? `Choose ${formatNumber('en', min)} ${plural('en', min, { one: 'player', other: 'players' })}.`
        : `Choose ${formatNumber('en', min)}–${formatNumber('en', max)} players.`,
    newPlayer: 'New player',
    addPlayer: 'Add a new player',
  },
};
