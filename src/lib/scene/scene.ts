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
  /** How long an approach, or a step from far away, takes, in seconds. */
  lasts?: number;
  /** Where a figure stepping into place comes from, in pixels from its place. */
  from?: { x: number; y: number };
  /** Done again every so many seconds, for good, as a hero cheering after a victory. */
  repeat?: number;
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
  /**
   * A big figure's frames, side by side in one row of its sheet, whichever way it faces, if it
   * is not one of the pack's 16-pixel figures; it stands on the ground at `y` + its height.
   */
  big?: {
    width: number;
    height: number;
    frames: number;
    /** Which way its frames face, if they face sideways; it is drawn mirrored to face the other. */
    faces?: 'left' | 'right';
  };
  /** How many times its size it is drawn, a whole number, so every pixel stays sharp. */
  size?: number;
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
  /**
   * How long it shows, in seconds: its frames over and over, or, with `repeat`, once every
   * `repeat` seconds; without it, played once, or with `repeat` for good.
   */
  lasts?: number;
  repeat?: number;
  /** Floats gently up and down by this many pixels, once every `every` seconds. */
  float?: { height: number; every: number };
  /**
   * Flies this far sideways (and down) in an arc this high, in pixels, as it begins, then lies
   * there; in its own time, in seconds, or the effects' usual flight.
   */
  arc?: { dx: number; dy?: number; height: number; seconds?: number };
  /**
   * Begins all over again every so many seconds, its frames turning all the while, as a leaf
   * drifting across the stage again and again.
   */
  cycle?: number;
  /** How much it shows, from 0 to 1, if it is to let what is behind it through, as light. */
  opacity?: number;
}

/** What the camera shows: the stage's point at its middle, and how many times enlarged. */
export interface View {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Where the camera looks: from its first view, moving to the next at `at` over `seconds`
 * (a cut at none), one move after another, as a film's close-ups and pans.
 */
export interface Camera {
  start: View;
  moves?: readonly { at: number; to: View; seconds: number }[];
}

/** The light over the stage: by day as it is drawn, warm at evening, or blue at night. */
export type Light = 'day' | 'evening' | 'night';

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
  /** Where the camera looks; the whole stage if not said. */
  camera?: Camera;
  light?: Light;
}

/** One image to draw: a cut of a sheet, at a place on the stage. */
export interface Draw {
  sheet: string;
  cut: Cut;
  x: number;
  y: number;
  /** Quarter turns about its middle, clockwise, as a figure knocked over lies; none if absent. */
  turn?: number;
  /** How many times its size it is drawn, about its feet, as a monster swelling with rage. */
  grow?: number;
  /** Whether it is drawn mirrored, as a figure spinning round shows its other side. */
  flip?: boolean;
  /** How much it shows, from 0 to 1, if not wholly. */
  opacity?: number;
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
  const draw = pose(figure, seconds, still);
  if (!draw) return undefined;
  // A sheet facing one way, drawn facing the other, is mirrored, and a spin mirrors it again.
  const sideways = figure.facing === 'left' || figure.facing === 'right';
  const mirrored =
    sideways && figure.big?.faces !== undefined && figure.big.faces !== figure.facing;
  const flip = mirrored !== (draw.flip ?? false);
  const grow = (draw.grow ?? 1) * (figure.size ?? 1);
  const { sheet, cut, x, y, turn } = draw;
  return {
    sheet,
    cut,
    x,
    y,
    ...(turn === undefined ? {} : { turn }),
    ...(grow === 1 ? {} : { grow }),
    ...(flip ? { flip } : {}),
  };
}

/** A figure as it is drawn at the moment, before its size and the way its sheet faces. */
function pose(figure: Figure, seconds: number, still: boolean): Draw | undefined {
  const { act } = motionTokens;
  const column = facings.indexOf(figure.facing);
  const { big } = figure;
  const tall = big?.height ?? tile;
  /** The cut of the figure's frame in this row, or a big figure's in this place in its row. */
  const cutOf = (row: number): Cut =>
    big
      ? { x: (row % big.frames) * big.width, y: 0, width: big.width, height: big.height }
      : frame(column, row);
  const begun = (figure.acts ?? []).filter((one) => one.at <= seconds);
  const current = begun.reduce<Act | undefined>(
    (latest, one) => (latest && latest.at > one.at ? latest : one),
    undefined,
  );
  const sinceBegun = current ? since(seconds, current.at) : Infinity;
  const into = current?.repeat === undefined ? sinceBegun : sinceBegun % current.repeat;
  const kind = current?.kind;
  const vanished = (figure.acts ?? []).some((one) => one.kind === 'vanish');
  if (vanished && still) return undefined;
  if (kind === 'vanish' && into >= act.vanish.seconds) return undefined;
  if (still) {
    return { sheet: figure.sheet, cut: cutOf(0), x: figure.x, y: figure.y };
  }
  let row =
    figure.doing === 'bouncing'
      ? Math.floor(seconds * motionTokens.bounce.framesPerSecond) % (big?.frames ?? 4)
      : 0;
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
    const left = Math.max(0, 1 - into / (current?.lasts ?? act.step.seconds));
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
  if (kind === 'pounce') {
    const { out, hold, back, height } = act.pounce;
    const reach = current?.reach ?? 0;
    const share = into < out ? into / out : into < out + hold ? 1 : 1 - (into - out - hold) / back;
    x += toward * Math.round(reach * Math.max(0, share));
    const flying = into < out ? into / out : into >= out + hold ? (into - out - hold) / back : 0;
    y -= Math.round(height * Math.sin(Math.PI * Math.min(1, flying)));
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
        cut: cutOf(0),
        x,
        y: figure.y + drop,
        turn: toward < 0 ? 1 : -1,
      };
    }
  }
  if (kind === 'lie') {
    return {
      sheet: figure.sheet,
      cut: cutOf(0),
      x: x + toward * (current?.reach ?? 0),
      y: figure.y + act.lie.drop,
      turn: toward < 0 ? 1 : -1,
    };
  }
  if (kind === 'hurt' && into < act.hurt.seconds && Math.floor(into / act.hurt.blink) % 2 === 0) {
    return undefined;
  }
  if (kind === 'leap' && into < act.leap.seconds) {
    y -= Math.round(Math.sin((into / act.leap.seconds) * Math.PI) * act.leap.height);
  }
  if (kind === 'sink') {
    const { down, under, up } = act.sink;
    // How much of the figure is above the ground: all, going down to none, and back.
    const share =
      into < down
        ? 1 - into / down
        : into < down + under
          ? 0
          : Math.min(1, (into - down - under) / up);
    const height = Math.round(tall * share);
    if (height === 0) return undefined;
    return { sheet: figure.sheet, cut: { ...cutOf(row), height }, x, y: y + tall - height };
  }
  if (kind === 'spin' && into < act.spin.seconds) {
    // Spinning round like a top: its other side and back, quicker and quicker.
    const turns = Math.floor((into / act.spin.seconds) ** 0.7 * act.spin.turns);
    if (turns % 2 === 1) return { sheet: figure.sheet, cut: cutOf(row), x, y, flip: true };
  }
  if (kind === 'swell' && into < act.swell.up + act.swell.hold + act.swell.down) {
    const { up, hold, down, size, shake } = act.swell;
    const share = into < up ? into / up : into < up + hold ? 1 : 1 - (into - up - hold) / down;
    const trembling = into >= up && into < up + hold;
    return {
      sheet: figure.sheet,
      cut: cutOf(row),
      x: x + (trembling ? (Math.floor(into * 30) % 2 === 0 ? shake : -shake) : 0),
      y,
      grow: 1 + (size - 1) * share,
    };
  }
  if (kind === 'cheer' && into < act.cheer.seconds) {
    y -= Math.round(Math.sin((into / act.cheer.seconds) * Math.PI) * act.cheer.height);
  }
  if (kind === 'vanish' && Math.floor(into / act.hurt.blink) % 2 === 0) return undefined;
  return { sheet: figure.sheet, cut: cutOf(row), x, y };
}

function frame(column: number, row: number): Cut {
  return { x: column * tile, y: row * tile, width: tile, height: tile };
}

/** A sign over the figure's head while it shows: its own size, centred above the figure. */
function drawSign(figure: Figure, seconds: number, size: Cut): Draw | undefined {
  if (!figure.sign) return undefined;
  const into = since(seconds, figure.sign.at);
  if (into < 0 || into >= motionTokens.sign.seconds) return undefined;
  const width = figure.big?.width ?? tile;
  const height = figure.big?.height ?? tile;
  // Over the head of a figure drawn larger, which grows up from its feet.
  const top = figure.y + height - height * (figure.size ?? 1);
  return {
    sheet: figure.sign.sheet,
    cut: size,
    x: figure.x + Math.round((width - size.width) / 2),
    y: top - size.height - 1,
  };
}

/** An effect's frame at the moment, while it plays. */
function drawEffect(effect: Effect, seconds: number): Draw | undefined {
  const { framesPerSecond, flight } = motionTokens.effect;
  const begun = since(seconds, effect.at);
  if (begun < 0 || (effect.lasts !== undefined && begun >= effect.lasts)) return undefined;
  // A cycling effect begins all over again, every cycle.
  const into = effect.cycle === undefined ? begun : begun % effect.cycle;
  // Played once, once every `repeat` seconds, or over and over while it lasts or cycles.
  const step = Math.floor(
    (effect.repeat === undefined ? into : into % effect.repeat) * framesPerSecond,
  );
  const looping =
    (effect.lasts !== undefined || effect.cycle !== undefined) && effect.repeat === undefined;
  if (!looping && step >= effect.frames) return undefined;
  const index = step % effect.frames;
  let { x, y } = effect;
  if (effect.arc) {
    const done = Math.min(1, into / (effect.arc.seconds ?? flight));
    x += Math.round(effect.arc.dx * done);
    y += Math.round((effect.arc.dy ?? 0) * done - effect.arc.height * 4 * done * (1 - done));
  }
  if (effect.float) {
    const { height, every } = effect.float;
    y -= Math.round((height * (1 - Math.cos((2 * Math.PI * into) / every))) / 2);
  }
  return {
    sheet: effect.sheet,
    cut: { x: index * effect.width, y: 0, width: effect.width, height: effect.height },
    x,
    y,
    ...(effect.opacity === undefined ? {} : { opacity: effect.opacity }),
  };
}

/** The whole stage in view, as the camera shows it unless told otherwise. */
export function wholeStage(scene: Scene): View {
  const { width, height } = stageSize(scene);
  return { x: width / 2, y: height / 2, zoom: 1 };
}

/** Easing in and out, so the camera sets off and comes to rest gently. */
const ease = (share: number) => share * share * (3 - 2 * share);

/**
 * What the camera shows at a moment: its first view, and each move begun so far, part of the
 * way through one still going on. With motion stilled, it shows its first view.
 */
export function viewAt(scene: Scene, seconds: number, still = false): View {
  const camera = scene.camera;
  if (!camera) return wholeStage(scene);
  if (still) return camera.start;
  return (camera.moves ?? []).reduce<View>((view, move) => {
    const into = seconds - move.at;
    if (into < 0) return view;
    const share = move.seconds <= 0 ? 1 : ease(Math.min(1, into / move.seconds));
    return {
      x: view.x + (move.to.x - view.x) * share,
      y: view.y + (move.to.y - view.y) * share,
      zoom: view.zoom + (move.to.zoom - view.zoom) * share,
    };
  }, camera.start);
}

/**
 * The stage's top left corner in view, in its pixels, so the view's middle is where the camera
 * looks, kept inside the stage.
 */
export function viewCorner(scene: Scene, view: View): { x: number; y: number } {
  const { width, height } = stageSize(scene);
  const clamp = (value: number, most: number) => Math.min(Math.max(value, 0), most);
  return {
    x: clamp(view.x - width / (2 * view.zoom), width - width / view.zoom),
    y: clamp(view.y - height / (2 * view.zoom), height - height / view.zoom),
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
      foot: figure.y + (figure.big?.height ?? tile),
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
    // Only what is drawn: a thing's other fields, as which sheet it is from, are left out.
    const { sheet, cut, x, y, turn, grow, flip, opacity } = draw;
    return {
      sheet,
      cut,
      x,
      y,
      ...(turn === undefined ? {} : { turn }),
      ...(grow === undefined ? {} : { grow }),
      ...(flip === undefined ? {} : { flip }),
      ...(opacity === undefined ? {} : { opacity }),
    };
  });
}
