import { formatNumber, plural } from '../i18n/format';
import type { Translations } from '../i18n/locales';
import type { ProfileColor, Role } from './family';

const da = {
  whoIsPlaying: 'Hvem spiller?',
  welcome: (app: string) => `Velkommen til ${app}`,
  firstIntro: 'Først et par ord om dig. Bagefter kan du tilføje resten af familien, også børnene.',

  locked: 'Låst',
  enterLock: 'Skriv voksenkoden.',
  forgotPin: 'Glemt koden?',
  pinTyped: (typed: number, length: number) =>
    `${formatNumber('da', typed)} af ${formatNumber('da', length)} cifre`,
  wrongPin: 'Det var ikke den rigtige kode. Prøv igen.',
  deleteDigit: 'Slet',

  lock: 'Voksenlås',
  lockOn: 'Til',
  lockOff: 'Fra',
  lockWhy: (screen: string) =>
    `Med voksenlåsen skal en kode tastes, før en voksen vælges på »${screen}«. Så kan børnene ikke åbne voksenspil eller indstillingerne, men de skifter stadig frit mellem hinanden.`,
  turnLockOn: 'Slå voksenlåsen til',
  changeLock: 'Skift koden',
  turnLockOff: 'Slå voksenlåsen fra',
  chooseLock: 'Vælg en kode',
  chooseLockWhy: 'Vælg fire cifre, som børnene ikke kender.',
  pinMismatch: 'Koderne var ikke ens. Vælg koden igen.',
  pinAgain: 'Skriv koden igen',
  pinTip:
    'Tip: Med »Guidet adgang« på iPhone eller »Fastgør app« på Android kan børnene heller ikke forlade appen.',

  forgotWhy: 'Svar på regnestykket, så kan du vælge en ny kode eller slå voksenlåsen fra.',
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
  picture: 'Billede',
  ownPhoto: 'Vælg dit eget billede',
  yourPhoto: 'Dit eget billede',
  initial: 'Forbogstav',
  face: (number: number) => `Ansigt ${formatNumber('da', number)}`,

  family: 'Familien',
  people: (count: number) =>
    `${formatNumber('da', count)} ${plural('da', count, { one: 'person', other: 'personer' })}`,
  editProfile: (name: string) => `Ret ${name}`,
  newInFamily: 'Ny i familien',
  remove: (name: string) => `Fjern ${name}`,
  familyNote: 'Den sidste voksne bliver i familien, så længe der er børn.',
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
    welcome: (app) => `Welcome to ${app}`,
    firstIntro:
      'First, a little about you. Afterwards you can add the rest of the family, children too.',

    locked: 'Locked',
    enterLock: 'Enter the grown-ups’ code.',
    forgotPin: 'Forgot the code?',
    pinTyped: (typed, length) =>
      `${formatNumber('en', typed)} of ${formatNumber('en', length)} digits`,
    wrongPin: 'That wasn’t the right code. Try again.',
    deleteDigit: 'Delete',

    lock: 'Grown-up lock',
    lockOn: 'On',
    lockOff: 'Off',
    lockWhy: (screen) =>
      `With the grown-up lock, a code is needed before a grown-up is chosen on “${screen}”. Then the children can’t open grown-ups’ games or the settings, but they still switch freely between themselves.`,
    turnLockOn: 'Turn the grown-up lock on',
    changeLock: 'Change the code',
    turnLockOff: 'Turn the grown-up lock off',
    chooseLock: 'Choose a code',
    chooseLockWhy: 'Choose four digits the children don’t know.',
    pinMismatch: 'The codes weren’t the same. Choose the code again.',
    pinAgain: 'Enter the code again',
    pinTip:
      'Tip: With Guided Access on iPhone or App pinning on Android, the children can’t leave the app either.',

    forgotWhy: 'Answer the sum, and you can choose a new code or turn the grown-up lock off.',
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
    picture: 'Picture',
    ownPhoto: 'Choose your own picture',
    yourPhoto: 'Your own picture',
    initial: 'Initial',
    face: (number) => `Face ${formatNumber('en', number)}`,

    family: 'The family',
    people: (count) =>
      `${formatNumber('en', count)} ${plural('en', count, { one: 'person', other: 'people' })}`,
    editProfile: (name) => `Edit ${name}`,
    newInFamily: 'New in the family',
    remove: (name) => `Remove ${name}`,
    familyNote: 'The last grown-up stays in the family as long as there are children.',
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
