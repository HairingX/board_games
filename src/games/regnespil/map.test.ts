import { describe, expect, it } from 'vitest';
import { drawScene } from '../../lib/scene/scene';
import { copperChapter, startJourney, type Journey } from './journey';
import { heroesAt, isTough, mapScene, mapSheets, roads, walkSeconds, walking } from './map';

const onRoad: Journey = { ...startJourney(1), done: ['hund'], scene: 'map' };
const atFork: Journey = { ...onRoad, at: 'sti', done: ['hund', 'sti'] };

describe('the map', () => {
  it('draws the forest from its own sheets, a monster at each step ahead, the heroes and their dog', () => {
    const scene = mapScene(onRoad, 'Knight');
    for (const draw of drawScene(scene, 3)) expect(mapSheets).toHaveProperty(draw.sheet);
    const sheets = scene.figures.map((figure) => figure.sheet);
    // Slimes, the tougher ones cross, the giant slime as a big slime, the dog and the hero.
    expect(sheets.filter((sheet) => sheet === 'slime')).toHaveLength(3);
    expect(sheets.filter((sheet) => sheet === 'slimeRage')).toHaveLength(2);
    expect(sheets.slice(-2)).toEqual(['dog', 'Knight']);
    expect(scene.figures.at(-1)).toMatchObject(
      heroesAt(copperChapter.steps.hund ?? { x: 0, y: 0 }),
    );
    // The copper dog's chest stands open where it was won over; a shut chest waits up ahead.
    expect(
      scene.things.filter((thing) => thing.sheet === 'chest').map((thing) => thing.cut.x),
    ).toEqual([16, 0]);
  });

  it('flies a flag where a monster was beaten, and opens a chest once it was', () => {
    const scene = mapScene(
      { ...atFork, done: ['hund', 'sti', 'krat', 'kiste'], at: 'kiste' },
      'Knight',
    );
    expect(scene.effects?.filter((effect) => effect.sheet === 'flag')).toHaveLength(2);
    expect(
      scene.things.filter((thing) => thing.sheet === 'chest').every((thing) => thing.cut.x === 16),
    ).toBe(true);
  });

  it('walks the heroes and the dog from their step to the next, as long as the way is', () => {
    const lasts = walkSeconds(heroesAt({ x: 72, y: 176 }), heroesAt({ x: 118, y: 148 }));
    expect(lasts).toBeCloseTo(Math.hypot(46, 28) / walking.speed);
    expect(walkSeconds({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(walking.least);
    const scene = mapScene(atFork, 'Knight', { to: 'krat', at: 5, lasts });
    const hero = scene.figures.at(-1);
    expect(hero).toMatchObject({
      ...heroesAt({ x: 118, y: 148 }),
      acts: [{ kind: 'step', lasts }],
    });
    expect(drawScene(scene, 5).find((draw) => draw.sheet === 'Knight')).toMatchObject(
      heroesAt({ x: 72, y: 176 }),
    );
  });

  it('draws the roads, those walked whole', () => {
    const walked = roads({ ...atFork, done: ['hund', 'sti', 'krat'], at: 'krat' }).filter(
      (road) => road.walked,
    );
    expect(walked).toHaveLength(2);
    expect(roads(onRoad)).toHaveLength(7);
  });

  it('tells a tougher fight from the others', () => {
    const steps = copperChapter.steps;
    expect(
      [steps.sti, steps.krat, steps.kiste, steps.træet].map((step) => step && isTough(step)),
    ).toEqual([false, true, false, false]);
  });
});
