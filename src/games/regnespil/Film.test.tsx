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

describe('Film', () => {
  it('plays shot after shot, each told in words, with its voices and sounds, then ends', async () => {
    const { babble, effect, onDone, container } = open();
    expect(told()).toBe(text.da.film.shots.road);
    expect(babble).toHaveBeenCalledWith(voices.hero, 2, undefined, 0.4);
    expect(screen.getByRole('img', { name: text.da.film.label })).toBeInTheDocument();
    await pass(prologue[0]?.seconds ?? 0);
    expect(told()).toBe(text.da.film.shots.quest);
    expect(babble).toHaveBeenCalledWith(voices.crone, 6, undefined, 0.2);
    // The old woman's picture bubbles come and go.
    expect(container.querySelector('.rs-dialog')).toBeNull();
    await pass(0.5);
    // In a dialog box with her portrait: the hollow tree, an arrow down, and a flame.
    const dialog = container.querySelector('.rs-dialog');
    expect(dialog?.querySelector('.rs-dialog-face')).toBeInTheDocument();
    expect(dialog?.querySelectorAll('.rs-bubble-picture')).toHaveLength(2);
    expect(dialog?.querySelectorAll('.rs-bubble-arrow')).toHaveLength(1);
    await pass(3.5);
    expect(container.querySelector('.rs-dialog')).toBeNull();
    // Shot by shot, as each begins once the one before has ended.
    await pass((prologue[1]?.seconds ?? 0) - 4);
    await pass(prologue[2]?.seconds ?? 0);
    expect(told()).toBe(text.da.film.shots.bark);
    expect(effect).toHaveBeenCalledWith(sounds.bark.url, sounds.bark.gain, 0.1);
    await pass(prologue[3]?.seconds ?? 0);
    await pass((prologue[4]?.seconds ?? 0) - 0.1);
    expect(babble).toHaveBeenCalledWith(voices.dog, 4, undefined, 0.9);
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
    const picture = (width: number) =>
      ({
        url: 'x.png',
        cut: { x: 0, y: 0, width, height: 8 },
        image: { width, height: 8 },
      }) as const;
    expect(dialogZoom([picture(16), { arrow: 'down' }, picture(8)], 160)).toBe(2);
    expect(dialogZoom([picture(18), picture(18), picture(21)], 160)).toBe(1);
  });
});
