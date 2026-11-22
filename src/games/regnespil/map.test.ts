import { describe, expect, it } from 'vitest';
import { drawScene } from '../../lib/scene/scene';
import { copperChapter, startJourney, type Journey } from './journey';
import { heroesAt, isTough, mapScene, mapSheets, roads, walkSeconds, walking } from './map';

const onRoad: Journey = { ...startJourney(1), done: ['hund'], scene: 'map' };
const atFork: Journey = { ...onRoad, at: 'sti', done: ['hund', 'sti'] };

describe('the map', () => {
  it('draws the forest from its own sheets, a monster at each step ahead, the heroes and their dog', () => {
    const scene = mapScene(onRoad, ['Knight', 'Monkey', 'Samurai']);
    for (const draw of drawScene(scene, 3)) expect(mapSheets).toHaveProperty(draw.sheet);
    const sheets = scene.figures.map((figure) => figure.sheet);
    // Slimes, the one down the detour cross and bigger, the giant slime bigger still, the dog
    // and every hero, the first leading and the others behind.
    expect(sheets.filter((sheet) => sheet === 'slime')).toHaveLength(4);
    expect(scene.figures.find((figure) => figure.sheet === 'slimeRage')).toMatchObject({ size: 2 });
    expect(scene.figures.filter((figure) => figure.size === 3)).toHaveLength(1);
    expect(sheets.slice(-4)).toEqual(['dog', 'Knight', 'Monkey', 'Samurai']);
    const lead = heroesAt(copperChapter.steps.hund ?? { x: 0, y: 0 });
    expect(scene.figures.at(-3)).toMatchObject(lead);
    expect(scene.figures.at(-2)).toMatchObject({ x: lead.x - 6, y: lead.y + 5 });
    expect(scene.figures.at(-1)).toMatchObject({ x: lead.x + 6, y: lead.y + 10 });
    // The copper dog's chest stands open where it was won over; a shut chest waits up ahead.
    expect(
      scene.things.filter((thing) => thing.sheet === 'chest').map((thing) => thing.cut.x),
    ).toEqual([16, 0]);
  });

  it('flies a flag where a monster was beaten, and opens a chest once it was', () => {
    const scene = mapScene({ ...atFork, done: ['hund', 'sti', 'krat', 'kiste'], at: 'kiste' }, [
      'Knight',
    ]);
    expect(scene.effects?.filter((effect) => effect.sheet === 'flag')).toHaveLength(2);
    expect(
      scene.things.filter((thing) => thing.sheet === 'chest').every((thing) => thing.cut.x === 16),
    ).toBe(true);
  });

  it('walks the heroes and the dog from their step to the next, as long as the way is', () => {
    const lasts = walkSeconds(heroesAt({ x: 72, y: 176 }), heroesAt({ x: 118, y: 148 }));
    expect(lasts).toBeCloseTo(Math.hypot(46, 28) / walking.speed);
    expect(walkSeconds({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(walking.least);
    const scene = mapScene(atFork, ['Knight'], { to: 'krat', at: 5, lasts });
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
