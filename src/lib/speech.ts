import { useEffect, useState } from 'react';
import type { Locale } from '../i18n/locales';

/** The part of the browser's speech synthesis the app uses. */
export type Synth = Pick<
  SpeechSynthesis,
  'getVoices' | 'speak' | 'cancel' | 'addEventListener' | 'removeEventListener'
>;

/** The browser's speech synthesis, or null where it cannot read aloud. */
export function browserSynth(): Synth | null {
  return 'speechSynthesis' in window ? window.speechSynthesis : null;
}

/** How fast children are read to: a little slower than the phone's own pace. */
export const childRate = 0.9;

/**
 * When the voices are asked for again, in milliseconds after the screen opens: some phones fill
 * the list a moment later without saying so, where others send voiceschanged.
 */
const voiceChecks = [250, 1000, 2500] as const;

/** The phone's voices, kept up to date; null where the browser cannot read aloud. */
export function useVoices(synth: Synth | null): readonly SpeechSynthesisVoice[] | null {
  const [voices, setVoices] = useState<readonly SpeechSynthesisVoice[]>(
    () => synth?.getVoices() ?? [],
  );

  useEffect(() => {
    if (!synth) return;
    const load = () => {
      setVoices(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', load);
    const timers = voiceChecks.map((delay) => setTimeout(load, delay));
    return () => {
      synth.removeEventListener('voiceschanged', load);
      timers.forEach(clearTimeout);
    };
  }, [synth]);

  return synth ? voices : null;
}

/** The voices that speak the language, the phone's own choice first. */
export function voicesFor(
  voices: readonly SpeechSynthesisVoice[],
  locale: Locale,
): SpeechSynthesisVoice[] {
  return voices
    .filter((voice) => voice.lang.toLowerCase().replace('_', '-').split('-')[0] === locale)
    .sort((a, b) => Number(b.default) - Number(a.default) || a.name.localeCompare(b.name));
}

/** Reads the text aloud in the language, with the voice if one is given, stopping any other. */
export function speak(
  synth: Synth,
  text: string,
  {
    locale,
    voice,
    rate = childRate,
  }: { locale: Locale; voice?: SpeechSynthesisVoice; rate?: number },
): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? locale;
  if (voice) utterance.voice = voice;
  utterance.rate = rate;
  synth.cancel();
  synth.speak(utterance);
}
