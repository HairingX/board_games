import { useEffect, useState } from 'react';
import type { Profile } from '../../family/family';
import { playerSaveKey, type GameProps } from '../../lib/games';
import { sound } from '../../lib/sound/engine';
import { reviveSoundSettings, soundSaveKey } from '../../lib/sound/settings';
import { useSaved, useSavedEach } from '../../lib/useSaved';
import { SoundMenu } from '../../ui/SoundMenu';
import { swordPictures } from './art';
import { Chest } from './Chest';
import { Fight, fightMusic } from './Fight';
import { prologue } from './film';
import { Film } from './Film';
import { fightSaveKey, reviveFight, seeds, type SavedFight } from './fightSave';
import {
  adventureKey,
  fightPlaceOf,
  fightWon,
  filmSeen,
  isUnderway,
  journeySaveKey,
  reviveJourney,
  screenOf,
  startJourney,
  treasureChosen,
  walkTo,
  type Journey,
  type Screen,
} from './journey';
import { JourneyEnd } from './JourneyEnd';
import { JourneyMap } from './JourneyMap';
import { Listening } from './Listening';
import type { Foe } from './monsters';
import { reviveSettings, suggest, type PlayerSettings } from './players';
import { Setup } from './Setup';
import { music, type Mixed } from './sounds';
import { gearOf } from './treasures';

/** The game's place while a quick fight is on; its start is choosing levels and swords. */
export const fightPlace = 'kamp';

/** The fight's own place when it is against the giant slime boss, while the game is tried. */
export const bossPlace = 'boss';

/** The game's place for comparing sounds, while its sounds are being chosen. */
export const listeningPlace = 'lyde';

/**
 * The game's place on the adventure. Its steps are a story that goes one way, so they share
 * the one address: the back gesture leaves the adventure for the setup, and it opens again
 * where the journey stands.
 */
export const adventurePlace = 'eventyr';

/** A new journey's seed, from which its fights and chests are drawn. */
const newSeed = () => Math.floor(Math.random() * seeds);

/**
 * The music that plays on each of the adventure's screens; a fight plays its own, as it begins
 * and as it is won (`Fight.tsx`).
 */
const screenMusic: Readonly<Record<Screen['kind'], Mixed | 'own'>> = {
  film: music.begins,
  fight: 'own',
  chest: music.road,
  map: music.road,
  end: music.ends,
};

/** The music a tap starts for a screen, before it shows. */
const musicFor = (kind: Screen['kind']): Mixed => {
  const tune = screenMusic[kind];
  return tune === 'own' ? music.fight : tune;
};

/** Whether a saved fight is one to go on with: of these players, at this step, against this monster. */
function goesOn(
  saved: SavedFight | null,
  players: readonly Profile[],
  foe: Foe,
  step?: string,
): SavedFight | null {
  return saved &&
    saved.foe === foe &&
    saved.step === step &&
    players.some((player) => player.id === saved.activeId)
    ? saved
    : null;
}

/**
 * The math game: an adventure where sums defeat monsters, or win them over. Each player has
 * their own level and sword, kept on their profile, suggested from their age the first time.
 * The adventure begins with a film and the copper dog, and goes on by a map through the
 * forest, with fights, chests and choices of road, to the hollow tree; a quick fight, the
 * giant slime and the sounds to compare are there to try. How loud music and effects play is
 * kept on the phone and set from the speaker in the header.
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
  const [journey, saveJourney] = useSaved(journeySaveKey(saveKey, players), reviveJourney);
  const [journeyFight, saveJourneyFight] = useSaved(
    fightSaveKey(adventureKey(saveKey), players),
    reviveFight,
  );
  /** A journey to begin, should none be saved when the adventure is opened. */
  const [fresh] = useState(() => startJourney(newSeed()));
  const current: Journey = journey ?? fresh;
  const screen = screenOf(current);
  const tune =
    place[0] === fightPlace
      ? 'own'
      : place[0] === adventurePlace
        ? screenMusic[screen.kind]
        : undefined;

  useEffect(() => {
    if (levels) sound.setSettings(levels);
  }, [levels]);

  // The music is read into memory before it is needed, so it plays without the internet.
  useEffect(() => {
    void sound.prepareMusic([
      ...fightMusic,
      ...(['film', 'map', 'end'] as const).map((kind) => musicFor(kind).url),
    ]);
  }, []);

  // Each screen has its music, a fight its own; the setup has none.
  useEffect(() => {
    if (tune === 'own') return;
    if (tune) sound.music(tune.url, tune.gain);
    else sound.stopMusic();
  }, [tune]);

  if (
    !settings ||
    !levels ||
    savedFight === undefined ||
    journey === undefined ||
    journeyFight === undefined
  ) {
    return null;
  }

  const aside = <SoundMenu settings={levels} onChange={setLevels} />;
  const back = () => {
    go([]);
  };
  const heroes = settings.map((one) => one.hero);
  const onCoins = (gains: readonly number[]) => {
    gains.forEach((gain, index) => {
      const own = settings[index] as PlayerSettings;
      change(index, { ...own, coins: own.coins + gain });
    });
  };

  /** The adventure's screen, as the journey stands. */
  const adventureScreen = () => {
    switch (screen.kind) {
      case 'film':
        return (
          <Film
            shots={prologue}
            heroes={heroes}
            onDone={() => {
              saveJourney(filmSeen(current));
            }}
            onBack={back}
            aside={aside}
          />
        );
      case 'fight':
        return (
          <Fight
            // A new step is a new fight.
            key={current.at}
            players={players}
            settings={settings}
            saved={goesOn(journeyFight, players, screen.foe, fightPlaceOf(current))}
            foe={screen.foe}
            toughness={screen.toughness}
            scenery={screen.scenery}
            gear={gearOf(current.treasures)}
            step={fightPlaceOf(current)}
            onSave={saveJourneyFight}
            onCoins={onCoins}
            onDone={() => {
              saveJourney(fightWon(current));
            }}
            onBack={back}
            aside={aside}
          />
        );
      case 'chest':
        return (
          <Chest
            key={current.at}
            offers={screen.offers}
            weapon={swordPictures[(settings[0] as PlayerSettings).sword]}
            onChoose={(treasure) => {
              saveJourney(treasureChosen(current, treasure));
            }}
            onBack={back}
            aside={aside}
          />
        );
      case 'map':
        return (
          <JourneyMap
            journey={current}
            heroes={heroes}
            onGo={(step) => {
              saveJourney(walkTo(current, step));
            }}
            onBack={back}
            aside={aside}
          />
        );
      case 'end':
        return (
          <JourneyEnd
            heroes={heroes}
            treasures={current.treasures}
            onAgain={() => {
              saveJourney(startJourney(newSeed()));
            }}
            onBack={back}
            aside={aside}
          />
        );
    }
  };

  switch (place[0]) {
    case adventurePlace:
      return adventureScreen();
    case fightPlace: {
      const foe: Foe = place[1] === bossPlace ? 'giantSlime' : 'slime';
      return (
        <Fight
          players={players}
          settings={settings}
          // A save against another monster, or whose player is no longer at the table, is
          // begun afresh.
          saved={goesOn(savedFight, players, foe)}
          foe={foe}
          onSave={saveFight}
          onCoins={onCoins}
          onBack={back}
          aside={aside}
        />
      );
    }
    case listeningPlace:
      return <Listening onBack={back} />;
    default:
      return (
        <Setup
          players={players}
          settings={settings}
          onChange={change}
          aside={aside}
          adventure={isUnderway(journey)}
          onAdventure={() => {
            // A journey at its end is begun again; any other goes on where it stands.
            const goingOn = journey !== null && journey.scene !== 'end';
            if (!goingOn) saveJourney(startJourney(newSeed()));
            const tuneThen = goingOn ? musicFor(screen.kind) : music.begins;
            sound.music(tuneThen.url, tuneThen.gain);
            go([adventurePlace]);
          }}
          onRestart={() => {
            saveJourney(startJourney(newSeed()));
            sound.music(music.begins.url, music.begins.gain);
            go([adventurePlace]);
          }}
          onStart={(foe) => {
            sound.music(music.fight.url, music.fight.gain);
            go(foe === 'giantSlime' ? [fightPlace, bossPlace] : [fightPlace]);
          }}
          onListen={() => {
            go([listeningPlace]);
          }}
        />
      );
  }
}
