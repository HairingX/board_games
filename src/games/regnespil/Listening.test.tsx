import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { Listening } from './Listening';
import { music, sounds } from './sounds';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function open() {
  const fake = fakeSoundBrowser();
  const engine = new SoundEngine(fake.browser);
  const effect = vi.spyOn(engine, 'effect');
  const babble = vi.spyOn(engine, 'babble');
  const tune = vi.spyOn(engine, 'music');
  const onBack = vi.fn();
  const view = render(<Listening onBack={onBack} sound={engine} />);
  return { ...fake, ...view, onBack, effect, babble, tune };
}

describe('Listening', () => {
  it('lets each monster speak in its own voice, and strike after', async () => {
    const { effect, babble, onBack } = open();
    for (const name of ['Slim', 'Trold', 'Kæmpe']) {
      fireEvent.click(screen.getByRole('button', { name }));
    }
    expect(babble.mock.calls.map(([voice]) => voice)).toEqual([
      voices.slime,
      voices.troll,
      voices.giant,
    ]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(effect).toHaveBeenCalledTimes(3);
    expect(effect).toHaveBeenCalledWith(sounds.bump.url, sounds.bump.gain);
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('plays the fight’s music under them while asked, and stops it when left', () => {
    const { tune, audios, unmount, runLater } = open();
    fireEvent.click(screen.getByRole('switch', { name: 'Kampmusik under' }));
    expect(tune).toHaveBeenCalledWith(music.fight.url, music.fight.gain);
    fireEvent.click(screen.getByRole('switch', { name: 'Kampmusik under' }));
    runLater();
    expect(audios[0]?.pause).toHaveBeenCalledOnce();
    unmount();
  });
});
