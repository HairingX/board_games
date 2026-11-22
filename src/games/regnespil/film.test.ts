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

  it('show the old woman’s pictures: the hollow tree and the three dogs', () => {
    const bubbles = prologue.flatMap((shot) => shot.bubbles);
    expect(bubbles).toHaveLength(2);
    expect(bubbles.at(-1)?.pictures).toHaveLength(3);
  });
});
