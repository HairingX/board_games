import { useEffect } from 'react';
import type { Profile } from '../../family/family';
import { playerSaveKey, type GameProps } from '../../lib/games';
import { sound } from '../../lib/sound/engine';
import { useSavedEach } from '../../lib/useSaved';
import { Fight, fightMusic } from './Fight';
import { reviveSettings, suggest } from './players';
import { Setup } from './Setup';

/** The game's place while the fight is on; its start is choosing levels and swords. */
export const fightPlace = 'kamp';

/**
 * The math game: an adventure where sums defeat monsters. Each player has their own level and
 * sword, kept on their profile, suggested from their age the first time. For now it is the
 * first stage, the slime in the forest clearing, while the game is built in beta.
 */
export default function Regnespil({ players, saveKey, place, go }: GameProps) {
  const [settings, change] = useSavedEach(
    players.map((player) => playerSaveKey(saveKey, player)),
    (saved, index) => reviveSettings(saved) ?? suggest(players[index] as Profile, new Date()),
  );

  // The fight's music is read into memory before it is needed, so it plays without the internet.
  useEffect(() => {
    void sound.prepareMusic([fightMusic]);
  }, []);

  if (!settings) return null;

  return place[0] === fightPlace ? (
    <Fight
      players={players}
      settings={settings}
      onBack={() => {
        go([]);
      }}
    />
  ) : (
    <Setup
      players={players}
      settings={settings}
      onChange={change}
      onStart={() => {
        sound.music(fightMusic);
        go([fightPlace]);
      }}
    />
  );
}
