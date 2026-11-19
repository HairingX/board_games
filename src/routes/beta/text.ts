import { formatNumber } from '../../i18n/format';
import type { Translations } from '../../i18n/locales';

/** The sound test, one of the beta pages where grown-ups try the parts still being built. */
const da = {
  title: 'Lyd',
  intro:
    'Prøv den lyd, eventyret skal have. Hører du intet på en iPhone, så tjek lydløs-knappen på siden.',
  music: 'Musik',
  stopMusic: 'Stop musikken',
  effects: 'Lydeffekter',
  voices: 'Stemmer uden ord',
  voicesNote: 'Figurerne pludrer i stedet for at tale, hver i sin egen tone.',
  tracks: { adventure: 'Eventyret begynder', forest: 'Den mørke skov', tension: 'Spænding' },
  sounds: {
    coin: 'Mønt',
    sword: 'Sværd',
    hit: 'Slag',
    magic: 'Magi',
    power: 'Kraft',
    success: 'Sejr',
  },
  characters: { hero: 'Helten', troll: 'Trolden', fairy: 'Feen' },

  tasksTitle: 'Regnestykker',
  tasksIntro:
    'Regnespillets opgaver, niveau for niveau. De forkerte svar er typiske fejl, og svaret viser med det samme, om det var rigtigt, tæt på eller langt fra.',
  fightTitle: 'Kamp',
  fightLabel: 'Helten står over for et blåt slim i skovens lysning.',
  hearts: (count: number) => `Heltens hjerter: ${formatNumber('da', count)}`,
  lives: (count: number) => `Slimets liv: ${formatNumber('da', count)}`,
  won: 'Slimet er besejret!',
  lost: 'Helten er træt og hviler sig.',
  again: 'Ny kamp',
  tryAgain: 'Prøv igen',
  sceneTitle: 'Scene',
  sceneIntro:
    'Dukketeatrets første scene: en lysning i skoven med helten, der står og trækker vejret. Tegningerne er forstørret med et helt tal, så hver pixel står skarpt.',
  sceneLabel: 'En lysning i skoven, hvor en lille helt står og trækker vejret.',
};

export const labText: Translations<typeof da> = {
  da,
  en: {
    title: 'Sound',
    intro:
      'Try the sound the adventure will have. If you hear nothing on an iPhone, check the silent switch on its side.',
    music: 'Music',
    stopMusic: 'Stop the music',
    effects: 'Sound effects',
    voices: 'Voices without words',
    voicesNote: 'The characters babble instead of speaking, each in a tone of its own.',
    tracks: { adventure: 'The adventure begins', forest: 'The dark forest', tension: 'Tension' },
    sounds: {
      coin: 'Coin',
      sword: 'Sword',
      hit: 'Hit',
      magic: 'Magic',
      power: 'Power',
      success: 'Victory',
    },
    characters: { hero: 'The hero', troll: 'The troll', fairy: 'The fairy' },

    tasksTitle: 'Sums',
    tasksIntro:
      'The math game’s tasks, level by level. The wrong answers are typical mistakes, and an answer shows at once whether it was right, close or far off.',
    fightTitle: 'Fight',
    fightLabel: 'The hero faces a blue slime in the forest clearing.',
    hearts: (count) => `The hero’s hearts: ${formatNumber('en', count)}`,
    lives: (count) => `The slime’s lives: ${formatNumber('en', count)}`,
    won: 'The slime is beaten!',
    lost: 'The hero is tired and rests.',
    again: 'New fight',
    tryAgain: 'Try again',
    sceneTitle: 'Scene',
    sceneIntro:
      'The puppet theatre’s first scene: a forest clearing with the hero standing and breathing. The drawings are enlarged by a whole number, so every pixel stays sharp.',
    sceneLabel: 'A forest clearing, where a small hero stands breathing.',
  },
};
