import { schoolGrade } from '../../family/age';
import type { Profile } from '../../family/family';
import { isHero, suggestHero, type Hero } from './heroes';
import { guides, levels, type Level } from './levels';
import { isSword, type Sword } from './swords';

/** What each player has in the math game, kept on their profile: their level, sword and hero. */
export interface PlayerSettings {
  level: Level;
  sword: Sword;
  hero: Hero;
}

/** Where a grown-up starts: hard sums and a fight with resistance, as the owner decided. */
const grownUp = { level: 13, sword: 'flamme' } as const;

/** The last grade the wooden sword is suggested for: young children get a forgiving fight. */
const woodenUntil = 2;

/**
 * Where a player starts before anything was chosen: a grown-up at level 13 with the flame
 * sword; a child at the first level that suits their school grade, by their birthday, with the
 * wooden sword until the third grade and the iron one after; a child without a birthday at
 * level 1; and the hero their profile's face suggests. Only a suggestion: it is changed on the
 * setup screen.
 */
export function suggest(player: Profile, today: Date): PlayerSettings {
  const hero = suggestHero(player);
  if (player.role === 'voksen') return { ...grownUp, hero };
  if (player.born === undefined) return { level: 1, sword: 'træ', hero };
  const grade = schoolGrade(player.born, today);
  return { level: levelFor(grade), sword: grade <= woodenUntil ? 'træ' : 'jern', hero };
}

/** The first level that suits the school grade; after school, upper-secondary level. */
function levelFor(grade: number): Level {
  for (const option of levels) {
    const guide = guides[option];
    if (typeof guide !== 'string' && guide[1] >= grade) return option;
  }
  return 13;
}

/**
 * A player's settings as saved, or undefined when nothing usable was. Settings saved before
 * heroes came get the hero the player's profile suggests.
 */
export function reviveSettings(saved: unknown, player: Profile): PlayerSettings | undefined {
  if (typeof saved !== 'object' || saved === null) return undefined;
  const { level, sword, hero } = saved as Record<string, unknown>;
  return levels.includes(level as Level) && isSword(sword)
    ? { level: level as Level, sword, hero: isHero(hero) ? hero : suggestHero(player) }
    : undefined;
}
