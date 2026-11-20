import { useEffect } from 'react';
import type { Profile } from '../../family/family';
import { playerSaveKey, type GameProps } from '../../lib/games';
import { sound } from '../../lib/sound/engine';
import { reviveSoundSettings, soundSaveKey } from '../../lib/sound/settings';
import { useSaved, useSavedEach } from '../../lib/useSaved';
import { SoundMenu } from '../../ui/SoundMenu';
import { Fight, fightMusic } from './Fight';
import { fightSaveKey, reviveFight } from './fightSave';
import { Listening } from './Listening';
import { reviveSettings, suggest, type PlayerSettings } from './players';
import { Setup } from './Setup';
import { music } from './sounds';

/** The game's place while the fight is on; its start is choosing levels and swords. */
export const fightPlace = 'kamp';

/** The game's place for comparing sounds, while its sounds are being chosen. */
export const listeningPlace = 'lyde';

/**
 * The math game: an adventure where sums defeat monsters. Each player has their own level and
 * sword, kept on their profile, suggested from their age the first time. How loud music and
 * effects play is kept on the phone and set from the speaker in the header. For now it is the
 * first stage, the slime in the forest clearing, while the game is built in beta.
 */
export default function Regnespil({ players, saveKey, place, go }: GameProps) {
  const [settings, change] = useSavedEach(
    players.map((player) => playerSaveKey(saveKey, player)),
    (saved, index) =>
      reviveSettings(saved, players[index] as Profile) ??
      suggest(players[index] as Profile, new Date()),
  );
  const [levels, setLevels] = useSaved(soundSaveKey, reviveSoundSettings);
  const [savedFight, saveFight] = useSaved(fightSaveKey(saveKey, players), reviveFight);

  useEffect(() => {
    if (levels) sound.setSettings(levels);
  }, [levels]);

  // The fight's music is read into memory before it is needed, so it plays without the internet.
  useEffect(() => {
    void sound.prepareMusic(fightMusic);
  }, []);

  if (!settings || !levels || savedFight === undefined) return null;

  const aside = <SoundMenu settings={levels} onChange={setLevels} />;
  const back = () => {
    go([]);
  };

  switch (place[0]) {
    case fightPlace:
      return (
        <Fight
          players={players}
          settings={settings}
          // A save whose player is no longer at the table is begun afresh.
          saved={
            savedFight && players.some((player) => player.id === savedFight.activeId)
              ? savedFight
              : null
          }
          onSave={saveFight}
          onCoins={(gains) => {
            gains.forEach((gain, index) => {
              const own = settings[index] as PlayerSettings;
              change(index, { ...own, coins: own.coins + gain });
            });
          }}
          onBack={back}
          aside={aside}
        />
      );
    case listeningPlace:
      return <Listening onBack={back} />;
    default:
      return (
        <Setup
          players={players}
          settings={settings}
          onChange={change}
          aside={aside}
          onStart={() => {
            sound.music(music.fight.url, music.fight.gain);
            go([fightPlace]);
          }}
          onListen={() => {
            go([listeningPlace]);
          }}
        />
      );
  }
}
