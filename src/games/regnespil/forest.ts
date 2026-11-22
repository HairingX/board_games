import floor from '../../../assets/ninja-adventure/Backgrounds/Tilesets/TilesetFloor.png';
import nature from '../../../assets/ninja-adventure/Backgrounds/Tilesets/TilesetNature.png';
import type { Scene, Thing } from '../../lib/scene/scene';

/** The pictures the forest is drawn from, all from the Ninja Adventure pack. */
export const forestSheets = { floor, nature } as const;

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

/** A clearing in a forest, with no one in it yet. */
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
    // Far to the left, leaving room for heroes waiting their turn.
    { sheet: 'nature', cut: bigTree, x: -34, y: 44 },
    { sheet: 'nature', cut: bigTree, x: 128, y: 58 },
    { sheet: 'nature', cut: bush, x: 36, y: 100 },
    { sheet: 'nature', cut: smallBush, x: 108, y: 104 },
    { sheet: 'nature', cut: sunflower, x: 124, y: 92 },
    { sheet: 'nature', cut: bigTree, x: 56, y: 112 },
    { sheet: 'nature', cut: smallBush, x: 4, y: 120 },
  ],
  figures: [],
};

/** The hollow tree of the story, at the top of the clearing, with the dark hole at its foot. */
export const holeAt = { x: 112, y: 56 };
const hollowTree: readonly Thing[] = [
  { sheet: 'nature', cut: bigTree, x: 96, y: 16 },
  { sheet: 'nature', cut: { x: 112, y: 208, width: 16, height: 16 }, ...holeAt },
];

/** Where a fight or a film takes place: the clearing, or the clearing by the hollow tree. */
export type Scenery = 'clearing' | 'tree';

/** What stands in each place. */
export const sceneries: Readonly<Record<Scenery, readonly Thing[]>> = {
  clearing: forest.things,
  tree: [...forest.things.filter((thing) => thing.x < 100 || thing.y > 40), ...hollowTree],
};
