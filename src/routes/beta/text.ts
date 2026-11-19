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
  },
};
