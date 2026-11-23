import { describe, expect, it } from 'vitest';
import { far, mille, mor } from '../../tests/family';
import { cards } from '../games/parkort/cards';
import { newDeck } from '../games/parkort/deck';
import { journeySaveKey, startJourney } from '../games/regnespil/journey';
import { gameSaveKey, games, playerSaveKey, type GameInfo } from './games';

const parkort = games.find((game) => game.id === 'parkort') as GameInfo;
const forEach: GameInfo = {
  ...parkort,
  id: 'regnespil',
  players: { min: 1, max: 4, progress: 'hver' },
};

describe('save keys', () => {
  it('gives a group the same key whoever chose them and in whatever order', () => {
    expect(gameSaveKey(parkort, [mor, far])).toBe('parkort/far+mor');
    expect(gameSaveKey(parkort, [far, mor])).toBe('parkort/far+mor');
    expect(gameSaveKey(parkort, [far, mille])).not.toBe(gameSaveKey(parkort, [far, mor]));
  });

  it('gives each player their own key in a game where each plays for themselves', () => {
    const saveKey = gameSaveKey(forEach, [far, mille]);
    expect(saveKey).toBe('regnespil');
    expect(playerSaveKey(saveKey, mille)).toBe('regnespil/mille');
  });
});

describe('a game going', () => {
  const saved = (key: string, value: unknown) => (asked: string) =>
    Promise.resolve(asked === key ? value : undefined);

  it('is a couple’s deck once a card has been talked about', async () => {
    const going = parkort.going as NonNullable<GameInfo['going']>;
    const key = 'parkort/far+mor';
    expect(await going(saved(key, newDeck(cards)), key, [far, mor])).toBe(false);
    expect(await going(saved(key, { ...newDeck(cards), seen: ['os-to-1'] }), key, [far, mor])).toBe(
      true,
    );
    expect(await going(saved(key, undefined), key, [far, mor])).toBe(false);
  });

  it('is the group’s adventure until it has reached its end', async () => {
    const regnespil = games.find((game) => game.id === 'regnespil') as GameInfo;
    const going = regnespil.going as NonNullable<GameInfo['going']>;
    const key = journeySaveKey('regnespil', [mille, far]);
    const journey = startJourney(7);
    expect(await going(saved(key, journey), 'regnespil', [far, mille])).toBe(true);
    expect(await going(saved(key, { ...journey, scene: 'end' }), 'regnespil', [far, mille])).toBe(
      false,
    );
    expect(await going(saved(key, journey), 'regnespil', [far])).toBe(false);
  });
});
