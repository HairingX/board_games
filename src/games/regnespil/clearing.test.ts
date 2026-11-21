import { describe, expect, it } from 'vitest';
import { stageSize } from '../../lib/scene/scene';
import { benchAt, clearing, heroAt } from './clearing';

describe('the clearing', () => {
  it('stands the heroes waiting behind the one whose turn it is, apart and on the stage', () => {
    const scene = clearing({}, { front: 'Knight', bench: [] }, 'slime');
    const { height } = stageSize(scene);
    for (const count of [1, 2, 3]) {
      const places = benchAt(count);
      expect(places).toHaveLength(count);
      expect(new Set(places.map((place) => place.y)).size).toBe(count);
      for (const place of places) {
        expect(place.x).toBeLessThan(heroAt.x);
        expect(place.y).toBeGreaterThan(0);
        expect(place.y + 16).toBeLessThan(height);
      }
    }
  });

  it('draws the party and the slime, each as staged', () => {
    const scene = clearing(
      { bench: { mille: { acts: [{ kind: 'cheer', at: 1 }] } } },
      {
        front: 'Knight',
        bench: [
          { id: 'mille', hero: 'Samurai' },
          { id: 'far', hero: 'Monkey' },
        ],
      },
      'slimeRage',
    );
    expect(scene.figures.map((figure) => figure.sheet)).toEqual([
      'Samurai',
      'Monkey',
      'Knight',
      'slimeRage',
    ]);
    expect(scene.figures[0]?.acts).toEqual([{ kind: 'cheer', at: 1 }]);
    expect(scene.figures[1]?.acts).toBeUndefined();
  });
});
