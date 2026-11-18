import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeSynth, FakeUtterance, voice } from '../../tests/speech';
import { browserSynth, childRate, speak, useVoices, voicesFor } from './speech';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const sara = voice('Sara', 'da-DK', { default: true });
const magnus = voice('Magnus', 'da_DK', { localService: false });
const daniel = voice('Daniel', 'en-GB');

describe('browserSynth', () => {
  it('is the browser’s speech synthesis, or null where there is none', () => {
    expect(browserSynth()).toBeNull();
    const synth = fakeSynth().synth;
    vi.stubGlobal('speechSynthesis', synth);
    expect(browserSynth()).toBe(synth);
  });
});

describe('useVoices', () => {
  it('is null where the browser cannot read aloud', () => {
    expect(renderHook(() => useVoices(null)).result.current).toBeNull();
  });

  it('follows the voices when the phone says they changed', () => {
    const { synth, change } = fakeSynth([daniel]);
    const { result, unmount } = renderHook(() => useVoices(synth));
    expect(result.current).toEqual([daniel]);
    act(() => {
      change([daniel, sara]);
    });
    expect(result.current).toEqual([daniel, sara]);
    unmount();
  });

  it('asks again a moment later, for phones that fill the list without saying so', () => {
    vi.useFakeTimers();
    const { synth, fill } = fakeSynth();
    const { result } = renderHook(() => useVoices(synth));
    expect(result.current).toEqual([]);
    fill([sara]);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toEqual([sara]);
  });
});

describe('voicesFor', () => {
  it('keeps the voices for the language, the phone’s own choice first', () => {
    expect(voicesFor([daniel, magnus, sara], 'da')).toEqual([sara, magnus]);
    expect(voicesFor([daniel, magnus, sara], 'en')).toEqual([daniel]);
    expect(voicesFor([voice('B', 'da-DK'), voice('A', 'da-DK')], 'da').map((v) => v.name)).toEqual([
      'A',
      'B',
    ]);
  });
});

describe('speak', () => {
  it('reads aloud with the voice, slowly for children, stopping what was said before', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const { synth } = fakeSynth();
    speak(synth, 'Hej', { locale: 'da', voice: magnus });
    expect(synth.cancel).toHaveBeenCalledBefore(synth.speak);
    expect(synth.speak.mock.lastCall?.[0]).toMatchObject({
      text: 'Hej',
      lang: 'da_DK',
      voice: magnus,
      rate: childRate,
    });
  });

  it('lets the phone choose a voice for the language when none is given', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const { synth } = fakeSynth();
    speak(synth, 'Hello', { locale: 'en', rate: 1 });
    expect(synth.speak.mock.lastCall?.[0]).toMatchObject({ lang: 'en', voice: null, rate: 1 });
  });
});
