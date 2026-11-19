import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FakeBufferSource,
  FakeContext,
  FakeElementSource,
  FakeFilter,
  FakeGain,
  FakeOscillator,
  fakeSoundBrowser,
} from '../../../tests/audio';
import type { Voice } from './babble';
import { musicFade, sound, SoundEngine } from './engine';

function engine() {
  const fake = fakeSoundBrowser();
  return { ...fake, sound: new SoundEngine(fake.browser) };
}

const tone: Voice = {
  timbre: { kind: 'tone', wave: 'square', vowel: 900 },
  pitch: 200,
  pace: 10,
  spread: 0,
};
const clips: Voice = { timbre: { kind: 'clips' }, pitch: 2, pace: 10, spread: 0 };

describe('SoundEngine', () => {
  it('makes nothing before the first sound, as browsers allow sound only from a tap', () => {
    const { browser } = engine();
    expect(browser.makeContext).not.toHaveBeenCalled();
    expect(sound).toBeInstanceOf(SoundEngine);
  });

  it('starts the sound once, with music and effects each on their own volume', () => {
    const { sound, context, browser } = engine();
    const { music, effects } = sound.unlock();
    expect(context.resume).toHaveBeenCalledOnce();
    expect(music).toBeInstanceOf(FakeGain);
    expect((music as unknown as FakeGain).outputs).toEqual([context.destination]);
    expect((effects as unknown as FakeGain).outputs).toEqual([context.destination]);
    sound.unlock();
    expect(browser.makeContext).toHaveBeenCalledOnce();
    expect(context.resume).toHaveBeenCalledOnce();
  });

  it('starts with music or effects off when they were turned off, and turns them gently', () => {
    const { sound, context } = engine();
    sound.setSettings({ music: false, effects: true });
    const buses = sound.unlock();
    const music = buses.music as unknown as FakeGain;
    const effects = buses.effects as unknown as FakeGain;
    expect(music.gain.value).toBe(0);
    expect(effects.gain.value).toBe(1);
    sound.setSettings({ music: true, effects: false });
    expect(music.gain.calls).toEqual([
      ['cancel', 10],
      ['set', 0, 10],
      ['ramp', 1, 10.15],
    ]);
    expect(effects.gain.calls.at(-1)).toEqual(['ramp', 0, 10.15]);
    expect(context.currentTime).toBe(10);
  });

  it('plays an effect, fetching and decoding each file once', async () => {
    const { sound, context, fetch } = engine();
    await sound.effect('/coin.m4a');
    await sound.effect('/coin.m4a');
    expect(fetch).toHaveBeenCalledOnce();
    const sources = context.all(FakeBufferSource);
    expect(sources).toHaveLength(2);
    expect(sources[0]?.buffer).toEqual({ length: '/coin.m4a'.length });
    expect(sources[0]?.starts).toEqual([0]);
    expect(sources[0]?.outputs).toEqual([sound.unlock().effects]);
  });

  it('fetches a file again next time when it failed', async () => {
    const { sound, fetch } = engine();
    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(sound.effect('/hit.m4a')).rejects.toThrow('offline');
    await sound.effect('/hit.m4a');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('plays no effect while effects are off', async () => {
    const { sound, context, fetch } = engine();
    sound.setSettings({ music: true, effects: false });
    await sound.effect('/coin.m4a');
    await sound.babble(tone, 3);
    expect(fetch).not.toHaveBeenCalled();
    expect(context.all(FakeBufferSource)).toEqual([]);
    expect(context.all(FakeOscillator)).toEqual([]);
  });

  it('fades music in, keeps the same piece going, and fades over to another', () => {
    const { sound, context, audios, runLater } = engine();
    sound.music('/forest.m4a');
    sound.music('/forest.m4a');
    expect(audios).toHaveLength(1);
    const [forest] = audios;
    expect(forest).toMatchObject({ src: '/forest.m4a', loop: true });
    expect(forest?.play).toHaveBeenCalledOnce();
    const [element] = context.all(FakeElementSource);
    const [, , first] = context.all(FakeGain);
    expect(element?.outputs).toEqual([first]);
    expect(first?.outputs).toEqual([sound.unlock().music]);
    expect(first?.gain.value).toBe(0);
    expect(first?.gain.calls.at(-1)).toEqual(['ramp', 1, 10 + musicFade]);

    sound.music('/tension.m4a');
    expect(first?.gain.calls.at(-1)).toEqual(['ramp', 0, 10 + musicFade]);
    expect(forest?.pause).not.toHaveBeenCalled();
    runLater();
    expect(forest?.pause).toHaveBeenCalledOnce();
    expect(audios[1]?.src).toBe('/tension.m4a');
  });

  it('fades the music out, and does nothing when none plays', () => {
    const { sound, audios, runLater } = engine();
    sound.stopMusic();
    sound.music('/forest.m4a');
    sound.stopMusic();
    sound.stopMusic();
    runLater();
    expect(audios[0]?.pause).toHaveBeenCalledOnce();
  });

  it('babbles in a made voice: a tone through a vowel for each syllable, swelling and fading', async () => {
    const { sound, context } = engine();
    await sound.babble(tone, 2, [], () => 0.5);
    const tones = context.all(FakeOscillator);
    expect(tones.map((t) => [t.type, t.frequency.value])).toEqual([
      ['square', 200],
      ['square', 200 * 2 ** (-3 / 12)],
    ]);
    expect(tones.map((t) => t.starts[0])).toEqual([10.012, 10.112]);
    expect(tones.map((t) => t.stops[0])).toEqual([10.012 + 0.08, 10.112 + 0.08]);
    const vowels = context.all(FakeFilter);
    expect(vowels.map((v) => [v.type, v.frequency.value])).toEqual([
      ['bandpass', 900],
      ['bandpass', 900],
    ]);
    const envelope = vowels[0]?.outputs[0] as FakeGain;
    expect(envelope.gain.calls.map(([kind, value]) => [kind, value])).toEqual([
      ['set', 0],
      ['ramp', 0.25],
      ['set', 0.25],
      ['ramp', 0],
    ]);
    expect(envelope.outputs).toEqual([sound.unlock().effects]);
  });

  it('babbles in a recorded voice: the clips, sped up to the voice’s pitch', async () => {
    const { sound, context, fetch } = engine();
    await sound.babble(clips, 2, ['/a.m4a', '/bb.m4a'], () => 0.001);
    expect(fetch).toHaveBeenCalledTimes(2);
    const sources = context.all(FakeBufferSource);
    expect(sources.map((s) => s.buffer)).toEqual([{ length: 7 }, { length: 7 }]);
    expect(sources.map((s) => s.playbackRate.value)).toEqual([2, 2 * 2 ** (-3 / 12)]);
    expect(sources.map((s) => s.stops.length)).toEqual([1, 1]);
  });

  it('says nothing in a recorded voice without clips', async () => {
    const { sound, context } = engine();
    await sound.babble(clips, 3);
    expect(context.all(FakeBufferSource)).toEqual([]);
  });

  it('uses the browser’s own audio, music player, fetch and timer, quietly when refused', async () => {
    vi.useFakeTimers();
    const context = new FakeContext();
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function AudioContext() {
        return context;
      }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(3)) })),
    );
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValue(new Error('not allowed'));
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockReturnValue();
    const sound = new SoundEngine();

    await sound.effect('/coin.m4a');
    expect(fetch).toHaveBeenCalledWith('/coin.m4a');
    sound.music('/forest.m4a');
    expect(play).toHaveBeenCalledOnce();
    await expect(play.mock.results[0]?.value).rejects.toThrow('not allowed');
    sound.stopMusic();
    vi.advanceTimersByTime(musicFade * 1000);
    expect(pause).toHaveBeenCalledOnce();
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
