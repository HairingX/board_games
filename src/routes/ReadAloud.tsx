import { formatLanguages } from '../i18n/format';
import { useLocale, useMessages } from '../i18n/I18n';
import { browserSynth, speak, useVoices, voicesFor, type Synth } from '../lib/speech';
import { appText } from './text';

/**
 * Whether the phone can read the games aloud in the app's language, with which voices, and a
 * sample to hear each one. Voices come from the phone; the app cannot fetch one.
 */
export function ReadAloud({ synth = browserSynth() }: { synth?: Synth | null }) {
  const locale = useLocale();
  const t = useMessages(appText);
  const voices = useVoices(synth);
  const language = formatLanguages(locale, [locale]);
  const fitting = voices ? voicesFor(voices, locale) : [];

  return (
    <section className="panel read-aloud" aria-labelledby="read-aloud-title">
      <h2 id="read-aloud-title">{t.readAloud}</h2>
      <p role="status">
        {!synth || !voices
          ? t.cannotSpeak
          : voices.length === 0
            ? t.noVoicesYet
            : fitting.length === 0
              ? t.noVoice(language)
              : t.voices(fitting.length, language, t.listen)}
      </p>
      {synth && fitting.length > 0 && (
        <ul className="read-aloud-voices">
          {fitting.map((voice) => (
            <li key={voice.voiceURI} className="read-aloud-voice">
              <span className="read-aloud-name">
                {voice.name}
                <small>
                  {voice.localService ? t.onPhone : t.needsInternet}
                  {voice.default ? ` · ${t.phoneDefault}` : ''}
                </small>
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={t.listenTo(voice.name)}
                onClick={() => {
                  speak(synth, t.sample, { locale, voice });
                }}
              >
                {t.listen}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="read-aloud-help">{t.betterVoices}</p>
      <p className="read-aloud-help">{t.phoneLanguages(navigator.languages.join(', '))}</p>
    </section>
  );
}
