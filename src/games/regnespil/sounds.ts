import victoryJingle from '../../../assets/ninja-adventure/Audio/Jingles/LevelUp2.m4a';
import fightMusic from '../../../assets/ninja-adventure/Audio/Musics/17 - Fight.m4a';
import goodTime from '../../../assets/ninja-adventure/Audio/Musics/20 - Good Time.m4a';
import hit from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit1.m4a';
import thud from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit2.m4a';
import thump from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit8.m4a';
import knock from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Impact3.m4a';
import bump from '../../../assets/ninja-adventure/Audio/Sounds/Jump & Bounce/Bounce2.m4a';
import choose from '../../../assets/ninja-adventure/Audio/Sounds/Menu/Accept4.m4a';
import coin from '../../../assets/ninja-adventure/Audio/Sounds/Bonus/Coin2.m4a';
import spit from '../../../assets/ninja-adventure/Audio/Sounds/Elemental/Bubble2.m4a';
import splash from '../../../assets/ninja-adventure/Audio/Sounds/Elemental/Water2.m4a';
import slash from '../../../assets/ninja-adventure/Audio/Sounds/Whoosh & Slash/Slash.m4a';

/*
 * The math game's sounds and music, mixed: the pack's files were recorded at very different
 * levels, so each is played at a gain that brings it to its part's loudness. Each file's
 * loudness was measured once (its loudest tenth of a second for an effect, its typical level
 * for music, in dB below full scale); a file added here is measured the same way.
 */

/** A file with the gain that sets it at its part's loudness in the mix. */
export interface Mixed {
  url: string;
  gain: number;
}

/**
 * How loud each part plays, in dB below full scale: the answers' chimes lead (about −15 dB,
 * set in `src/lib/sound/chimes.ts`), what happens in the fight a little under them, a victory
 * above, and the music far under everything, at the level the owner liked while thinking, as
 * the pack's chiptune music is hard on the ears over many sums. An answer chosen is a soft tap
 * under the fight's sounds, saying only that it was heard.
 */
export const loudness = { tap: -24, action: -18, celebration: -14, music: -44 } as const;

function mixed(url: string, measured: number, target: number): Mixed {
  return { url, gain: 10 ** ((target - measured) / 20) };
}

export const sounds = {
  choose: mixed(choose, -16, loudness.tap),
  slash: mixed(slash, -19.9, loudness.action),
  bump: mixed(bump, -12.3, loudness.action),
  spit: mixed(spit, -15.2, loudness.action),
  coin: mixed(coin, -15.3, loudness.action),
  splash: mixed(splash, -14.8, loudness.action),
  victory: mixed(victoryJingle, -17.2, loudness.celebration),
} as const;

/**
 * A stroke's hit, one of these each time, so the same sound is not heard over and over; the
 * owner liked them all. Later each weapon and monster may have its own.
 */
export const hits: readonly Mixed[] = [
  mixed(hit, -16.1, loudness.action),
  mixed(thud, -14.9, loudness.action),
  mixed(thump, -16.8, loudness.action),
  mixed(knock, -14.2, loudness.action),
];

export const music = {
  fight: mixed(fightMusic, -21.7, loudness.music),
  /** After a victory: happy, after the victory's jingle. */
  victory: mixed(goodTime, -20, loudness.music),
} as const;

/** How long the victory's jingle lasts, in seconds, before the victory's music takes over. */
export const victoryLength = 1.6;
