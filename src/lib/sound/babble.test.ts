import { describe, expect, it } from 'vitest';
import { babble, shift, type Voice } from './babble';

const voice: Voice = { wave: 'sine', vowel: 1000, pitch: 200, pace: 10, spread: 2 };

describe('babble', () => {
  it('says one syllable after another at the voice’s pace', () => {
    const syllables = babble(voice, 3, () => 0.5);
    expect(syllables.map((s) => s.at)).toEqual([0, 0.1, 0.2]);
    expect(syllables.every((s) => Math.abs(s.length - 0.08) < 1e-9)).toBe(true);
  });

  it('keeps each syllable near the voice’s pitch, the last a little lower', () => {
    expect(babble(voice, 3, () => 0.5).map((s) => s.step)).toEqual([0, 0, -3]);
    expect(babble(voice, 2, () => 0).map((s) => s.step)).toEqual([-2, -5]);
    expect(babble(voice, 2, () => 0.999).map((s) => s.step)).toEqual([2, -1]);
  });

  it('says nothing for no syllables', () => {
    expect(babble(voice, 0)).toEqual([]);
  });
});

describe('shift', () => {
  it('moves a pitch by semitones, an octave doubling it', () => {
    expect(shift(440, 12)).toBe(880);
    expect(shift(440, -12)).toBe(220);
    expect(shift(1, 0)).toBe(1);
  });
});
