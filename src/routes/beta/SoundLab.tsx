import { useEffect } from 'react';
import adventure from '../../../assets/ninja-adventure/Audio/Musics/1 - Adventure Begin.m4a';
import tension from '../../../assets/ninja-adventure/Audio/Musics/28 - Tension.m4a';
import forest from '../../../assets/ninja-adventure/Audio/Musics/37 - Dark Forest.m4a';
import success from '../../../assets/ninja-adventure/Audio/Jingles/Success1.m4a';
import coin from '../../../assets/ninja-adventure/Audio/Sounds/Bonus/Coin.m4a';
import power from '../../../assets/ninja-adventure/Audio/Sounds/Bonus/PowerUp1.m4a';
import hit from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit1.m4a';
import magic from '../../../assets/ninja-adventure/Audio/Sounds/Magic & Skill/Magic1.m4a';
import sword from '../../../assets/ninja-adventure/Audio/Sounds/Whoosh & Slash/Slash.m4a';
import { useMessages } from '../../i18n/I18n';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { reviveSoundSettings, soundSaveKey } from '../../lib/sound/settings';
import { voiceClips, voices } from '../../lib/sound/voices';
import { useSaved } from '../../lib/useSaved';
import { GameHeader } from '../../ui/GameHeader';
import { Switch } from '../../ui/Switch';
import { labText } from './text';
import './beta.css';

const tracks = { adventure, forest, tension } as const;
const sounds = { coin, sword, hit, magic, power, success } as const;

/** How many syllables a character says when tried. */
const sentence = 8;

/**
 * The sound engine to try: music that fades from piece to piece, effects, and the two ways of
 * making the characters' voices. Music and effects can be turned off, as players will.
 */
export function SoundLab({
  onBack,
  sound = defaultSound,
}: {
  onBack: () => void;
  sound?: SoundEngine;
}) {
  const t = useMessages(labText);
  const [settings, save] = useSaved(soundSaveKey, reviveSoundSettings);

  useEffect(() => {
    if (settings) sound.setSettings(settings);
  }, [settings, sound]);

  useEffect(
    () => () => {
      sound.stopMusic();
    },
    [sound],
  );

  if (!settings) return null;

  return (
    <section className="family lab">
      <GameHeader title={t.title} onBack={onBack} />
      <p className="family-intro">{t.intro}</p>

      <h2>{t.music}</h2>
      <Switch
        label={t.music}
        on={settings.music}
        onChange={(music) => {
          save({ ...settings, music });
        }}
      />
      <div className="lab-buttons">
        {(Object.keys(tracks) as (keyof typeof tracks)[]).map((track) => (
          <button
            key={track}
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              sound.music(tracks[track]);
            }}
          >
            {t.tracks[track]}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            sound.stopMusic();
          }}
        >
          {t.stopMusic}
        </button>
      </div>

      <h2>{t.effects}</h2>
      <Switch
        label={t.effects}
        on={settings.effects}
        onChange={(effects) => {
          save({ ...settings, effects });
        }}
      />
      <div className="lab-buttons">
        {(Object.keys(sounds) as (keyof typeof sounds)[]).map((name) => (
          <button
            key={name}
            type="button"
            className="btn btn-ghost"
            onClick={() => void sound.effect(sounds[name])}
          >
            {t.sounds[name]}
          </button>
        ))}
      </div>

      <h2>{t.voices}</h2>
      <p className="family-intro">{t.voicesNote}</p>
      <h3>{t.madeFromTones}</h3>
      <div className="lab-buttons">
        <Babble name={t.characters.hero} onSay={() => sound.babble(voices.heroTone, sentence)} />
        <Babble name={t.characters.troll} onSay={() => sound.babble(voices.trollTone, sentence)} />
        <Babble name={t.characters.fairy} onSay={() => sound.babble(voices.fairyTone, sentence)} />
      </div>
      <h3>{t.madeFromClips}</h3>
      <div className="lab-buttons">
        <Babble
          name={t.characters.hero}
          onSay={() => sound.babble(voices.heroClips, sentence, voiceClips)}
        />
        <Babble
          name={t.characters.troll}
          onSay={() => sound.babble(voices.trollClips, sentence, voiceClips)}
        />
        <Babble
          name={t.characters.fairy}
          onSay={() => sound.babble(voices.fairyClips, sentence, voiceClips)}
        />
      </div>
    </section>
  );
}

function Babble({ name, onSay }: { name: string; onSay: () => Promise<void> }) {
  return (
    <button type="button" className="btn btn-ghost" onClick={() => void onSay()}>
      {name}
    </button>
  );
}
