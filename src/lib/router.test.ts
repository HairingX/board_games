import { describe, expect, it } from 'vitest';
import { gameHref, parseGameId } from './router';

describe('parseGameId', () => {
  it.each(['', '#', '#/', '#/ukendt', '#/spil/', '#/spil/Store-Bogstaver'])(
    'reads %j as home',
    (hash) => {
      expect(parseGameId(hash)).toBeUndefined();
    },
  );

  it.each(['#/spil/regnespil', '#/spil/regnespil/'])('reads %j as the game', (hash) => {
    expect(parseGameId(hash)).toBe('regnespil');
  });

  it('reads back the hash gameHref makes', () => {
    expect(parseGameId(gameHref('par-kort-2'))).toBe('par-kort-2');
  });
});
