import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { epilogue, prologue } from './film';
import { dialogZoom, Film, skipAfter } from './Film';
import { sounds } from './sounds';
import { text } from './text';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function open(shots = prologue) {
  const engine = new SoundEngine(fakeSoundBrowser().browser);
  const babble = vi.spyOn(engine, 'babble');
  const effect = vi.spyOn(engine, 'effect');
  const onDone = vi.fn();
  const onBack = vi.fn();
  const view = render(
    <Film
      shots={shots}
      heroes={['Knight', 'Monkey']}
      onDone={onDone}
      onBack={onBack}
      sound={engine}
      now={() => Date.now() / 1000}
      load={() => new Promise(() => undefined)}
    />,
  );
  return { ...view, babble, effect, onDone, onBack };
}

async function pass(seconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}

const told = () => document.querySelector('[aria-live]')?.textContent;

const dialog = () => document.querySelector('.rs-dialog');
const stage = () => document.querySelector('.rs-stage') as HTMLElement;

describe('Film', () => {
  it('plays shot after shot, each told in words, with its voices and sounds, then ends', async () => {
    const { babble, effect, onDone } = open();
    expect(told()).toBe(text.da.film.shots.road);
    expect(babble).toHaveBeenCalledWith(voices.hero, 2, undefined, 0.2);
    expect(screen.getByRole('img', { name: text.da.film.label })).toBeInTheDocument();
    await pass(prologue[0]?.seconds ?? 0);
    expect(told()).toBe(text.da.film.shots.quest);
    expect(babble).toHaveBeenCalledWith(voices.crone, 4, undefined, 0.2);
    // Each picture pops up in turn, with a tap.
    expect(effect).toHaveBeenCalledWith(sounds.choose.url, sounds.choose.gain, expect.closeTo(1.9));
    expect(dialog()).toBeNull();
    await pass(0.5);
    // In a dialog box with her portrait: the hollow tree with its hole, an arrow down, a flame.
    expect(dialog()?.querySelector('.rs-dialog-face')).toBeInTheDocument();
    const shown = [...(dialog()?.querySelectorAll('[data-reveal="true"]') ?? [])];
    expect(shown.map((one) => one.className)).toEqual([
      'rs-bubble-picture',
      'rs-bubble-arrow',
      'rs-bubble-picture',
    ]);
    expect(shown.map((one) => (one as HTMLElement).style.animationDelay)).toEqual([
      '0s',
      '0.8s',
      '1.6s',
    ]);
    expect(shown[0]?.querySelectorAll('.rs-bubble-part')).toHaveLength(2);
    await pass(4);
    expect(dialog()).toBeNull();
    await pass((prologue[1]?.seconds ?? 0) - 4.5);
    // The three dogs, one after another, the two still to come as dark shapes.
    expect(told()).toBe(text.da.film.shots.dogs);
    await pass(0.4);
    expect(dialog()?.querySelector('[data-dark="false"]')).toBeInTheDocument();
    await pass(1.1);
    expect(dialog()?.querySelector('[data-dark="true"]')).toBeInTheDocument();
    await pass((prologue[2]?.seconds ?? 0) - 1.5);
    expect(told()).toBe(text.da.film.shots.treats);
    await pass(prologue[3]?.seconds ?? 0);
    // A moment's quiet, then the bark, and the stage shakes.
    expect(told()).toBe(text.da.film.shots.bark);
    expect(effect).toHaveBeenCalledWith(sounds.bark.url, sounds.bark.gain, 0.6);
    expect(stage()).toHaveAttribute('data-shake', 'false');
    await pass(0.7);
    expect(stage()).toHaveAttribute('data-shake', 'true');
    // The next shot begins still, and shakes at its own bark.
    await pass((prologue[4]?.seconds ?? 0) - 0.7);
    expect(stage()).toHaveAttribute('data-shake', 'false');
    await pass((prologue[5]?.seconds ?? 0) - 0.1);
    expect(babble).toHaveBeenCalledWith(voices.dog, 6, undefined, 3.9);
    expect(onDone).not.toHaveBeenCalled();
    await pass(0.2);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('can be skipped after its first moments, or left', async () => {
    const { onDone, onBack } = open(epilogue);
    expect(screen.queryByRole('button', { name: /Spring over/ })).not.toBeInTheDocument();
    await pass(skipAfter);
    fireEvent.click(screen.getByRole('button', { name: /Spring over/ }));
    expect(onDone).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('draws the pictures in a dialog box twice their size where there is room, else their own', () => {
    const picture = (width: number, zoom?: number) => ({
      parts: [],
      width,
      height: 8,
      ...(zoom === undefined ? {} : { zoom }),
    });
    expect(dialogZoom([picture(16), { arrow: 'down' }, picture(8)], 160)).toBe(2);
    expect(dialogZoom([picture(18), picture(18), picture(21)], 160)).toBe(1);
    // A picture drawn larger of its own takes the room it is drawn in.
    expect(dialogZoom([picture(16, 4)], 160)).toBe(1);
  });
});
