import hero from '../../../assets/ninja-adventure/Actor/Character/Boy/SpriteSheet.png';
import floor from '../../../assets/ninja-adventure/Backgrounds/Tilesets/TilesetFloor.png';
import nature from '../../../assets/ninja-adventure/Backgrounds/Tilesets/TilesetNature.png';
import type { Scene } from '../../lib/scene/scene';

/** The pictures the forest is drawn from, all from the Ninja Adventure pack. */
export const forestSheets = { floor, nature, hero } as const;

/** Plain grass, and grass with a little leaf or two in it, in the floor tiles. */
const g = [0, 12] as const;
const a = [1, 12] as const;
const b = [2, 12] as const;
const c = [3, 12] as const;
const d = [2, 11] as const;

/** Trees and bushes in the nature tiles, by where they are cut from. */
const roundTrees = { x: 64, y: 32, width: 64, height: 48 };
const pines = { x: 0, y: 32, width: 64, height: 48 };
const lightTrees = { x: 256, y: 32, width: 64, height: 48 };
const bigTree = { x: 48, y: 288, width: 48, height: 48 };
const bush = { x: 0, y: 160, width: 16, height: 16 };
const smallBush = { x: 16, y: 160, width: 16, height: 16 };
const sunflower = { x: 0, y: 176, width: 16, height: 16 };

/** A clearing in a forest, with the hero standing in the middle of it. */
export const forest: Scene = {
  columns: 10,
  rows: 9,
  groundSheet: 'floor',
  ground: [
    [g, g, g, g, g, g, g, c, g, g],
    [g, g, g, g, b, g, d, g, g, g],
    [a, g, g, d, g, d, g, d, g, g],
    [b, a, g, g, g, g, c, g, c, g],
    [g, g, g, a, b, g, g, g, g, g],
    [g, g, c, g, g, d, g, d, a, g],
    [g, d, g, g, a, g, g, g, g, b],
    [a, g, g, b, g, g, c, g, d, g],
    [g, g, d, g, g, a, g, g, g, g],
  ],
  things: [
    { sheet: 'nature', cut: roundTrees, x: -16, y: -20 },
    { sheet: 'nature', cut: pines, x: 32, y: -20 },
    { sheet: 'nature', cut: roundTrees, x: 80, y: -20 },
    { sheet: 'nature', cut: pines, x: 128, y: -20 },
    { sheet: 'nature', cut: lightTrees, x: 40, y: -8 },
    { sheet: 'nature', cut: bigTree, x: -14, y: 52 },
    { sheet: 'nature', cut: bigTree, x: 128, y: 58 },
    { sheet: 'nature', cut: bush, x: 36, y: 100 },
    { sheet: 'nature', cut: smallBush, x: 108, y: 104 },
    { sheet: 'nature', cut: sunflower, x: 124, y: 92 },
    { sheet: 'nature', cut: bigTree, x: 56, y: 112 },
    { sheet: 'nature', cut: smallBush, x: 4, y: 120 },
  ],
  figures: [{ sheet: 'hero', x: 72, y: 72, facing: 'down', doing: 'standing' }],
};
