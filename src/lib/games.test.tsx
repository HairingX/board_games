import { describe, expect, it } from 'vitest';
import { far, mille, mor } from '../../tests/family';
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
