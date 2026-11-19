import { describe, expect, it } from 'vitest';
import { appMeta } from '../appMeta';
import { familyText } from '../family/text';
import { about as parkortAbout } from '../games/parkort/about';
import { text as parkortText } from '../games/parkort/text';
import { games } from '../lib/games';
import { text as regnespilText } from '../games/regnespil/text';
import { appText } from '../routes/text';
import { common } from '../ui/text';
import { locales, type Translations } from './locales';

const all: Record<string, Translations<object>> = {
  common,
  familyText,
  appText,
  parkortText,
  parkortAbout,
  regnespilText,
  ...Object.fromEntries(games.map((game) => [game.id, game.about])),
};

/** Every message that is text, wherever it is in the messages, as [where, text]. */
function texts(messages: object, path = ''): [string, string][] {
  return Object.entries(messages).flatMap(([key, value]: [string, unknown]): [string, string][] => {
    const where = `${path}${key}`;
    if (typeof value === 'string') return [[where, value]];
    if (typeof value === 'object' && value !== null) return texts(value, `${where}.`);
    return [];
  });
}

describe('the messages', () => {
  it.each(Object.entries(all))('%s say something in every language', (_name, translations) => {
    for (const locale of locales) {
      for (const [where, text] of texts(translations[locale])) {
        expect(text.trim(), `${locale} ${where}`).not.toBe('');
      }
    }
  });

  it.each(Object.entries(all))('%s are English in English', (_name, translations) => {
    for (const [where, text] of texts(translations.en)) {
      expect(text.replaceAll(appMeta.name, ''), where).not.toMatch(/[æøåÆØÅ»«]/);
    }
  });
});

describe('the messages that are made from values', () => {
  const day = new Date(2026, 10, 18);

  it('fill in the values in Danish', () => {
    const t = { ...common.da, ...familyText.da, ...appText.da, ...parkortText.da };
    expect(t.countOf(1200, 1500)).toBe('1.200 af 1.500');
    expect(t.howMany(1, 1)).toBe('Vælg 1 spiller.');
    expect(t.howMany(2, 2)).toBe('Vælg 2 spillere.');
    expect(t.howMany(1, 6)).toBe('Vælg 1–6 spillere.');
    expect(t.writtenIn('engelsk')).toBe('På engelsk');
    expect(t.restored(day)).toBe('Sikkerhedskopien fra 18. november 2026 er hentet.');
    expect(t.talkedAbout(1)).toBe('kort snakket om');
    expect(t.waiting(2)).toBe('2 kort venter til senere');
  });

  it('fill in the values in English', () => {
    const t = { ...common.en, ...familyText.en, ...appText.en, ...parkortText.en };
    expect(t.countOf(1200, 1500)).toBe('1,200 of 1,500');
    expect(t.welcome('Småspil')).toBe('Welcome to Småspil');
    expect(t.pinTyped(2, 4)).toBe('2 of 4 digits');
    expect(t.lockWhy('Who’s playing?')).toMatch(/is chosen on “Who’s playing\?”\./);
    expect(t.people(1)).toBe('1 person');
    expect(t.people(3)).toBe('3 people');
    expect(t.forgotSum(17, 23)).toBe('What is 17 × 23?');
    expect(t.remove('Mille')).toBe('Remove Mille');
    expect(t.editProfile('Mille')).toBe('Edit Mille');
    expect(t.removeQuestion('Mille')).toBe('Do you want to remove Mille from the family?');
    expect(t.howMany(1, 1)).toBe('Choose 1 player.');
    expect(t.howMany(2, 2)).toBe('Choose 2 players.');
    expect(t.howMany(1, 6)).toBe('Choose 1–6 players.');

    expect(t.switchFrom('Mille')).toBe('Mille, switch player');
    expect(t.players('Mille and Oscar')).toBe('Players: Mille and Oscar');
    const r = regnespilText.en;
    expect(r.grade(0, 1)).toBe('about age 6–8');
    expect(r.close('12')).toBe('Close. The right answer is 12.');
    expect(r.far('12')).toBe('The right answer is 12.');
    expect(r.levelOf('Jonas')).toBe('Jonas’s level');
    expect(r.swordOf('Mille')).toBe('Mille’s sword');
    expect(r.hearts(4.5, 5)).toBe('The hero’s hearts: 4.5 of 5');
    expect(r.lives(1)).toBe('The slime’s lives: 1');
    expect(r.listen.option(2)).toBe('Option 2');
    expect(regnespilText.da.levelOf('Jonas')).toBe('Jonas’ niveau');
    expect(regnespilText.da.hearts(4.5, 5)).toBe('Heltens hjerter: 4,5 af 5');
    expect(regnespilText.da.grade(4, 4)).toBe('ca. 4. klasse');
    expect(t.about('Småspil')).toBe('About Småspil');
    expect(t.offline.unknown('Småspil')).toBe(
      'Småspil works offline once the app has been opened.',
    );
    expect(t.face(3)).toBe('Face 3');
    expect(t.writtenIn('Danish')).toBe('In Danish');
    expect(t.inBrowser('Småspil')).toMatch(/^Your games are saved in the browser. Add Småspil/);
    expect(t.notBackup('Småspil')).toBe('The file is not a backup from Småspil.');
    expect(t.restoreQuestion(day)).toBe(
      'The copy from November 18, 2026 replaces the games saved here now. Are you sure?',
    );
    expect(t.restored(day)).toBe('The backup from November 18, 2026 is restored.');

    expect(t.talkedAbout(1)).toBe('card talked about');
    expect(t.talkedAbout(217)).toBe('cards talked about');
    expect(t.waiting(1)).toBe('1 card saved for later');
    expect(t.waiting(3)).toBe('3 cards saved for later');
    expect(t.lastPlayed('yesterday')).toBe('Last played yesterday');
    expect(t.doneAll(217)).toBe('You have been through all 217 cards in the chosen categories.');
    expect(t.lookingBack('Next card')).toBe(
      'A card you have had. Tap “Next card” to go forward again.',
    );
  });
});

describe('the games’ names', () => {
  it.each(games.map((game) => [game.id, game] as const))(
    '%s stresses only the start of its own name',
    (_id, game) => {
      for (const locale of locales) {
        const { title, stress } = game.about[locale];
        if (stress) expect(title.startsWith(stress) && stress !== title, locale).toBe(true);
      }
    },
  );
});
