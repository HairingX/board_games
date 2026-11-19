import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser, FakeOscillator } from '../../../tests/audio';
import { chimes } from '../../lib/sound/chimes';
import { SoundEngine } from '../../lib/sound/engine';
import { Listening } from './Listening';
import { jingleLength, music, sounds } from './sounds';

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
  const chime = vi.spyOn(engine, 'chime');
  const tune = vi.spyOn(engine, 'music');
  const onBack = vi.fn();
  const view = render(<Listening onBack={onBack} sound={engine} />);
  const played = () => effect.mock.calls.map(([url]) => url);
  return { ...fake, ...view, onBack, played, chime, tune };
}

/** Plays an option of a group of sounds, and lets its delayed parts play. */
async function play(group: string, option: string | RegExp): Promise<void> {
  const part = within(screen.getByRole('region', { name: group }));
  fireEvent.click(part.getByRole('button', { name: option }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2500);
  });
}

describe('Listening', () => {
  it('plays each stroke on offer', async () => {
    const { played, fetch, onBack } = open();
    expect(fetch).toHaveBeenCalledTimes(Object.keys(sounds).length + Object.keys(music).length);
    for (const option of ['Nu', 'Bud 1', 'Bud 2', 'Bud 3']) await play('Slaget', option);
    expect(played()).toEqual([
      sounds.slash.url,
      sounds.hit.url,
      sounds.slash.url,
      sounds.thud.url,
      sounds.slash.url,
      sounds.thump.url,
      sounds.slash.url,
      sounds.knock.url,
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('plays the monster’s growls and blows, and the victories with their music', async () => {
    const { played, context, tune } = open();
    for (const option of ['Nu', 'Bud 1', 'Bud 2']) await play('Monsteret angriber', option);
    expect(played()).toEqual([sounds.bump.url, sounds.bump.url, sounds.knock.url]);
    expect(new Set(context.all(FakeOscillator).map((tone) => tone.type))).toEqual(
      new Set(['sawtooth', 'square']),
    );
    for (const option of ['Nu', 'Bud 1', 'Bud 2']) await play('Sejren', option);
    expect(played().slice(3)).toEqual([sounds.fanfare.url, sounds.levelUp.url, sounds.secret.url]);
    expect(tune.mock.calls).toEqual([
      [music.goodTime.url, music.goodTime.gain],
      [music.goodTime.url, music.goodTime.gain],
      [music.sunny.url, music.sunny.gain],
    ]);
    expect(jingleLength.secret).toBeLessThan(2.5);
  });

  it('plays the answers, with another close and far off to compare', async () => {
    const { chime } = open();
    for (const option of [
      'Rigtigt',
      'Tæt på · Nu',
      'Tæt på · Bud 1',
      'Langt fra · Nu',
      'Langt fra · Bud 1',
    ]) {
      await play('Svarene', option);
    }
    const made = chime.mock.calls.map(([one]) => one);
    expect(made.slice(0, 2)).toEqual([chimes.right, chimes.close]);
    expect(made[3]).toBe(chimes.far);
    expect(made[2]?.notes).toHaveLength(2);
    expect(made[4]?.notes).toHaveLength(4);
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
