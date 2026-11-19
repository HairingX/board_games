import { describe, expect, it } from 'vitest';
import { motionTokens } from '../../ui/motion';
import { breathLift, drawScene, stageSize, type Scene } from './scene';

const cut = { x: 0, y: 0, width: 16, height: 32 };

const scene: Scene = {
  columns: 2,
  rows: 1,
  groundSheet: 'floor',
  ground: [
    [
      [0, 12],
      [3, 11],
    ],
  ],
  things: [
    { sheet: 'nature', cut, x: 0, y: -10 },
    { sheet: 'nature', cut, x: 8, y: 8 },
  ],
  figures: [{ sheet: 'hero', x: 4, y: 4, facing: 'left', doing: 'standing' }],
};

describe('stageSize', () => {
  it('is the scene’s tiles in pixels', () => {
    expect(stageSize(scene)).toEqual({ width: 32, height: 16 });
  });
});

describe('breathLift', () => {
  it('lifts a standing figure one pixel for part of each breath', () => {
    const { every, lifted } = motionTokens.breath;
    expect(breathLift(0)).toBe(1);
    expect(breathLift(lifted)).toBe(0);
    expect(breathLift(every)).toBe(1);
    expect(breathLift(every + lifted + 0.1)).toBe(0);
  });
});

describe('drawScene', () => {
  it('draws the ground tile by tile, cut from its sheet', () => {
    const [first, second] = drawScene(scene, 0);
    expect(first).toEqual({
      sheet: 'floor',
      cut: { x: 0, y: 192, width: 16, height: 16 },
      x: 0,
      y: 0,
    });
    expect(second).toEqual({
      sheet: 'floor',
      cut: { x: 48, y: 176, width: 16, height: 16 },
      x: 16,
      y: 0,
    });
  });

  it('draws what stands from the back to the front, the figure facing its way', () => {
    const standing = drawScene(scene, motionTokens.breath.lifted).slice(2);
    expect(standing.map((draw) => [draw.sheet, draw.y])).toEqual([
      ['hero', 4],
      ['nature', -10],
      ['nature', 8],
    ]);
    expect(standing[0]?.cut).toEqual({ x: 32, y: 0, width: 16, height: 16 });
  });

  it('lifts a standing figure as it breathes in', () => {
    expect(drawScene(scene, 0).find((draw) => draw.sheet === 'hero')?.y).toBe(3);
  });
});
