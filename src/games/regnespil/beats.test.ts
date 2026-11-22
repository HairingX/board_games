import { describe, expect, it } from 'vitest';
import { drawScene } from '../../lib/scene/scene';
import {
  aftermath,
  answerBeat,
  phaseEntered,
  phases,
  phaseSeconds,
  attacks,
  befriending,
  evasions,
  reached,
  reveal,
  strikes,
  teases,
  teasing,
  type Beat,
  type Moment,
} from './beats';
import { startFight } from './battle';
import { clearing, foeAt, foeMiddle, slimeAt } from './clearing';
import { copperDog, giantSlime, slime } from './monsters';
import { sounds } from './sounds';

const moment: Moment = { at: 10, walked: 0, others: [], lost: false, middle: 108 };

/** Every moment a beat's staging may draw something, from its start to well after. */
const throughout = Array.from({ length: 40 }, (_, step) => moment.at + step * 0.1);

/** The beat drawn in the clearing at every moment, so every part of it is drawn. */
function drawn(beat: Beat): number {
  const scene = clearing(
    beat.staging,
    { front: 'Knight', bench: [] },
    { look: slime.look.calm, bush: true, shielded: false },
  );
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
    for (const how of [...slime.teases, ...copperDog.teases]) {
      const beat = teases[how](moment.at);
      expect(drawn(beat)).toBeGreaterThan(0);
      expect(heard(beat)).toBe(true);
      expect(beat.cues.length).toBeGreaterThan(0);
    }
    // Every tease is some monster's.
    expect(Object.keys(teases).sort()).toEqual(
      [...new Set([...slime.teases, ...copperDog.teases])].sort(),
    );
    // The dog never turns its back on the heroes to tease them.
    for (const how of copperDog.teases) {
      expect(teases[how](moment.at).staging.monster?.facing).toBeUndefined();
    }
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
    const struck = attacks.stroke(moment, true);
    expect(struck.cues.filter((cue) => 'sound' in cue && cue.sound === 'hit')).toHaveLength(2);
    const won = attacks.victory({ ...moment, others: ['far'] }, false, 6);
    const celebrated = clearing(
      won.staging,
      { front: 'Knight', bench: [] },
      { look: slime.look.calm, bush: true, shielded: false },
    );
    const atParty = [1, 2, 3, 4].flatMap((after) =>
      drawScene(celebrated, moment.at + reveal + after).map((draw) => draw.sheet),
    );
    expect(atParty).toEqual(expect.arrayContaining(['flag', 'sparkle']));
    // Two cheers, then the dance, again and again.
    expect(won.staging.bench?.far?.acts?.at(-1)).toMatchObject({ kind: 'cheer', repeat: 2.4 });
    expect(heard(won)).toBe(true);
    expect(attacks.bumped({ ...moment, walked: 12 }).staging.monster?.acts?.[0]).toMatchObject({
      kind: 'return',
      reach: 12,
    });
    expect(attacks.fed(moment).staging.monster?.facing).toBe('right');
  });

  it('has a boss slam down on the hero, and strokes break its shield', () => {
    for (const beat of [strikes.slam.dodged(moment), strikes.slam.hit(moment)]) {
      expect(beat.staging.monster.acts[0]?.kind).toBe('pounce');
      expect(heard(beat)).toBe(true);
    }
    const chipped = attacks.shielded(moment, false);
    expect(chipped.cues).toContainEqual({ sound: 'clang', after: reveal });
    const broken = attacks.shielded(moment, true);
    expect(broken.staging.effects?.length).toBe(2);
  });

  it('picks the beat a boss’s answer plays, on its shield and as its shield rises', () => {
    const boss = { ...startFight(9, giantSlime.plan), threat: false };
    const ways = { strike: 'slam', evasion: 'leap' } as const;
    const onShield = answerBeat({ ...boss, last: 'shielded' }, boss, moment, ways, 3);
    expect(onShield.cues).toContainEqual({ sound: 'clang', after: reveal });
    const shattered = answerBeat({ ...boss, last: 'shattered' }, boss, moment, ways, 3);
    expect(shattered.staging.effects).toHaveLength(2);
    const rising = { ...boss, last: 'struck', shieldRaised: true, shield: 3 } as const;
    expect(phaseEntered(rising, boss)).toBe('shield');
    expect(phaseEntered({ ...boss, enraged: true }, boss)).toBe('rage');
    expect(phaseEntered(boss, boss)).toBeUndefined();
    expect(phaseEntered({ ...rising, outcome: 'won' }, boss)).toBeUndefined();
    const slammed = answerBeat(
      { ...boss, last: 'hit' },
      { ...boss, threat: true },
      moment,
      ways,
      3,
    );
    expect(slammed.staging.monster?.acts?.[0]?.kind).toBe('pounce');
  });

  it('shows a new phase beginning: a spin and a swell for rage, energy gathering for a shield', () => {
    const rage = phases.rage(moment.at);
    expect(rage.staging.monster?.acts?.map((act) => act.kind)).toEqual(['spin', 'swell']);
    expect(heard(rage)).toBe(true);
    const shield = phases.shield(moment.at, 120);
    expect(shield.staging.effects?.filter((effect) => effect.sheet === 'spark')).toHaveLength(6);
    expect(shield.cues).toContainEqual(expect.objectContaining({ sound: 'powerUp' }));
    // Each beginning ends before the next sum, after its last moment.
    for (const [which, beat] of [
      ['rage', rage],
      ['shield', shield],
    ] as const) {
      const last = Math.max(...beat.cues.map((cue) => cue.after));
      expect(phaseSeconds[which]).toBeGreaterThan(last);
    }
    expect(drawn(shield)).toBeGreaterThan(0);
  });

  it('stands a big monster with its feet on the ground, without a bush, and with its shield', () => {
    const scene = clearing(
      {},
      { front: 'Knight', bench: [] },
      {
        look: giantSlime.look.calm,
        big: giantSlime.big,
        bush: false,
        shielded: true,
      },
    );
    const boss = scene.figures.at(-1);
    expect(boss?.big).toEqual(giantSlime.big);
    expect((boss?.y ?? 0) + (giantSlime.big?.height ?? 0)).toBe(slimeAt.y + 16);
    expect(scene.things.some((thing) => thing.cut.y === 224)).toBe(false);
    expect(scene.effects?.[0]?.sheet).toBe('guard');
  });

  it('roars at a hero walked up to, or pounces, knocking them over to rest when hearts are gone', () => {
    const walking = { kind: 'approach', at: 0, reach: 40, lasts: 15 } as const;
    expect(reached.roar(moment.at, walking).staging.monster?.sign?.sheet).toBe('angry');
    const pounce = reached.pounce({ ...moment, lost: true }, walking);
    expect(pounce.staging.hero?.sign?.sheet).toBe('sleepy');
    expect(heard(pounce)).toBe(true);
  });

  it('has a beaten monster gone when the fight is opened again, and anything else as it stands', () => {
    const won = { ...startFight(2), lives: 0, outcome: 'won' } as const;
    const scene = clearing(
      aftermath(won, 5, ['far'], 108),
      { front: 'Knight', bench: [{ id: 'far', hero: 'Samurai' }] },
      { look: slime.look.calm, bush: true, shielded: false },
    );
    const drawnNow = drawScene(scene, 5).map((draw) => draw.sheet);
    expect(drawnNow).toContain('Knight');
    expect(drawnNow).toEqual(expect.arrayContaining(['flag', 'Samurai']));
    expect(drawnNow).toContain('ring');
    expect(drawnNow).not.toContain({ look: slime.look.calm, bush: true, shielded: false });
    expect(drawScene(scene, 5, true).map((draw) => draw.sheet)).not.toContain({
      look: slime.look.calm,
      bush: true,
      shielded: false,
    });
    // Later the fireworks are over, and the heroes still dance by the flag.
    const later = drawScene(scene, 5 + 60).map((draw) => draw.sheet);
    expect(later).toContain('flag');
    expect(later).not.toContain('ring');
    const hops = [60, 60.35].map(
      (time) => drawScene(scene, 5 + time).find((draw) => draw.sheet === 'Knight')?.y,
    );
    expect(hops[0]).not.toBe(hops[1]);
    expect(aftermath(startFight(2), 5, [], 108)).toEqual({});
  });

  it('throws treats at a monster won over: caught at a right answer, dodged at a close one', () => {
    const dog = { ...startFight(4, copperDog.plan), threat: false };
    const ways = { strike: 'charge', evasion: 'leap' } as const;
    const caught = answerBeat({ ...dog, last: 'struck' }, dog, moment, ways, 3, true);
    expect(caught.staging.effects?.map((effect) => effect.sheet)).toEqual(['bone']);
    expect(caught.cues).toContainEqual({ sound: 'treat', after: reveal });
    expect(caught.staging.monster?.sign?.sheet).toBe('heart');
    const two = answerBeat({ ...dog, last: 'smashed' }, dog, moment, ways, 3, true);
    expect(two.staging.effects).toHaveLength(2);
    const dodged = answerBeat({ ...dog, last: 'parried' }, dog, moment, ways, 3, true);
    expect(dodged.staging.monster?.acts?.at(-1)?.kind).toBe('leap');
    expect(dodged.staging.hero?.acts).toHaveLength(1);
    const smarting = answerBeat({ ...dog, last: 'nicked' }, dog, moment, ways, 3, true);
    expect(smarting.staging.hero?.acts?.at(-1)?.kind).toBe('hurt');
    expect(answerBeat({ ...dog, last: 'bumped' }, dog, moment, ways, 3, true)).toEqual(
      attacks.bumped(moment),
    );
    for (const beat of [caught, two, dodged, smarting]) expect(heard(beat)).toBe(true);
  });

  it('wins a monster over at the last treat: it runs to the heroes and stays there, no flag', () => {
    const dog = { ...startFight(4, copperDog.plan), threat: false };
    const ways = { strike: 'charge', evasion: 'leap' } as const;
    const friends = answerBeat(
      { ...dog, last: 'struck', lives: 0, outcome: 'won' },
      dog,
      { ...moment, others: ['far'] },
      ways,
      3,
      true,
    );
    expect(heard(friends)).toBe(true);
    expect(friends.staging.monster?.acts?.at(-1)).toMatchObject({
      kind: 'approach',
      reach: befriending.reach,
    });
    expect(friends.staging.effects?.some((effect) => effect.sheet === 'flag')).toBe(false);
    expect(friends.staging.bench?.far?.acts?.at(-1)?.kind).toBe('cheer');
    const strong = answerBeat(
      { ...dog, last: 'smashed', lives: 0, outcome: 'won' },
      dog,
      moment,
      ways,
      0,
      true,
    );
    expect(strong.staging.effects?.filter((effect) => effect.sheet === 'bone')).toHaveLength(2);
    const won = { ...dog, lives: 0, outcome: 'won' } as const;
    const after = aftermath(won, 5, [], 116, true);
    expect(after.monster?.acts?.[0]?.kind).toBe('approach');
    expect(after.effects?.some((effect) => effect.sheet === 'flag')).toBe(false);
  });

  it('stages a fight by the hollow tree, its hole at its foot', () => {
    const inClearing = clearing(
      {},
      { front: 'Knight', bench: [] },
      { look: 'slime', bush: false, shielded: false },
    );
    const byTree = clearing(
      {},
      { front: 'Knight', bench: [] },
      { look: 'slime', bush: false, shielded: false },
      2,
      'tree',
    );
    expect(byTree.things.some((thing) => thing.cut.y === 208)).toBe(true);
    expect(inClearing.things.some((thing) => thing.cut.y === 208)).toBe(false);
  });

  it('stands a dog drawn twice its size with its nose where the slime’s front is', () => {
    const place = foeAt(copperDog);
    // Its frame's middle, twice the half of its frame less its nose before it.
    expect(place.x + 9 - (9 - 1) * 2).toBe(slimeAt.x);
    expect(place.y + 16).toBe(slimeAt.y + 16);
    expect(foeMiddle(copperDog)).toBe(place.x + 9);
    expect(foeMiddle(slime)).toBe(slimeAt.x + 8);
    expect(foeAt(giantSlime).x).toBe(slimeAt.x - 11);
    const scene = clearing(
      {},
      { front: 'Knight', bench: [] },
      { look: 'dog', big: copperDog.big, size: 2, bush: false, shielded: false },
    );
    expect(drawScene(scene, 1).find((draw) => draw.sheet === 'dog')).toMatchObject({
      grow: 2,
      flip: true,
    });
  });

  it('shows a charm turning a blow aside, as a dodge with a golden glow and a clang', () => {
    const fight = { ...startFight(4), threat: true };
    const ways = { strike: 'spit', evasion: 'sink' } as const;
    const turned = { ...fight, last: 'guarded' } as const;
    for (const beat of [
      answerBeat(turned, fight, moment, ways, 3),
      answerBeat(turned, { ...fight, threat: false }, moment, ways, 3),
      answerBeat(turned, { ...fight, threat: false }, moment, ways, 3, true),
    ]) {
      expect(beat.staging.effects?.at(-1)?.sheet).toBe('guard');
      expect(beat.cues).toContainEqual({ sound: 'clang', after: reveal });
      expect(beat.staging.hero?.acts?.some((act) => act.kind === 'knocked')).toBe(false);
    }
  });

  it('keeps a hero out of hearts lying down to rest, also when the fight is opened again', () => {
    const lost = { ...moment, lost: true };
    for (const beat of [attacks.bumped(lost), strikes.charge.hit(lost)]) {
      expect(beat.staging.hero?.acts?.at(-1)?.kind).toBe('lie');
    }
    expect(attacks.bumped(moment).staging.hero?.acts?.at(-1)?.kind).toBe('knocked');
    const resting = aftermath({ ...startFight(2), health: 0, outcome: 'lost' }, 5, [], 108);
    expect(resting.hero).toMatchObject({ acts: [{ kind: 'lie' }], sign: { sheet: 'sleepy' } });
  });

  it('shows how an answer went as the hero or the monster arrives', () => {
    const landed = strikes.charge
      .hit(moment)
      .cues.find((cue) => 'sound' in cue && cue.sound === 'bump');
    expect(landed?.after).toBe(reveal);
  });
});
