import { vi } from 'vitest';
import type { Synth } from '../src/lib/speech';

/** A voice as the phone describes it. */
export function voice(
  name: string,
  lang: string,
  more: Partial<SpeechSynthesisVoice> = {},
): SpeechSynthesisVoice {
  return {
    name,
    lang,
    voiceURI: `${name}-${lang}`,
    default: false,
    localService: true,
    ...more,
  };
}

/** A phone's speech synthesis whose voices can change, and what it was asked to say. */
export function fakeSynth(voices: SpeechSynthesisVoice[] = []) {
  let current = voices;
  const events = new EventTarget();
  const synth = Object.assign(events, {
    getVoices: () => current,
    speak: vi.fn<(utterance: SpeechSynthesisUtterance) => void>(),
    cancel: vi.fn(),
  }) as Synth & { speak: ReturnType<typeof vi.fn<(u: SpeechSynthesisUtterance) => void>> };
  return {
    synth,
    /** Changes the voices without telling, as some phones do. */
    fill: (next: SpeechSynthesisVoice[]): void => {
      current = next;
    },
    /** Changes the voices and says so. */
    change: (next: SpeechSynthesisVoice[]): void => {
      current = next;
      events.dispatchEvent(new Event('voiceschanged'));
    },
  };
}

/** jsdom has no utterances; this one keeps what it was given. */
export class FakeUtterance {
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  constructor(readonly text: string) {}
}
