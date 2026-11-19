/*
 * How hard a fight is, chosen apart from the level of the sums: as one of three swords, so a
 * child who cannot read sees the choice. Each player has their own, kept on their profile, so
 * a child can play gently while a grown-up at the same table has a hard fight.
 */

export const swords = ['træ', 'jern', 'flamme'] as const;
export type Sword = (typeof swords)[number];

/**
 * What each sword makes of a fight: the half hearts a close or a far answer costs, and how many
 * strokes the monster takes. The wooden sword forgives "nearly" and soft monsters; the iron
 * sword is the standard; the flame sword meets tougher monsters (later, also ones that come at
 * the hero and bosses that fight back).
 */
export const swordRules: Readonly<
  Record<Sword, { close: number; far: number; lives: number; stars: number }>
> = {
  træ: { close: 0, far: 1, lives: 2, stars: 1 },
  jern: { close: 1, far: 2, lives: 3, stars: 2 },
  flamme: { close: 1, far: 2, lives: 4, stars: 3 },
};

export function isSword(value: unknown): value is Sword {
  return swords.includes(value as Sword);
}

/** How many strokes a monster takes when these players fight it together: the hardest sword's. */
export function monsterLives(chosen: readonly Sword[]): number {
  return Math.max(...chosen.map((sword) => swordRules[sword].lives));
}
