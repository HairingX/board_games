import { describe, expect, it } from 'vitest';
import { motionTokens } from '../../ui/motion';
import {
  breathLift,
  drawScene,
  signSize,
  stageSize,
  type Effect,
  type Figure,
  type Scene,
} from './scene';

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

describe('figures acting', () => {
  const { act, bounce, sign } = motionTokens;
  const at = 100;
  /** A moment just after, past what adding seconds in binary falls short of. */
  const eps = 0.001;
  const one = (figure: Partial<Figure>, seconds: number, still = false) =>
    drawScene(
      {
        ...scene,
        ground: [],
        things: [],
        figures: [{ sheet: 'hero', x: 20, y: 20, facing: 'right', doing: 'standing', ...figure }],
      },
      seconds,
      still,
    ).find((draw) => draw.sheet === 'hero');

  it('bounces through the sheet’s four rows', () => {
    const row = (seconds: number) => one({ doing: 'bouncing' }, seconds)?.cut.y;
    expect(row(0)).toBe(0);
    expect(row(1 / bounce.framesPerSecond)).toBe(16);
    expect(row(4 / bounce.framesPerSecond)).toBe(0);
    expect(one({ doing: 'bouncing' }, 0)?.y).toBe(20);
  });

  it('lunges toward where it faces with a stroke, on the attack row', () => {
    const stroke = { acts: [{ kind: 'attack', at }] } as const;
    expect(one(stroke, at)).toMatchObject({ x: 25, cut: { y: 64 } });
    expect(one({ ...stroke, facing: 'left' }, at)?.x).toBe(15);
    expect(one({ ...stroke, facing: 'down' }, at)?.x).toBe(20);
    expect(one(stroke, at + act.attack.seconds + eps)).toMatchObject({ x: 20, cut: { y: 0 } });
  });

  it('blinks while hurt, and jumps while cheering', () => {
    const hurt = { acts: [{ kind: 'hurt', at }] } as const;
    expect(one(hurt, at)).toBeUndefined();
    expect(one(hurt, at + act.hurt.blink + eps)).toBeDefined();
    expect(one(hurt, at + act.hurt.seconds + eps)).toBeDefined();
    const cheer = { acts: [{ kind: 'cheer', at }] } as const;
    const middle = at + act.cheer.seconds / 2;
    expect(one(cheer, middle)?.y).toBe(20 - act.cheer.height - breathLift(middle));
    const after = at + act.cheer.seconds + eps;
    expect(one(cheer, after)?.y).toBe(20 - breathLift(after));
  });

  it('blinks away when it vanishes, and stays gone, also with motion stilled', () => {
    const gone = { acts: [{ kind: 'vanish', at }] } as const;
    expect(one(gone, at)).toBeUndefined();
    expect(one(gone, at + act.hurt.blink + eps)).toBeDefined();
    expect(one(gone, at + act.vanish.seconds + eps)).toBeUndefined();
    expect(one(gone, at - 1, true)).toBeUndefined();
  });

  it('charges at another figure, holds there a moment, and runs back', () => {
    const charge = { acts: [{ kind: 'charge', at, reach: 40 }] } as const;
    const { out, hold, back } = act.charge;
    expect(one(charge, at)?.x).toBe(20);
    expect(one(charge, at + out / 2)?.x).toBe(40);
    expect(one(charge, at + out + hold / 2)?.x).toBe(60);
    expect(one({ ...charge, facing: 'left' }, at + out + eps)?.x).toBe(-20);
    expect(one(charge, at + out + hold + back / 2)?.x).toBe(40);
    expect(one(charge, at + out + hold + back + eps)?.x).toBe(20);
    expect(one({ acts: [{ kind: 'charge', at }] }, at + out)?.x).toBe(20);
  });

  it('steps into place from where it was', () => {
    const stepping = { acts: [{ kind: 'step', at, from: { x: -20, y: 10 } }] } as const;
    expect(one(stepping, at + eps)).toMatchObject({ x: 0, y: 30 });
    expect(one(stepping, at + act.step.seconds / 2)).toMatchObject({ x: 10, y: 25 });
    expect(one(stepping, at + act.step.seconds + eps)).toMatchObject({ x: 20, cut: { y: 0 } });
    expect(one({ acts: [{ kind: 'step', at }] }, at + eps)?.x).toBe(20);
  });

  it('approaches slowly over its own time, and waits there', () => {
    const near = { acts: [{ kind: 'approach', at, reach: 40, lasts: 20 }] } as const;
    expect(one(near, at + 10)?.x).toBe(40);
    expect(one(near, at + 10.05)?.cut.y).toBeGreaterThanOrEqual(0);
    expect(one(near, at + 30)).toMatchObject({ x: 60, cut: { y: 0 } });
    const usual = { acts: [{ kind: 'approach', at, reach: 30 }] } as const;
    expect(one(usual, at + act.approach.seconds / 3)?.x).toBe(30);
    expect(one({ acts: [{ kind: 'approach', at }] }, at + 1)?.x).toBe(20);
  });

  it('walks through its frames while it runs, and stands while it holds', () => {
    const charge = { acts: [{ kind: 'charge', at, reach: 40 }] } as const;
    const { out } = act.charge;
    const step = 1 / motionTokens.walk.framesPerSecond;
    expect(one(charge, at + step + eps)?.cut.y).toBe(16);
    expect(one(charge, at + 2 * step + eps)?.cut.y).toBe(32);
    expect(one(charge, at + out + eps)?.cut.y).toBe(0);
    const home = { acts: [{ kind: 'return', at, reach: 30 }] } as const;
    expect(one(home, at + step + eps)?.cut.y).toBe(16);
    expect(one(home, at + act.return.seconds + eps)?.cut.y).toBe(0);
    const bouncing = { ...charge, doing: 'bouncing' } as const;
    expect(one(bouncing, at + step + eps)?.cut.y).toBe(one(bouncing, at + eps)?.cut.y);
  });

  it('is knocked backwards and over, lies a while, and gets up again', () => {
    const knocked = { acts: [{ kind: 'knocked', at }] } as const;
    const { push, fall, down, rise, drop } = act.knocked;
    expect(one(knocked, at + fall / 2)).toMatchObject({ x: 20 - push / 2 });
    expect(one(knocked, at + fall + eps)).toMatchObject({ x: 20 - push, y: 20 + drop, turn: -1 });
    expect(one({ ...knocked, facing: 'left' }, at + fall + eps)).toMatchObject({
      x: 20 + push,
      turn: 1,
    });
    const rising = one(knocked, at + fall + down + rise / 2);
    expect(rising?.x).toBe(20 - push / 2);
    expect(rising?.turn).toBeUndefined();
    expect(one(knocked, at + fall + down + rise + eps)?.x).toBe(20);
  });

  it('strikes where a run took it, stays there, and walks home', () => {
    const struck = {
      acts: [
        { kind: 'attack', at, reach: 30 },
        { kind: 'return', at: at + 1, reach: 30 },
      ],
    } as const;
    expect(one(struck, at + eps)).toMatchObject({ x: 20 + 30 + act.attack.lunge, cut: { y: 64 } });
    expect(one(struck, at + act.attack.seconds + eps)).toMatchObject({ x: 50, cut: { y: 0 } });
    expect(one(struck, at + 1 + act.return.seconds / 2)?.x).toBe(35);
    expect(one(struck, at + 1 + act.return.seconds + eps)?.x).toBe(20);
    expect(one({ acts: [{ kind: 'return', at }] }, at + eps)?.x).toBe(20);
  });

  it('falls where a run took it, and walks back home as it gets up', () => {
    const tripped = { acts: [{ kind: 'knocked', at, reach: 30 }] } as const;
    const { push, fall, down, rise } = act.knocked;
    expect(one(tripped, at)?.x).toBe(50);
    expect(one(tripped, at + fall + eps)?.x).toBe(50 - push);
    expect(one(tripped, at + fall + down + rise / 2)?.x).toBe(20 + (30 - push) / 2);
    expect(one(tripped, at + fall + down + rise + eps)?.x).toBe(20);
  });

  it('does the latest act begun, and none not yet begun', () => {
    const acts = [
      { kind: 'cheer', at: at + 1 },
      { kind: 'attack', at },
      { kind: 'hurt', at: at + 5 },
    ] as const;
    expect(one({ acts }, at)?.cut.y).toBe(64);
    expect(one({ acts }, at + 1)?.y).toBe(20 - breathLift(at + 1));
    expect(one({ acts }, at - 1)?.cut.y).toBe(0);
  });

  it('keeps still with motion stilled', () => {
    expect(one({ doing: 'bouncing', acts: [{ kind: 'attack', at }] }, at, true)).toMatchObject({
      x: 20,
      y: 20,
      cut: { x: 48, y: 0 },
    });
  });

  it('shows a sign over its head for a while', () => {
    const signed = (seconds: number) =>
      drawScene(
        {
          ...scene,
          ground: [],
          things: [],
          figures: [
            {
              sheet: 'hero',
              x: 20,
              y: 20,
              facing: 'down',
              doing: 'standing',
              sign: { sheet: 'star', at },
            },
          ],
        },
        seconds,
      ).find((draw) => draw.sheet === 'star');
    expect(signed(at - 0.1)).toBeUndefined();
    expect(signed(at)).toEqual({ sheet: 'star', cut: signSize, x: 21, y: 6 });
    expect(signed(at + sign.seconds + eps)).toBeUndefined();
  });

  it('flies an effect out in an arc and keeps it, its frames over and over, while it lasts', () => {
    const coin: Scene = {
      ...scene,
      ground: [],
      things: [],
      figures: [],
      effects: [
        {
          sheet: 'coin',
          width: 10,
          height: 10,
          frames: 4,
          x: 0,
          y: 50,
          at,
          lasts: 2,
          arc: { dx: 20, height: 16 },
        },
      ],
    };
    const { framesPerSecond, flight } = motionTokens.effect;
    expect(drawScene(coin, at + flight / 2)).toEqual([
      { sheet: 'coin', cut: expect.any(Object) as object, x: 10, y: 34 },
    ]);
    const landed = drawScene(coin, at + 5 / framesPerSecond + eps)[0];
    expect(landed?.cut.x).toBe(10);
    expect(drawScene(coin, at + 1.5)[0]).toMatchObject({ x: 20, y: 50 });
    expect(drawScene(coin, at + 2 + eps)).toEqual([]);
    const ball: Scene = {
      ...coin,
      effects: [{ ...(coin.effects?.[0] as Effect), arc: { dx: -40, height: 0, seconds: 1 } }],
    };
    expect(drawScene(ball, at + 0.5)[0]?.x).toBe(-20);
  });

  it('plays an effect’s frames over the stage, and none with motion stilled', () => {
    const withEffect: Scene = {
      ...scene,
      ground: [],
      things: [],
      figures: [],
      effects: [{ sheet: 'puff', width: 32, height: 32, frames: 2, x: 4, y: 6, at }],
    };
    const fps = motionTokens.effect.framesPerSecond;
    expect(drawScene(withEffect, at - 0.1)).toEqual([]);
    expect(drawScene(withEffect, at + 1 / fps + eps)).toEqual([
      { sheet: 'puff', cut: { x: 32, y: 0, width: 32, height: 32 }, x: 4, y: 6 },
    ]);
    expect(drawScene(withEffect, at + 2 / fps + eps)).toEqual([]);
    expect(drawScene(withEffect, at, true)).toEqual([]);
  });
});
