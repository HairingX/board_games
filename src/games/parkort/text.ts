import { formatNumber, plural } from '../../i18n/format';
import type { Translations } from '../../i18n/locales';
import type { Mode } from './deck';

/** Parkort's screens; the questions themselves are in cards.ts. */
const da = {
  intro:
    'Vend et kort, læs spørgsmålet højt, og svar begge to. Der er ingen rigtige svar – kun gode samtaler.',
  progress: 'Fremskridt',
  talkedAbout: (total: number) => `${plural('da', total, { other: 'kort' })} snakket om`,
  waiting: (count: number) => `${formatNumber('da', count)} kort venter til senere`,
  lastPlayed: (when: string) => `Sidst spillet ${when}`,
  categories: 'Kategorier',
  order: 'Rækkefølge',
  modes: { blandet: 'Blandet', 'let-til-dyb': 'Let til dyb' } satisfies Record<Mode, string>,
  carryOn: 'Fortsæt hvor I slap',
  chooseOne: 'Vælg mindst én kategori.',
  restart: 'Start forfra',
  restartQuestion: 'Alle kort bliver blandet igen, og I starter fra første kort. Er I sikre?',
  yesRestart: 'Ja, start forfra',

  doneTitle: 'Godt snakket!',
  doneAll: (total: number) =>
    `I har været alle ${formatNumber('da', total)} kort i de valgte kategorier igennem.`,
  doneAgain:
    'Tag gerne en ny runde om et stykke tid. Svarene ændrer sig, ligesom I gør, og de samme spørgsmål giver nye samtaler.',
  newRound: 'Bland og start en ny runde',
  previousCard: 'Forrige kort',
  otherCategories: 'Vælg andre kategorier',

  turnCard: 'Vend kortet',
  lookingBack: (next: string) => `Et kort, I har haft. Tryk »${next}« for at gå frem igen.`,
  readAloud: 'Læs kortet højt, og svar begge to.',
  putAtBottom: 'Kortet ligger nu nederst i bunken.',
  tapToTurn: 'Tryk på kortet for at vende det.',
  previous: 'Forrige',
  next: 'Næste kort',
  later: 'Tag den senere',
};

export const text: Translations<typeof da> = {
  da,
  en: {
    intro:
      'Turn a card, read the question aloud, and both of you answer. There are no right answers – only good conversations.',
    progress: 'Progress',
    talkedAbout: (total) => `${plural('en', total, { one: 'card', other: 'cards' })} talked about`,
    waiting: (count) =>
      `${formatNumber('en', count)} ${plural('en', count, { one: 'card', other: 'cards' })} saved for later`,
    lastPlayed: (when) => `Last played ${when}`,
    categories: 'Categories',
    order: 'Order',
    modes: { blandet: 'Mixed', 'let-til-dyb': 'Light to deep' },
    carryOn: 'Carry on where you left off',
    chooseOne: 'Choose at least one category.',
    restart: 'Start over',
    restartQuestion:
      'All the cards are shuffled again, and you start from the first card. Are you sure?',
    yesRestart: 'Yes, start over',

    doneTitle: 'Lovely talks!',
    doneAll: (total) =>
      `You have been through all ${formatNumber('en', total)} cards in the chosen categories.`,
    doneAgain:
      'Have another round some time. Your answers change as you do, and the same questions bring new conversations.',
    newRound: 'Shuffle and start a new round',
    previousCard: 'Previous card',
    otherCategories: 'Choose other categories',

    turnCard: 'Turn the card',
    lookingBack: (next) => `A card you have had. Tap “${next}” to go forward again.`,
    readAloud: 'Read the card aloud, and both of you answer.',
    putAtBottom: 'The card is now at the bottom of the pile.',
    tapToTurn: 'Tap the card to turn it.',
    previous: 'Previous',
    next: 'Next card',
    later: 'Save it for later',
  },
};
