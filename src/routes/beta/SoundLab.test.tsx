import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FakeBufferSource, FakeOscillator, fakeSoundBrowser } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { saves } from '../../lib/saves';
import { soundSaveKey } from '../../lib/sound/settings';
import { SoundLab } from './SoundLab';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

async function open() {
  const fake = fakeSoundBrowser();
  const sound = new SoundEngine(fake.browser);
  const onBack = vi.fn();
  const view = render(<SoundLab onBack={onBack} sound={sound} />);
  await screen.findByRole('heading', { name: 'Lyd' });
  return { ...fake, sound, onBack, ...view };
}

describe('SoundLab', () => {
  it('plays the music, fading from piece to piece, and stops it', async () => {
    const { audios, runLater, onBack, fetch } = await open();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3);
    });
    await act(() => Promise.resolve());
    click('Eventyret begynder');
    click('Den mørke skov');
    expect(audios.map((audio) => audio.src)).toEqual([
      expect.stringMatching(/^blob:/) as string,
      expect.stringMatching(/^blob:/) as string,
    ]);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining('Adventure') as string,
      expect.stringContaining('Forest') as string,
      expect.stringContaining('Tension') as string,
    ]);
    click('Spænding');
    click('Stop musikken');
    runLater();
    expect(audios.every((audio) => audio.pause.mock.calls.length === 1)).toBe(true);
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('plays each effect', async () => {
    const { context } = await open();
    for (const name of ['Mønt', 'Sværd', 'Slag', 'Magi', 'Kraft', 'Sejr']) click(name);
    await waitFor(() => {
      expect(context.all(FakeBufferSource)).toHaveLength(6);
    });
  });

  it('plays the answers’ chimes: bright for right and close, soft for far off', async () => {
    const { context } = await open();
    for (const name of ['Rigtigt', 'Tæt på', 'Langt fra']) click(name);
    expect(context.all(FakeOscillator).map((tone) => tone.type)).toEqual([
      ...['triangle', 'triangle', 'triangle'],
      ...['triangle', 'triangle'],
      ...['sine', 'sine'],
    ]);
  });

  it('lets each character babble in a tone of its own', async () => {
    const { context } = await open();
    for (const name of ['Helten', 'Trolden', 'Feen']) click(name);
    expect(context.all(FakeOscillator)).toHaveLength(3 * 8);
    expect(new Set(context.all(FakeOscillator).map((tone) => tone.type)).size).toBe(3);
  });

  it('turns music and effects off and on, and keeps the choice', async () => {
    const { context, audios, unmount } = await open();
    fireEvent.click(screen.getByRole('switch', { name: 'Musik' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Lydeffekter' }));
    expect(screen.getByRole('switch', { name: 'Musik' })).not.toBeChecked();
    await waitFor(async () => {
      expect(await saves.read(soundSaveKey)).toEqual({ music: false, effects: false });
    });
    click('Mønt');
    await act(() => Promise.resolve());
    expect(context.all(FakeBufferSource)).toEqual([]);

    click('Eventyret begynder');
    unmount();
    expect(audios[0]?.pause).not.toHaveBeenCalled();
    await open();
    expect(screen.getByRole('switch', { name: 'Lydeffekter' })).not.toBeChecked();
    fireEvent.click(screen.getByRole('switch', { name: 'Lydeffekter' }));
    expect(screen.getByRole('switch', { name: 'Lydeffekter' })).toBeChecked();
  });
});
