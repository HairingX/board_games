import { describe, expect, it } from 'vitest';
import { drawScene } from '../../lib/scene/scene';
import {
  attacks,
  evasions,
  reached,
  reveal,
  strikes,
  teases,
  teasing,
  type Beat,
  type Moment,
} from './beats';
import { clearing } from './clearing';
import { slime } from './monsters';
import { sounds } from './sounds';

const moment: Moment = { at: 10, walked: 0, others: [], lost: false };

/** Every moment a beat's staging may draw something, from its start to well after. */
const throughout = Array.from({ length: 40 }, (_, step) => moment.at + step * 0.1);

/** The beat drawn in the clearing at every moment, so every part of it is drawn. */
function drawn(beat: Beat): number {
  const scene = clearing(beat.staging, { front: 'Knight', bench: [] }, slime.look.calm);
  return throughout.reduce((count, at) => count + drawScene(scene, at).length, 0);
}

/** Whether every cue is a sound the game has, or a voice, at or after the beat begins. */
function heard(beat: Beat): boolean {
  return beat.cues.every(
    (cue) => cue.after >= 0 && ('voice' in cue || cue.sound === 'hit' || cue.sound in sounds),
  );
}

describe('the fight’s beats', () => {
  it('has every tease a monster may use draw something and play its sounds', () => {
    for (const how of slime.teases) {
      const beat = teases[how](moment.at);
      expect(drawn(beat)).toBeGreaterThan(0);
      expect(heard(beat)).toBe(true);
      expect(beat.cues.length).toBeGreaterThan(0);
    }
    expect(Object.keys(teases).sort()).toEqual([...slime.teases].sort());
    expect(teasing.seconds).toBeGreaterThan(teasing.apart * 2);
  });

  it('has every way of striking back show a dodge and a blow landing, with their sounds', () => {
    for (const way of slime.strikes) {
      for (const beat of [strikes[way].dodged(moment), strikes[way].hit(moment)]) {
        expect(drawn(beat)).toBeGreaterThan(0);
        expect(heard(beat)).toBe(true);
      }
    }
  });

  it('has every evasion move the monster, and every attack its beat', () => {
    for (const evasion of slime.evasions) {
      expect(evasions[evasion](1).at).toBe(1);
      expect(drawn(attacks.evaded(moment, evasion, true))).toBeGreaterThan(0);
    }
    const struck = attacks.stroke(moment, true, true);
    expect(struck.staging.monster?.sign?.sheet).toBe('angry');
    expect(struck.cues.filter((cue) => 'sound' in cue && cue.sound === 'hit')).toHaveLength(2);
    const won = attacks.victory({ ...moment, others: ['far'] }, false, 6);
    expect(won.staging.bench?.far?.acts).toHaveLength(2);
    expect(heard(won)).toBe(true);
    expect(attacks.bumped({ ...moment, walked: 12 }).staging.monster?.acts?.[0]).toMatchObject({
      kind: 'return',
      reach: 12,
    });
    expect(attacks.fed(moment).staging.monster?.facing).toBe('right');
  });

  it('roars at a hero walked up to, or pounces, knocking them over to rest when hearts are gone', () => {
    const walking = { kind: 'approach', at: 0, reach: 40, lasts: 15 } as const;
    expect(reached.roar(moment.at, walking).staging.monster?.sign?.sheet).toBe('angry');
    const pounce = reached.pounce({ ...moment, lost: true }, walking);
    expect(pounce.staging.hero?.sign?.sheet).toBe('sleepy');
    expect(heard(pounce)).toBe(true);
  });

  it('shows how an answer went as the hero or the monster arrives', () => {
    const landed = strikes.charge
      .hit(moment)
      .cues.find((cue) => 'sound' in cue && cue.sound === 'bump');
    expect(landed?.after).toBe(reveal);
  });
});
