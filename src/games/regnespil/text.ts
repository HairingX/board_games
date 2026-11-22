import { capital, formatNumber, genitive, plural } from '../../i18n/format';
import type { Translations } from '../../i18n/locales';
import type { Hero } from './heroes';
import type { Foe } from './monsters';
import type { Treasure } from './treasures';
import type { Telling } from './film';
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
  heroOf: (name: string) => `${genitive('da', name)} helt`,
  heroes: {
    Knight: 'Ridder',
    KnightGold: 'Guldridder',
    Samurai: 'Samurai',
    NinjaBlue2: 'Blå ninja',
    NinjaRed: 'Rød ninja',
    NinjaGreen: 'Grøn ninja',
    NinjaYellow: 'Gul ninja',
    NinjaEskimo: 'Sneninja',
    SorcererOrange: 'Troldmand',
    Spirit: 'Ånd',
    Cavegirl2: 'Hulepige',
    Eskimo: 'Polarfarer',
    LionBoy: 'Løvedreng',
    MaskFrog: 'Frømaske',
    Monkey: 'Abe',
    Villager4: 'Landsbybarn',
  } satisfies Record<Hero, string>,
  setupTitle: 'Klar til eventyret',
  setupIntro:
    'Hver spiller har sit eget niveau til regnestykkerne og sit eget sværd til kampen: jo sværere sværd, jo stærkere monstre.',
  /** The monster fought, named at the top of the fight. */
  slime: 'Slimklatten',
  attack: 'Angreb',
  defend: 'Forsvar',
  /**
   * Each monster as named in a sentence: "the slime", "the slime's", and what the heroes face,
   * for screen readers.
   */
  foes: {
    slime: { the: 'slimet', its: 'slimets', facing: 'et blåt slim', strong: 'et stærkt slim' },
    giantSlime: {
      the: 'kæmpeslimet',
      its: 'kæmpeslimets',
      facing: 'et kæmpestort slim',
      strong: 'et stærkt kæmpeslim',
    },
    copperDog: {
      the: 'kobberhunden',
      its: 'kobberhundens',
      facing: 'en sur hund med øjne så store som tekopper',
      strong: 'en stærk kobberhund',
    },
  } satisfies Record<Foe, { the: string; its: string; facing: string; strong: string }>,
  stakeDodge: (its: string) => `Rigtigt: du undviger ${its} angreb`,
  stakeRight: (the: string) => `Rigtigt: dit slag rammer ${the}`,
  stakeTreat: (the: string) => `Rigtigt: ${the} får en godbid og bliver gladere`,
  stakeFed: (the: string) => `Forkert: ${the} spiser bær og får et liv tilbage`,
  stakeShield: 'Rigtigt: dit slag rammer skjoldet og slår et stykke af',
  shieldLeft: (count: number) => `Skjoldets stykker: ${formatNumber('da', count)}`,
  boss: 'Mod kæmpeslimet',
  pickUp: 'Saml mønten op',
  purse: (name: string, count: number) =>
    `${genitive('da', name)} pung: ${formatNumber('da', count)} ${plural('da', count, { one: 'mønt', other: 'mønter' })}`,
  stakeWrong: (hearts: number) =>
    `Forkert: ${formatNumber('da', hearts)} ${plural('da', hearts, { one: 'hjerte', other: 'hjerter' })} mindre`,
  fightLabel: (facing: string) => `Helten står over for ${facing} i skovens lysning.`,
  hearts: (left: number, of: number) =>
    `Heltens hjerter: ${formatNumber('da', left)} af ${formatNumber('da', of)}`,
  lives: (its: string, count: number) => `${capital('da', its)} liv: ${formatNumber('da', count)}`,
  /** How grumpy a monster won over with treats still is, for its bar. */
  grumpy: (the: string, count: number) =>
    `${capital('da', the)} er sur: ${formatNumber('da', count)}`,
  combo: (count: number, of: number) =>
    `Rigtige i træk: ${formatNumber('da', count)} af ${formatNumber('da', of)}`,
  won: (name: string) => `${name} er besejret!`,
  befriended: (name: string) => `${name} er blevet jeres ven!`,
  /** Whether the guard charm still turns a blow aside in this fight. */
  charm: (left: number): string =>
    left > 0 ? 'Skjoldamuletten er klar' : 'Skjoldamuletten har taget et slag',
  /** The treasures, each with what it does, said plainly. */
  treasures: {
    heartJar: { name: 'Hjertekrukken', does: 'Et hjerte mere i hver kamp' },
    powerRing: { name: 'Kraftringen', does: 'Kraftslag allerede efter to rigtige i træk' },
    goldPouch: { name: 'Guldpungen', does: 'Hver mønt er to værd' },
    guardCharm: { name: 'Skjoldamuletten', does: 'Første slag i hver kamp preller af' },
  } satisfies Record<Treasure, { name: string; does: string }>,
  /** The two pools each kind of monster's names are made from (`names.ts`). */
  names: {
    slime: {
      describe: [
        'Slimede',
        'Sure',
        'Søvnige',
        'Boblende',
        'Klæbrige',
        'Glatte',
        'Gumlende',
        'Pjuskede',
        'Brummende',
        'Grinende',
      ],
      name: ['Bob', 'Svend', 'Sylvester', 'Bertil', 'Gustav', 'Klatten', 'Pip', 'Gerda', 'Kurt'],
    },
    giantSlime: {
      describe: ['Kæmpestore', 'Vældige', 'Tunge', 'Mægtige', 'Brølende', 'Bobbede', 'Gumlende'],
      name: ['Klatten', 'Bjarne', 'Bølle', 'Valdemar', 'Tykke Tove', 'Mogens', 'Gumme'],
    },
    copperDog: {
      describe: ['Brummende', 'Gnavne', 'Pjuskede', 'Snusende', 'Knurrende', 'Kvikke', 'Tossede'],
      name: ['Bamse', 'Basse', 'Kobber', 'Kvik', 'Trofast', 'Tekop', 'Fiffi'],
    },
  },
  /** The adventure: its journey, film, map, chests and end. */
  adventure: {
    start: 'Start eventyret',
    resume: 'Fortsæt eventyret',
    restart: 'Start eventyret forfra',
    restartQuestion:
      'Vil I starte eventyret forfra? Skattene fra denne tur er væk, men mønterne i pungene bliver.',
    yesRestart: 'Ja, start forfra',
    quickFight: 'En hurtig kamp',
    onward: 'Videre',
  },
  film: {
    label: 'Eventyrets film',
    skip: 'Spring over',
    shots: {
      road: 'Heltene går ad vejen gennem skoven: én, to! én, to! De møder en gammel kone med en spids hat.',
      quest:
        'Konen viser dem i billeder et hult træ, hvor der nede i hullet ligger et fyrtøj, og skatte af kobber, sølv og guld.',
      dogs: 'Men dernede vogter tre hunde, den ene større end den anden. Heltene bliver lidt bange, og konen klapper dem.',
      bark: 'Så lyder et gø, og den gamle kone skynder sig væk.',
      dog: 'Kobberhunden med øjne så store som tekopper springer frem og knurrer. Heltene gør sig klar.',
      tree: 'Heltene og deres ven kobberhunden kommer til det hule træ. Hunden snuser ved hullet, og nede i mørket lyser to øjne.',
      down: 'Heltene tager mod til sig og springer ned i hullet, og hunden springer efter. Fortsættes …',
    } satisfies Record<Telling, string>,
  },
  map: {
    label: 'Kortet over skoven, fra vejen op til det hule træ.',
    /** How many steps are left to the hollow tree, the fewest. */
    left: (count: number) => `${formatNumber('da', count)} skridt til det hule træ`,
    fight: (the: string) => `Gå videre og kæmp mod ${the}`,
    tough: (strong: string) => `Gå videre og kæmp mod ${strong}`,
    chest: 'Gå hen til kisten',
    boss: (the: string) => `Gå til det hule træ og kæmp mod ${the}`,
    sign: 'Et skilt: ad denne vej ligger en kiste',
  },
  chest: {
    open: 'Åbn kisten',
    choose: 'Vælg én skat',
    took: (name: string) => `I tog ${name}`,
  },
  end: {
    title: 'Kapitel 1 er klaret!',
    text: 'Heltene er sprunget ned i det hule træ. Næste kapitel kommer snart.',
    found: 'Skattene I fandt',
    again: 'Spil kapitlet igen',
  },
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
    heroOf: (name) => `${genitive('en', name)} hero`,
    heroes: {
      Knight: 'Knight',
      KnightGold: 'Gold knight',
      Samurai: 'Samurai',
      NinjaBlue2: 'Blue ninja',
      NinjaRed: 'Red ninja',
      NinjaGreen: 'Green ninja',
      NinjaYellow: 'Yellow ninja',
      NinjaEskimo: 'Snow ninja',
      SorcererOrange: 'Sorcerer',
      Spirit: 'Spirit',
      Cavegirl2: 'Cave girl',
      Eskimo: 'Polar traveller',
      LionBoy: 'Lion boy',
      MaskFrog: 'Frog mask',
      Monkey: 'Monkey',
      Villager4: 'Village child',
    },
    setupTitle: 'Ready for the adventure',
    setupIntro:
      'Each player has their own level for the sums and their own sword for the fight: the harder the sword, the stronger the monsters.',
    slime: 'The slime',
    attack: 'Attack',
    defend: 'Defend',
    foes: {
      slime: {
        the: 'the slime',
        its: 'the slime’s',
        facing: 'a blue slime',
        strong: 'a strong slime',
      },
      giantSlime: {
        the: 'the giant slime',
        its: 'the giant slime’s',
        facing: 'a giant slime',
        strong: 'a strong giant slime',
      },
      copperDog: {
        the: 'the copper dog',
        its: 'the copper dog’s',
        facing: 'a grumpy dog with eyes as big as teacups',
        strong: 'a strong copper dog',
      },
    },
    stakeDodge: (its) => `Right: you dodge ${its} attack`,
    stakeRight: (the) => `Right: your stroke hits ${the}`,
    stakeTreat: (the) => `Right: ${the} gets a treat and cheers up`,
    stakeFed: (the) => `Wrong: ${the} eats berries and gets a life back`,
    stakeShield: 'Right: your stroke hits the shield and breaks a piece off',
    shieldLeft: (count) => `Pieces of the shield: ${formatNumber('en', count)}`,
    boss: 'Fight the giant slime',
    pickUp: 'Pick up the coin',
    purse: (name, count) =>
      `${genitive('en', name)} purse: ${formatNumber('en', count)} ${plural('en', count, { one: 'coin', other: 'coins' })}`,
    stakeWrong: (hearts) =>
      `Wrong: ${formatNumber('en', hearts)} ${plural('en', hearts, { one: 'heart', other: 'hearts' })} less`,
    fightLabel: (facing) => `The hero faces ${facing} in the forest clearing.`,
    hearts: (left, of) =>
      `The hero’s hearts: ${formatNumber('en', left)} of ${formatNumber('en', of)}`,
    lives: (its, count) => `${capital('en', its)} lives: ${formatNumber('en', count)}`,
    grumpy: (the, count) => `${capital('en', the)} is grumpy: ${formatNumber('en', count)}`,
    combo: (count, of) =>
      `Right in a row: ${formatNumber('en', count)} of ${formatNumber('en', of)}`,
    won: (name) => `${name} is beaten!`,
    befriended: (name) => `${name} is your friend now!`,
    charm: (left) => (left > 0 ? 'The guard charm is ready' : 'The guard charm took a blow'),
    treasures: {
      heartJar: { name: 'Heart jar', does: 'One heart more in every fight' },
      powerRing: { name: 'Power ring', does: 'A power stroke after just two right in a row' },
      goldPouch: { name: 'Gold pouch', does: 'Every coin is worth two' },
      guardCharm: { name: 'Guard charm', does: 'The first blow in every fight glances off' },
    },
    names: {
      slime: {
        describe: [
          'Slimy',
          'Sulky',
          'Sleepy',
          'Bubbly',
          'Sticky',
          'Grumpy',
          'Wobbly',
          'Squishy',
          'Giggly',
          'Bouncy',
        ],
        name: ['Bob', 'Sid', 'Sam', 'Bert', 'Gus', 'Wendy', 'Gloria', 'Billy', 'Molly', 'Pip'],
      },
      giantSlime: {
        describe: ['Giant', 'Mighty', 'Massive', 'Rumbling', 'Wobbling', 'Grand', 'Gulping'],
        name: ['Gloop', 'Moe', 'Rex', 'Wally', 'Gus', 'Big Bertha', 'Monty'],
      },
      copperDog: {
        describe: ['Grumpy', 'Growly', 'Scruffy', 'Sniffy', 'Huffy', 'Bouncy', 'Barky'],
        name: ['Biscuit', 'Buster', 'Copper', 'Patch', 'Rusty', 'Teacup', 'Bramble'],
      },
    },
    adventure: {
      start: 'Start the adventure',
      resume: 'Go on with the adventure',
      restart: 'Start the adventure again',
      restartQuestion:
        'Start the adventure again? The treasures from this journey are gone, but the coins in the purses stay.',
      yesRestart: 'Yes, start again',
      quickFight: 'A quick fight',
      onward: 'Onward',
    },
    film: {
      label: 'The adventure’s film',
      skip: 'Skip',
      shots: {
        road: 'The heroes march along the road through the forest: one, two! one, two! They meet an old woman in a pointed hat.',
        quest:
          'In pictures, she shows them a hollow tree with a tinderbox down in its hole, and treasures of copper, silver and gold.',
        dogs: 'But down there, three dogs keep watch, each bigger than the last. The heroes grow a little scared, and the old woman pats them.',
        bark: 'Then a bark is heard, and the old woman hurries away.',
        dog: 'The copper dog, with eyes as big as teacups, bursts out, growling. The heroes make ready.',
        tree: 'The heroes and their friend the copper dog come to the hollow tree. The dog sniffs at the hole, and down in the dark two eyes glint.',
        down: 'The heroes take heart and jump down the hole, and the dog jumps after them. To be continued …',
      },
    },
    map: {
      label: 'The map of the forest, from the road up to the hollow tree.',
      left: (count) =>
        `${formatNumber('en', count)} ${plural('en', count, { one: 'step', other: 'steps' })} to the hollow tree`,
      fight: (the) => `Go on and fight ${the}`,
      tough: (strong) => `Go on and fight ${strong}`,
      chest: 'Go to the chest',
      boss: (the) => `Go to the hollow tree and fight ${the}`,
      sign: 'A sign: a chest lies this way',
    },
    chest: {
      open: 'Open the chest',
      choose: 'Choose one treasure',
      took: (name) => `You took the ${name.toLowerCase()}`,
    },
    end: {
      title: 'Chapter 1 is done!',
      text: 'The heroes have jumped down the hollow tree. The next chapter comes soon.',
      found: 'The treasures you found',
      again: 'Play the chapter again',
    },
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
