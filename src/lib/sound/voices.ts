import voice1 from '../../../assets/ninja-adventure/Audio/Sounds/Voice/Voice1.m4a';
import voice2 from '../../../assets/ninja-adventure/Audio/Sounds/Voice/Voice2.m4a';
import voice3 from '../../../assets/ninja-adventure/Audio/Sounds/Voice/Voice3.m4a';
import voice5 from '../../../assets/ninja-adventure/Audio/Sounds/Voice/Voice5.m4a';
import voice9 from '../../../assets/ninja-adventure/Audio/Sounds/Voice/Voice9.m4a';
import type { Voice } from './babble';

/** Short recorded voice sounds from the Ninja Adventure pack, played as syllables. */
export const voiceClips: readonly string[] = [voice1, voice2, voice3, voice5, voice9];

/** The characters' voices, each made two ways to hear which is better. */
export const voices = {
  heroTone: {
    timbre: { kind: 'tone', wave: 'triangle', vowel: 1100 },
    pitch: 330,
    pace: 11,
    spread: 3,
  },
  trollTone: {
    timbre: { kind: 'tone', wave: 'sawtooth', vowel: 550 },
    pitch: 98,
    pace: 7,
    spread: 2,
  },
  fairyTone: {
    timbre: { kind: 'tone', wave: 'sine', vowel: 2400 },
    pitch: 880,
    pace: 15,
    spread: 5,
  },
  heroClips: { timbre: { kind: 'clips' }, pitch: 1, pace: 9, spread: 2 },
  trollClips: { timbre: { kind: 'clips' }, pitch: 0.6, pace: 6, spread: 2 },
  fairyClips: { timbre: { kind: 'clips' }, pitch: 1.6, pace: 13, spread: 4 },
} as const satisfies Record<string, Voice>;
