import fanfare from '../../../assets/ninja-adventure/Audio/Jingles/Success4.m4a';
import levelUp from '../../../assets/ninja-adventure/Audio/Jingles/LevelUp2.m4a';
import secret from '../../../assets/ninja-adventure/Audio/Jingles/Secret1.m4a';
import fightMusic from '../../../assets/ninja-adventure/Audio/Musics/17 - Fight.m4a';
import goodTime from '../../../assets/ninja-adventure/Audio/Musics/20 - Good Time.m4a';
import sunny from '../../../assets/ninja-adventure/Audio/Musics/31 - Sunny.m4a';
import hit from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit1.m4a';
import thud from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit2.m4a';
import thump from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Hit8.m4a';
import clang from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Impact.m4a';
import knock from '../../../assets/ninja-adventure/Audio/Sounds/Hit & Impact/Impact3.m4a';
import bump from '../../../assets/ninja-adventure/Audio/Sounds/Jump & Bounce/Bounce2.m4a';
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
 * above, and the music well under everything, about 12 dB, as games mix it.
 */
export const loudness = { action: -18, celebration: -14, music: -32 } as const;

function mixed(url: string, measured: number, target: number): Mixed {
  return { url, gain: 10 ** ((target - measured) / 20) };
}

export const sounds = {
  slash: mixed(slash, -19.9, loudness.action),
  hit: mixed(hit, -16.1, loudness.action),
  thud: mixed(thud, -14.9, loudness.action),
  thump: mixed(thump, -16.8, loudness.action),
  knock: mixed(knock, -14.2, loudness.action),
  clang: mixed(clang, -10.6, loudness.action),
  bump: mixed(bump, -12.3, loudness.action),
  fanfare: mixed(fanfare, -18.5, loudness.celebration),
  levelUp: mixed(levelUp, -17.2, loudness.celebration),
  secret: mixed(secret, -17.3, loudness.celebration),
} as const;

export const music = {
  fight: mixed(fightMusic, -21.7, loudness.music),
  goodTime: mixed(goodTime, -20, loudness.music),
  sunny: mixed(sunny, -15, loudness.music),
} as const;

/** How long each victory jingle lasts, in seconds, before the victory's music takes over. */
export const jingleLength = { fanfare: 1.2, levelUp: 1.6, secret: 2 } as const;
