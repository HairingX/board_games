import { motionTokens } from '../../ui/motion';

/*
 * A scene of the puppet theatre, as data: a ground of 16-pixel tiles, things standing on it,
 * and figures, on a small stage of pixels that is drawn enlarged by a whole number. What is
 * drawn at a moment is worked out here, apart from drawing it, so it can be tested.
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

/** A figure, drawn from a sprite sheet of 16-pixel frames. */
export interface Figure {
  sheet: string;
  x: number;
  y: number;
  facing: Facing;
  /** What it does: for now it stands, breathing. */
  doing: 'standing';
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
}

/** One image to draw: a cut of a sheet, at a place on the stage. */
export interface Draw {
  sheet: string;
  cut: Cut;
  x: number;
  y: number;
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

/**
 * Everything to draw at a moment, `seconds` since the scene began, in order: the ground, then
 * things and figures from the back of the stage to the front, so what stands nearer covers
 * what stands behind it.
 */
export function drawScene(scene: Scene, seconds: number): Draw[] {
  const ground = scene.ground.flatMap((row, y) =>
    row.map(([column, line], x) => ({
      sheet: scene.groundSheet,
      cut: { x: column * tile, y: line * tile, width: tile, height: tile },
      x: x * tile,
      y: y * tile,
    })),
  );
  const standing = [
    ...scene.things.map((thing) => ({ ...thing, foot: thing.y + thing.cut.height })),
    ...scene.figures.map((figure) => ({
      sheet: figure.sheet,
      cut: { x: facings.indexOf(figure.facing) * tile, y: 0, width: tile, height: tile },
      x: figure.x,
      y: figure.y - breathLift(seconds),
      foot: figure.y + tile,
    })),
  ].sort((a, b) => a.foot - b.foot);
  return [...ground, ...standing.map(({ sheet, cut, x, y }) => ({ sheet, cut, x, y }))];
}
