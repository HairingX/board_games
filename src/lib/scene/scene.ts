import { motionTokens } from '../../ui/motion';

/*
 * A scene of the puppet theatre, as data: a ground of 16-pixel tiles, things standing on it,
 * figures that stand, bounce and act, signs over their heads, and effects such as a sword's
 * sweep, on a small stage of pixels drawn enlarged by a whole number. What is drawn at a moment
 * is worked out here, apart from drawing it, so it can be tested. Times are in seconds on one
 * clock: an act or a sign holds the moment it began, and plays out from there.
 */

/** The size of a tile, and of a figure's frame, in pixels. */
export const tile = 16;

/** A part of an image: where it is in the image, in pixels, and how big. */
export interface Cut {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Which way a figure faces: the columns of the pack's sprite sheets, in this order. */
export const facings = ['down', 'up', 'left', 'right'] as const;
export type Facing = (typeof facings)[number];

/** Something standing on the ground, such as a tree or a bush. */
export interface Thing {
  /** The image it is cut from, by the name the scene gives it. */
  sheet: string;
  cut: Cut;
  /** Where its top left corner stands on the stage, in pixels; it may stand partly off it. */
  x: number;
  y: number;
}

/** What a figure does once, from the moment `at`. */
export interface Act {
  kind: keyof typeof motionTokens.act;
  at: number;
  /**
   * How far a charge runs, in pixels, toward where the figure faces; for any other act, how
   * far out the figure is as it begins, so it strikes or falls there; and it walks home after
   * a stroke with a `return`, or as it gets up after being knocked over.
   */
  reach?: number;
  /** How long an approach takes, in seconds. */
  lasts?: number;
  /** Where a figure stepping into place comes from, in pixels from its place. */
  from?: { x: number; y: number };
}

/** A figure, drawn from a sprite sheet of 16-pixel frames, a column for each way it faces. */
export interface Figure {
  sheet: string;
  x: number;
  y: number;
  facing: Facing;
  /** Standing, breathing; or bouncing through the sheet's four rows, as a slime. */
  doing: 'standing' | 'bouncing';
  /** What it does, one after another; the latest begun is the one it does now. */
  acts?: readonly Act[];
  /** A sign over its head, from a sheet of its own, shown for a while from `at`. */
  sign?: { sheet: string; at: number };
}

/** An effect played once over the stage, such as a sweep or a puff: frames side by side. */
export interface Effect {
  sheet: string;
  /** The size of each frame, and how many there are. */
  width: number;
  height: number;
  frames: number;
  x: number;
  y: number;
  at: number;
  /** How long it shows, in seconds, its frames over and over; played once without it. */
  lasts?: number;
  /**
   * Flies this far sideways (and down) in an arc this high, in pixels, as it begins, then lies
   * there; in its own time, in seconds, or the effects' usual flight.
   */
  arc?: { dx: number; dy?: number; height: number; seconds?: number };
}

export interface Scene {
  /** The stage's size in tiles. */
  columns: number;
  rows: number;
  /** The image the ground's tiles are cut from. */
  groundSheet: string;
  /** Each row of the ground, each tile as the column and row of its place in the image. */
  ground: readonly (readonly (readonly [number, number])[])[];
  things: readonly Thing[];
  figures: readonly Figure[];
  effects?: readonly Effect[];
}

/** One image to draw: a cut of a sheet, at a place on the stage. */
export interface Draw {
  sheet: string;
  cut: Cut;
  x: number;
  y: number;
  /** Quarter turns about its middle, clockwise, as a figure knocked over lies; none if absent. */
  turn?: number;
}

/** The stage's size in pixels. */
export function stageSize(scene: Scene): { width: number; height: number } {
  return { width: scene.columns * tile, height: scene.rows * tile };
}

/** How far up a standing figure is lifted at this moment, in pixels: 1 while breathing in. */
export function breathLift(seconds: number): number {
  const { every, lifted } = motionTokens.breath;
  return seconds % every < lifted ? 1 : 0;
}

/** How far into an act or a sign the moment is, in seconds; below zero before it began. */
const since = (seconds: number, at: number) => seconds - at;

/**
 * A figure as it is drawn at the moment, or nothing while it blinks or once it has vanished.
 * With motion stilled it keeps still, but an act's lasting outcome, vanishing, still shows.
 */
function drawFigure(figure: Figure, seconds: number, still: boolean): Draw | undefined {
  const { act } = motionTokens;
  const column = facings.indexOf(figure.facing);
  const begun = (figure.acts ?? []).filter((one) => one.at <= seconds);
  const current = begun.reduce<Act | undefined>(
    (latest, one) => (latest && latest.at > one.at ? latest : one),
    undefined,
  );
  const into = current ? since(seconds, current.at) : Infinity;
  const kind = current?.kind;
  const vanished = (figure.acts ?? []).some((one) => one.kind === 'vanish');
  if (vanished && still) return undefined;
  if (kind === 'vanish' && into >= act.vanish.seconds) return undefined;
  if (still) {
    return { sheet: figure.sheet, cut: frame(column, 0), x: figure.x, y: figure.y };
  }
  let row =
    figure.doing === 'bouncing' ? Math.floor(seconds * motionTokens.bounce.framesPerSecond) % 4 : 0;
  let x = figure.x;
  let y = figure.y - (figure.doing === 'standing' ? breathLift(seconds) : 0);
  const toward = figure.facing === 'left' ? -1 : figure.facing === 'right' ? 1 : 0;
  if (kind === 'attack') {
    const striking = into < act.attack.seconds;
    if (striking) row = 4;
    x += toward * ((current?.reach ?? 0) + (striking ? act.attack.lunge : 0));
  }
  const walking = (moving: boolean) => {
    if (moving && figure.doing === 'standing') {
      row = Math.floor(into * motionTokens.walk.framesPerSecond) % 4;
    }
  };
  if (kind === 'return') {
    const left = Math.max(0, 1 - into / act.return.seconds);
    x += toward * Math.round((current?.reach ?? 0) * left);
    walking(left > 0);
  }
  if (kind === 'step') {
    const left = Math.max(0, 1 - into / act.step.seconds);
    x += Math.round((current?.from?.x ?? 0) * left);
    y += Math.round((current?.from?.y ?? 0) * left);
    walking(left > 0);
  }
  if (kind === 'approach') {
    const lasts = current?.lasts ?? act.approach.seconds;
    const share = Math.min(1, into / lasts);
    x += toward * Math.round((current?.reach ?? 0) * share);
    walking(share < 1);
  }
  if (kind === 'charge') {
    const { out, hold, back } = act.charge;
    const reach = current?.reach ?? 0;
    const share = into < out ? into / out : into < out + hold ? 1 : 1 - (into - out - hold) / back;
    x += toward * Math.round(reach * Math.max(0, share));
    walking(share > 0 && share < 1);
  }
  if (kind === 'knocked') {
    const { push, fall, down, rise, drop } = act.knocked;
    const reach = current?.reach ?? 0;
    const lying = into >= fall && into < fall + down;
    const lowest = reach - push;
    const offset =
      into < fall
        ? reach - push * (into / fall)
        : lying
          ? lowest
          : lowest * Math.max(0, 1 - (into - fall - down) / rise);
    x += toward * Math.round(offset);
    if (lying) {
      return {
        sheet: figure.sheet,
        cut: frame(column, 0),
        x,
        y: figure.y + drop,
        turn: toward < 0 ? 1 : -1,
      };
    }
  }
  if (kind === 'hurt' && into < act.hurt.seconds && Math.floor(into / act.hurt.blink) % 2 === 0) {
    return undefined;
  }
  if (kind === 'cheer' && into < act.cheer.seconds) {
    y -= Math.round(Math.sin((into / act.cheer.seconds) * Math.PI) * act.cheer.height);
  }
  if (kind === 'vanish' && Math.floor(into / act.hurt.blink) % 2 === 0) return undefined;
  return { sheet: figure.sheet, cut: frame(column, row), x, y };
}

function frame(column: number, row: number): Cut {
  return { x: column * tile, y: row * tile, width: tile, height: tile };
}

/** A sign over the figure's head while it shows: its own size, centred above the figure. */
function drawSign(figure: Figure, seconds: number, size: Cut): Draw | undefined {
  if (!figure.sign) return undefined;
  const into = since(seconds, figure.sign.at);
  if (into < 0 || into >= motionTokens.sign.seconds) return undefined;
  return {
    sheet: figure.sign.sheet,
    cut: size,
    x: figure.x + Math.round((tile - size.width) / 2),
    y: figure.y - size.height - 1,
  };
}

/** An effect's frame at the moment, while it plays. */
function drawEffect(effect: Effect, seconds: number): Draw | undefined {
  const { framesPerSecond, flight } = motionTokens.effect;
  const into = since(seconds, effect.at);
  const step = Math.floor(into * framesPerSecond);
  const over = effect.lasts === undefined ? step >= effect.frames : into >= effect.lasts;
  if (into < 0 || over) return undefined;
  const index = step % effect.frames;
  let { x, y } = effect;
  if (effect.arc) {
    const done = Math.min(1, into / (effect.arc.seconds ?? flight));
    x += Math.round(effect.arc.dx * done);
    y += Math.round((effect.arc.dy ?? 0) * done - effect.arc.height * 4 * done * (1 - done));
  }
  return {
    sheet: effect.sheet,
    cut: { x: index * effect.width, y: 0, width: effect.width, height: effect.height },
    x,
    y,
  };
}

/** The size of the pack's signs over heads, its emotes. */
export const signSize: Cut = { x: 0, y: 0, width: 14, height: 13 };

/**
 * Everything to draw at a moment, in order: the ground, then things and figures from the back
 * of the stage to the front, so what stands nearer covers what stands behind it, then the signs
 * over heads and the effects on top. With `still`, as when motion is reduced, nothing moves and
 * no effects play.
 */
export function drawScene(scene: Scene, seconds: number, still = false): Draw[] {
  const ground = scene.ground.flatMap((row, y) =>
    row.map(([column, line], x) => ({
      sheet: scene.groundSheet,
      cut: { x: column * tile, y: line * tile, width: tile, height: tile },
      x: x * tile,
      y: y * tile,
    })),
  );
  const standing = [
    ...scene.things.map((thing) => ({ draw: thing, foot: thing.y + thing.cut.height })),
    ...scene.figures.map((figure) => ({
      draw: drawFigure(figure, seconds, still),
      foot: figure.y + tile,
    })),
  ].sort((a, b) => a.foot - b.foot);
  const signs = scene.figures.map((figure) => drawSign(figure, seconds, signSize));
  const effects = still ? [] : (scene.effects ?? []).map((effect) => drawEffect(effect, seconds));
  return [
    ...ground,
    ...[...standing.map(({ draw }) => draw), ...signs, ...effects].filter(
      (draw): draw is Draw => draw !== undefined,
    ),
  ].map((draw: Draw): Draw => {
    const { sheet, cut, x, y, turn } = draw;
    return turn === undefined ? { sheet, cut, x, y } : { sheet, cut, x, y, turn };
  });
}
