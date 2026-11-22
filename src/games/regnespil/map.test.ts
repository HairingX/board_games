import { describe, expect, it } from 'vitest';
import { drawScene } from '../../lib/scene/scene';
import { copperChapter, startJourney, type Journey } from './journey';
import {
  heroesAt,
  isTough,
  mapScene,
  mapSheets,
  markOver,
  roads,
  walkSeconds,
  walking,
  type Walk,
} from './map';

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
    expect(scene.figures.at(-2)).toMatchObject({ x: lead.x - 7, y: lead.y + 5 });
    expect(scene.figures.at(-1)).toMatchObject({ x: lead.x + 7, y: lead.y + 10 });
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
    const lasts = walkSeconds(heroesAt({ x: 72, y: 176 }), heroesAt({ x: 118, y: 152 }));
    expect(lasts).toBeCloseTo(Math.hypot(46, 24) / walking.speed);
    expect(walkSeconds({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(walking.least);
    const scene = mapScene(atFork, ['Knight'], { to: 'krat', at: 5, lasts });
    const hero = scene.figures.at(-1);
    expect(hero).toMatchObject({
      ...heroesAt({ x: 118, y: 152 }),
      acts: [{ kind: 'step', lasts }],
    });
    expect(drawScene(scene, 5).find((draw) => draw.sheet === 'Knight')).toMatchObject(
      heroesAt({ x: 72, y: 176 }),
    );
  });

  it('dots the roads on the ground, clear of the steps: open ones white, walked ones sand', () => {
    const dotsOf = (journey: Journey, walk?: Walk) =>
      mapScene(journey, ['Knight'], walk).things.filter((thing) => thing.cut.width <= 4);
    const fork = dotsOf(atFork);
    // The two roads from the fork, open, in white and larger; earth further on.
    const open = fork.filter((dot) => dot.cut.y === 236);
    expect(open.length).toBeGreaterThan(8);
    expect(open.every((dot) => dot.cut.width === 4)).toBe(true);
    expect(fork.filter((dot) => dot.cut.x === 84).length).toBeGreaterThan(10);
    expect(fork.filter((dot) => dot.cut.x === 20 && dot.cut.y === 20).length).toBeGreaterThan(2);
    // On their way, nothing is open.
    expect(dotsOf(atFork, { to: 'eng', at: 0, lasts: 1 }).some((dot) => dot.cut.y === 236)).toBe(
      false,
    );
    // None comes within reach of a step's middle.
    for (const dot of fork) {
      for (const step of Object.values(copperChapter.steps)) {
        const middle = { x: dot.x + dot.cut.width / 2, y: dot.y + dot.cut.height / 2 };
        expect(Math.hypot(middle.x - step.x - 8, middle.y - step.y - 8)).toBeGreaterThan(9);
      }
    }
  });

  it('tells each road as it is: open from the heroes’ step, walked, or further on', () => {
    const states = roads({ ...atFork, done: ['hund', 'sti', 'krat'], at: 'krat' }).map(
      (road) => road.state,
    );
    expect(states.filter((state) => state === 'walked')).toHaveLength(2);
    expect(states.filter((state) => state === 'open')).toHaveLength(1);
    expect(roads(onRoad)).toHaveLength(7);
  });

  it('makes what waits next hop, with a marker over its top', () => {
    const scene = mapScene(atFork, ['Knight']);
    const hopping = scene.figures.filter((figure) => figure.acts?.[0]?.kind === 'cheer');
    expect(hopping.map((figure) => figure.sheet)).toEqual(['slime', 'slimeRage']);
    // The heroes their own size: a pin over them shows where they are.
    expect(scene.figures.at(-1)?.size).toBeUndefined();
    const steps = copperChapter.steps;
    for (const [step, top] of [
      [steps.eng, 132],
      [steps.krat, 152 - 16],
      [steps.kiste, 96],
      [steps.træet, 58 - 32],
    ] as const) {
      expect(step && markOver(step).y).toBe(top);
    }
  });

  it('tells a tougher fight from the others', () => {
    const steps = copperChapter.steps;
    expect(
      [steps.sti, steps.krat, steps.kiste, steps.træet].map((step) => step && isTough(step)),
    ).toEqual([false, true, false, false]);
  });
});
