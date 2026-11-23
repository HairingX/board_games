import { describe, expect, it } from 'vitest';
import { drawScene } from '../../lib/scene/scene';
import { epilogue, filmLength, filmSheets, prologue, type Shot } from './film';
import { sounds } from './sounds';
import { text } from './text';

/** Every moment of a shot, a tenth of a second apart, and a little after. */
const through = (shot: Shot) =>
  Array.from({ length: Math.ceil(shot.seconds * 10) + 5 }, (_, step) => 100 + step / 10);

describe('the films', () => {
  it('are short: half a minute before the chapter, and less at its end', () => {
    expect(filmLength(prologue)).toBeGreaterThan(20);
    expect(filmLength(prologue)).toBeLessThan(40);
    expect(filmLength(epilogue)).toBeLessThan(15);
    // No shot is long enough to tire of.
    for (const shot of [...prologue, ...epilogue]) expect(shot.seconds).toBeLessThanOrEqual(10);
  });

  it('draw every shot from their own sheets, for one hero or several', () => {
    for (const shot of [...prologue, ...epilogue]) {
      for (const party of [['Knight'], ['Knight', 'Samurai', 'Monkey']] as const) {
        const scene = shot.scene(100, party);
        for (const at of through(shot)) {
          for (const draw of drawScene(scene, at)) expect(filmSheets).toHaveProperty(draw.sheet);
        }
        expect(
          scene.figures.filter((figure) => party.includes(figure.sheet as never)),
        ).toHaveLength(party.length);
      }
    }
  });

  it('play only sounds the game has, within each shot, and tell each shot in words', () => {
    for (const shot of [...prologue, ...epilogue]) {
      for (const cue of shot.cues) {
        expect(cue.after).toBeLessThan(shot.seconds);
        if ('sound' in cue) expect(sounds).toHaveProperty(cue.sound);
      }
      for (const bubble of shot.bubbles) {
        expect(bubble.at + bubble.lasts).toBeLessThanOrEqual(shot.seconds);
        expect(bubble.pictures.length).toBeGreaterThan(0);
      }
      expect(text.da.film.shots[shot.tells]).toBeTruthy();
      expect(text.en.film.shots[shot.tells]).toBeTruthy();
    }
  });

  it('let the dog stand still, running only as it moves', () => {
    for (const shot of [...prologue, ...epilogue]) {
      for (const figure of shot.scene(100, ['Knight']).figures) {
        if (figure.sheet === 'dog') expect(figure.doing).toBe('standing');
      }
    }
  });

  it('are filmed at evening and the end at night, close on whoever acts, leaves drifting', () => {
    const lights = [...prologue, ...epilogue].map((shot) => shot.scene(100, ['Knight']).light);
    expect(lights).toEqual([...prologue.map(() => 'evening'), ...epilogue.map(() => 'night')]);
    // The old woman is shown close as she tells what lies in the hollow tree.
    const quest = (prologue[1] as Shot).scene(100, ['Knight']);
    expect(quest.camera?.start.zoom).toBe(3);
    expect(quest.effects?.some((effect) => effect.sheet === 'leaf')).toBe(true);
  });

  it('show the old woman’s pictures: the hollow tree, the three dogs, and how to win one', () => {
    const bubbles = prologue.flatMap((shot) => shot.bubbles);
    // The tree with the flame down in it; the dogs one at a time, each bigger; dog, treat, heart.
    expect(bubbles.map((bubble) => bubble.pictures.length)).toEqual([3, 1, 1, 1, 4]);
    const dogs = bubbles.slice(1, 4).map((bubble) => bubble.pictures[0]);
    expect(dogs.map((dog) => (dog && 'zoom' in dog ? dog.zoom : 0))).toEqual([2, 3, 4]);
    expect(dogs.map((dog) => (dog && 'dark' in dog ? dog.dark : false))).toEqual([
      false,
      true,
      true,
    ]);
    // One picture follows straight on the last, never leaving the box empty a moment.
    for (const [before, after] of bubbles
      .slice(1, 4)
      .map((one, index, all) => [one, all[index + 1]])) {
      if (before && after) expect(after.at).toBeCloseTo(before.at + before.lasts);
    }
  });

  it('send the old woman off in a puff of smoke, and the heroes and the dog down the hole', () => {
    const party = ['Knight', 'Samurai', 'Monkey'] as const;
    const treats = (prologue[3] as Shot).scene(100, party);
    expect(treats.effects?.some((effect) => effect.sheet === 'smoke')).toBe(true);
    const down = (epilogue[1] as Shot).scene(100, party);
    // At the end, everyone has gone down the hole, wherever they stood.
    const gone = drawScene(down, 100 + (epilogue[1] as Shot).seconds);
    expect(gone.filter((draw) => [...party, 'dog'].includes(draw.sheet))).toEqual([]);
  });
});
