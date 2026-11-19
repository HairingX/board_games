import { useEffect, useState } from 'react';
import { useMessages } from '../../i18n/I18n';
import type { Chime } from '../../lib/sound/chimes';
import { chimes } from '../../lib/sound/chimes';
import { sound as defaultSound, type SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { GameHeader } from '../../ui/GameHeader';
import { Switch } from '../../ui/Switch';
import { jingleLength, music, sounds, type Mixed } from './sounds';
import { text } from './text';
import './regnespil.css';

/** Another close: a half step down, softer than a whole step. */
const closeHalf: Chime = {
  ...chimes.close,
  notes: [
    { at: 0, length: 0.13, step: 0 },
    { at: 0.12, length: 0.28, step: -1 },
  ],
};

/** Another far off: four notes stepping down by half steps, the last gliding further. */
const farSteps: Chime = {
  ...chimes.far,
  notes: [
    { at: 0, length: 0.2, step: 0 },
    { at: 0.2, length: 0.2, step: -1 },
    { at: 0.4, length: 0.2, step: -2 },
    { at: 0.6, length: 0.6, step: -3, slide: -2 },
  ],
};

/** How long after the growl the monster's bump lands, in seconds, as in the fight. */
const growlLead = 0.35;

/**
 * The sounds to compare, while the owner chooses the game's sounds: options for the stroke,
 * the monster's attack, the victory and the answers, each heard alone or over the fight's
 * music, mixed as the fight mixes them.
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
    void sound.prepareEffects(Object.values(sounds).map(({ url }) => url));
    void sound.prepareMusic(Object.values(music).map(({ url }) => url));
    return () => {
      sound.stopMusic();
    };
  }, [sound]);

  const effect = ({ url, gain }: Mixed, after = 0) => {
    sound.unlock();
    setTimeout(() => {
      void sound.effect(url, gain);
    }, after * 1000);
  };
  const victory = (jingle: Mixed, length: number, then: Mixed) => {
    sound.stopMusic();
    effect(jingle);
    setTimeout(() => {
      sound.music(then.url, then.gain);
    }, length * 1000);
  };

  const groups: { title: string; options: [string, () => void][] }[] = [
    {
      title: t.stroke,
      options: [
        [
          t.now,
          () => {
            effect(sounds.slash);
            effect(sounds.hit);
          },
        ],
        [
          t.option(1),
          () => {
            effect(sounds.slash);
            effect(sounds.thud);
          },
        ],
        [
          t.option(2),
          () => {
            effect(sounds.slash);
            effect(sounds.thump);
          },
        ],
        [
          t.option(3),
          () => {
            effect(sounds.slash);
            effect(sounds.knock);
          },
        ],
      ],
    },
    {
      title: t.attack,
      options: [
        [
          t.now,
          () => {
            sound.babble(voices.growl, 2);
            effect(sounds.bump, growlLead);
          },
        ],
        [
          t.option(1),
          () => {
            sound.babble(voices.rumble, 2);
            effect(sounds.bump, growlLead);
          },
        ],
        [
          t.option(2),
          () => {
            sound.babble(voices.growl, 2);
            effect(sounds.knock, growlLead);
          },
        ],
      ],
    },
    {
      title: t.victory,
      options: [
        [
          t.now,
          () => {
            victory(sounds.fanfare, jingleLength.fanfare, music.goodTime);
          },
        ],
        [
          t.option(1),
          () => {
            victory(sounds.levelUp, jingleLength.levelUp, music.goodTime);
          },
        ],
        [
          t.option(2),
          () => {
            victory(sounds.secret, jingleLength.secret, music.sunny);
          },
        ],
      ],
    },
    {
      title: t.answers,
      options: [
        [
          t.right,
          () => {
            sound.chime(chimes.right);
          },
        ],
        [
          `${t.close} · ${t.now}`,
          () => {
            sound.chime(chimes.close);
          },
        ],
        [
          `${t.close} · ${t.option(1)}`,
          () => {
            sound.chime(closeHalf);
          },
        ],
        [
          `${t.far} · ${t.now}`,
          () => {
            sound.chime(chimes.far);
          },
        ],
        [
          `${t.far} · ${t.option(1)}`,
          () => {
            sound.chime(farSteps);
          },
        ],
      ],
    },
  ];

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
      {groups.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2>{group.title}</h2>
          <div className="rs-listen-options">
            {group.options.map(([label, play]) => (
              <button key={label} type="button" className="btn btn-ghost" onClick={play}>
                {label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
