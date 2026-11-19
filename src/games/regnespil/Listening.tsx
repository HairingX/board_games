import { useEffect, useState } from 'react';
import { useMessages } from '../../i18n/I18n';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { GameHeader } from '../../ui/GameHeader';
import { Switch } from '../../ui/Switch';
import { music, sounds } from './sounds';
import { text } from './text';
import './regnespil.css';

/** How long after a monster's voice its blow lands, in seconds, as in the fight. */
const blowAfter = 0.35;

/**
 * The monsters' voices to compare while they are being chosen, each heard alone or over the
 * fight's music: the slime's, a troll's and a giant boss's, with the blow that follows.
 */
export function Listening({
  onBack,
  sound = defaultSound,
}: {
  onBack: () => void;
  sound?: SoundEngine;
}) {
  const t = useMessages(text).listen;
  const [withMusic, setWithMusic] = useState(false);

  useEffect(() => {
    void sound.prepareEffects([sounds.bump.url]);
    void sound.prepareMusic([music.fight.url]);
    return () => {
      sound.stopMusic();
    };
  }, [sound]);

  const monsters = [
    [t.slime, voices.slime],
    [t.troll, voices.troll],
    [t.giant, voices.giant],
  ] as const;

  return (
    <section className="rs-listening">
      <GameHeader title={t.title} onBack={onBack} />
      <p className="family-intro">{t.intro}</p>
      <Switch
        label={t.withMusic}
        on={withMusic}
        onChange={(on) => {
          setWithMusic(on);
          if (on) sound.music(music.fight.url, music.fight.gain);
          else sound.stopMusic();
        }}
      />
      <section aria-label={t.monsters}>
        <h2>{t.monsters}</h2>
        <div className="rs-listen-options">
          {monsters.map(([name, voice]) => (
            <button
              key={name}
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                sound.babble(voice, 3);
                setTimeout(() => {
                  void sound.effect(sounds.bump.url, sounds.bump.gain);
                }, blowAfter * 1000);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
