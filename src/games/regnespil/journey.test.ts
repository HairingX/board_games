import { describe, expect, it } from 'vitest';
import {
  ahead,
  chestAt,
  copperChapter,
  filmSeen,
  fightWon,
  reviveJourney,
  screenOf,
  startJourney,
  stepsLeft,
  treasureChosen,
  walkTo,
  type Journey,
} from './journey';

const begun = startJourney(42);

describe('the journey through the first chapter', () => {
  it('begins with the film, then the copper dog on the road, and its chest', () => {
    expect(screenOf(begun)).toEqual({ kind: 'film' });
    const road = filmSeen(begun);
    expect(screenOf(road)).toEqual({ kind: 'fight', foe: 'copperDog', toughness: 1 });
    const friends = fightWon(road);
    expect(friends.done).toEqual(['hund']);
    const chest = screenOf(friends);
    expect(chest.kind).toBe('chest');
    // The chest offers three treasures, the same each time it is opened.
    expect(chest).toEqual(screenOf(friends));
    expect(chestAt(friends)).toHaveLength(3);
    const chosen = treasureChosen(friends, 'heartJar');
    expect(chosen).toMatchObject({ treasures: ['heartJar'], scene: 'map', done: ['hund'] });
    expect(screenOf(chosen)).toEqual({ kind: 'map' });
  });

  it('lets the heroes choose their way at the fork, the detour past a tougher slime to a chest', () => {
    const atRoad = treasureChosen(fightWon(filmSeen(begun)), 'heartJar');
    expect(ahead(atRoad)).toEqual(['sti']);
    expect(walkTo(atRoad, 'krat')).toBe(atRoad);
    const path = fightWon(walkTo(atRoad, 'sti'));
    expect(path.scene).toBe('map');
    expect(ahead(path)).toEqual(['eng', 'krat']);
    expect(ahead(walkTo(path, 'krat'))).toEqual([]);
    const thicket = walkTo(path, 'krat');
    expect(screenOf(thicket)).toEqual({ kind: 'fight', foe: 'slime', toughness: 2 });
    const toChest = walkTo(fightWon(thicket), 'kiste');
    expect(toChest.scene).toBe('chest');
    const offers = chestAt(toChest);
    expect(offers).not.toContain('heartJar');
    const found = treasureChosen(toChest, offers[0] ?? 'goldPouch');
    expect(found.done).toEqual(['hund', 'sti', 'krat', 'kiste']);
    // The detour leads back to the main road.
    expect(ahead(found)).toEqual(['lysning']);
    const meadow = fightWon(walkTo(path, 'eng'));
    expect(ahead(meadow)).toEqual(['lysning']);
  });

  it('ends at the hollow tree, its boss the giant slime', () => {
    const clearing: Journey = {
      ...begun,
      at: 'lysning',
      done: ['hund', 'sti', 'eng', 'lysning'],
      scene: 'map',
    };
    expect(stepsLeft(clearing)).toBe(1);
    expect(stepsLeft(begun)).toBe(4);
    const tree = walkTo(clearing, 'træet');
    expect(screenOf(tree)).toEqual({ kind: 'fight', foe: 'giantSlime', toughness: 1 });
    expect(fightWon(tree)).toMatchObject({ scene: 'end' });
    expect(screenOf(fightWon(tree))).toEqual({ kind: 'end' });
    // A chest that ended a chapter would end it too.
    const lastChest = {
      ...copperChapter,
      steps: { ...copperChapter.steps, kiste: { kind: 'chest', x: 0, y: 0, next: [] } },
    } as const;
    expect(
      treasureChosen({ ...begun, at: 'kiste', scene: 'chest' }, 'goldPouch', lastChest).scene,
    ).toBe('end');
  });

  it('shows the chest at a chest step, however it was saved', () => {
    expect(screenOf({ ...begun, at: 'kiste', scene: 'fight' }).kind).toBe('chest');
  });

  it('is opened again as it was saved, or begun afresh from what it does not know', () => {
    const saved = treasureChosen(fightWon(filmSeen(begun)), 'powerRing');
    expect(reviveJourney(structuredClone(saved))).toEqual(saved);
    for (const broken of [
      undefined,
      'rejse',
      { ...saved, seed: -1 },
      { ...saved, seed: 2 ** 32 },
      { ...saved, seed: 1.5 },
      { ...saved, at: 'slottet' },
      { ...saved, done: 'hund' },
      { ...saved, done: ['månen'] },
      { ...saved, treasures: ['sværd'] },
      { ...saved, treasures: 'heartJar' },
      { ...saved, scene: 'kort' },
    ]) {
      expect(reviveJourney(broken)).toBeNull();
    }
  });
});
