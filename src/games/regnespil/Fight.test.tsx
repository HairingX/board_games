import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser, FakeOscillator } from '../../../tests/audio';
import { far, mille } from '../../../tests/family';
import type { Profile } from '../../family/family';
import { chimes } from '../../lib/sound/chimes';
import { sound, SoundEngine } from '../../lib/sound/engine';
import { voices } from '../../lib/sound/voices';
import { motionTokens } from '../../ui/motion';
import { faces } from './art';
import { giantSlime, type Foe } from './monsters';
import { Fight } from './Fight';
import { monsterName } from './names';
import { text } from './text';
import { startFight, type Gear } from './battle';
import { gearOf } from './treasures';
import type { SavedFight } from './fightSave';
import type { PlayerSettings } from './players';
import { hits, sounds, victoryLength } from './sounds';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** A fight with the sums made the same every time: at level 1 "1 + 1", at level 7 "12 · 2". */
function open(
  chosen: readonly (Omit<PlayerSettings, 'hero' | 'coins'> & Partial<PlayerSettings>)[] = [
    { level: 1, sword: 'jern' },
  ],
  players: readonly Profile[] = [mille],
  saved: SavedFight | null = null,
  foe?: Foe,
  gear?: Gear,
) {
  const settings = chosen.map((one): PlayerSettings => ({ hero: 'Knight', coins: 0, ...one }));
  const onCoins = vi.fn<(gains: readonly number[]) => void>();
  const fake = fakeSoundBrowser();
  const onBack = vi.fn();
  const onSave = vi.fn<(fight: SavedFight) => void>();
  const engine = new SoundEngine(fake.browser);
  const effect = vi.spyOn(engine, 'effect');
  const chime = vi.spyOn(engine, 'chime');
  const babble = vi.spyOn(engine, 'babble');
  const view = render(
    <Fight
      players={players}
      settings={settings}
      saved={saved}
      onSave={onSave}
      onCoins={onCoins}
      {...(foe ? { foe } : {})}
      {...(gear ? { gear } : {})}
      onBack={onBack}
      random={() => 0}
      sound={engine}
      // The fake timers' clock, so the scene's times go with them.
      now={() => Date.now() / 1000}
      load={() => new Promise(() => undefined)}
    />,
  );
  const played = () => effect.mock.calls.map(([url, volume, after]) => [url, volume, after]);
  const chimed = () => chime.mock.calls.map(([made]) => made);
  const babbled = () => babble.mock.calls.map(([voice, syllables]) => [voice, syllables]);
  return { ...fake, ...view, onBack, onSave, onCoins, played, chimed, chime, babbled };
}

/** Lets the pause after an answer pass, and the sounds be fetched. */
async function pause(seconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}

/** The victory, over the slime the tests' fights make, from the seed 0. */
const won = `${monsterName(text.da.names.slime, 0)} er besejret!`;
const hearts = (left: string) => screen.getByRole('img', { name: `Heltens hjerter: ${left} af 5` });
const lives = (count: number, its = 'Slimets') =>
  screen.getByRole('img', { name: `${its} liv: ${String(count)}` });
const { right, wrong } = motionTokens.fightPause;
/** How long after an answer is chosen it shows how it went. */
const reveal = motionTokens.act.charge.out;

/** Lets the pause after an answer pass, and the slime's teasing too if it teases, until the next sum shows. */
async function next(seconds: number): Promise<void> {
  await pause(seconds);
  if (document.querySelector('.task-choice:disabled')) await pause(2);
}

/** Chooses an answer, and lets it show how it went. */
async function choose(name: string): Promise<void> {
  click(name);
  await pause(reveal);
}

describe('Fight', () => {
  it('makes its sounds and music ready when it opens, and fades the music when left', () => {
    const { fetch, unmount, audios, runLater } = open();
    expect(fetch).toHaveBeenCalledTimes(Object.keys(sounds).length + hits.length + 2);
    click('2');
    unmount();
    runLater();
    expect(audios[0]?.pause).toHaveBeenCalledOnce();
  });

  it('runs at the slime on an answer, and only as the hero reaches it shows a stroke', async () => {
    const { played, chimed, chime, audios, onBack } = open();
    expect(hearts('5')).toBeInTheDocument();
    expect(lives(3)).toBeInTheDocument();
    click('2');
    // A moment of hope: chosen, but not yet shown how it went.
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('data-state', 'chosen');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('data-state');
    expect(lives(3)).toBeInTheDocument();
    expect(chimed()).toEqual([chimes.right]);
    expect(chime.mock.lastCall?.[2]).toBe(reveal);
    expect(played()).toEqual([
      [sounds.choose.url, sounds.choose.gain, 0],
      [sounds.slash.url, sounds.slash.gain, reveal],
      [hits[0]?.url, hits[0]?.gain, reveal],
    ]);
    await pause(reveal);
    expect(lives(2)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('data-state', 'right');
    expect(screen.getByRole('button', { name: '2' })).toBeDisabled();
    expect(audios).toHaveLength(1);
    await pause(right);
    expect(screen.getByRole('button', { name: '2' })).toBeEnabled();
    expect(screen.queryByRole('status', { name: /tur/ })).not.toBeInTheDocument();
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('costs half a heart for a close answer with the iron sword', async () => {
    const { played, chimed } = open();
    await choose('1');
    expect(hearts('4,5')).toBeInTheDocument();
    expect(lives(3)).toBeInTheDocument();
    expect(chimed()).toEqual([chimes.close]);
    expect(played()).toContainEqual([sounds.slash.url, sounds.slash.gain, reveal]);
    await pause(wrong);
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
  });

  it('forgives a close answer with the wooden sword, and meets a softer slime', async () => {
    open([{ level: 1, sword: 'træ' }]);
    expect(lives(2)).toBeInTheDocument();
    await choose('1');
    expect(hearts('5')).toBeInTheDocument();
  });

  it('enrages the slime halfway: its face turns cross, it spins and swells with a roar, and strikes back', async () => {
    const { container, babbled } = open([{ level: 1, sword: 'træ' }]);
    const face = () => container.querySelector('.rs-foe-face')?.getAttribute('src');
    const calm = face();
    await choose('2');
    expect(face()).not.toBe(calm);
    // After the pause it shows its new phase before the next sum comes.
    await pause(right);
    expect(babbled()).toContainEqual([voices.slime, 10]);
    expect(screen.queryByText('Forsvar')).not.toBeInTheDocument();
    await pause(2);
    expect(screen.getByText('Forsvar')).toBeInTheDocument();
  });

  it('wins with a fanfare, coins and a cheering hero, and starts again', async () => {
    const { played, context, audios, runLater, onCoins } = open([{ level: 1, sword: 'træ' }]);
    await choose('2');
    await next(right);
    // Enraged, the slime strikes back at once: the hero dodges.
    await choose('2');
    await pause(right);
    click('2');
    expect(screen.queryByText(won)).not.toBeInTheDocument();
    await pause(reveal);
    expect(screen.getByRole('status')).toHaveTextContent(won);
    expect(played()).toContainEqual([sounds.victory.url, sounds.victory.gain, reveal]);
    expect(context.all(FakeOscillator).length).toBeGreaterThan(0);
    runLater();
    expect(audios[0]?.pause).toHaveBeenCalledOnce();
    await pause(victoryLength);
    expect(audios[1]?.src).toMatch(/^blob:/);
    expect(audios).toHaveLength(2);
    // The coins go in the purse at once, and are picked up one by one.
    expect(onCoins).toHaveBeenCalledWith([3]);
    const coins = screen.getAllByRole('button', { name: 'Saml mønten op' });
    expect(coins).toHaveLength(3);
    expect(screen.getByRole('img', { name: 'Milles pung: 0 mønter' })).toBeInTheDocument();
    fireEvent.click(coins[0] as HTMLElement);
    expect(coins[0]).toBeDisabled();
    expect(coins[0]).toHaveAttribute('data-taken', 'true');
    expect(screen.getByRole('img', { name: 'Milles pung: 1 mønt' })).toBeInTheDocument();
    expect(played()).toContainEqual([sounds.coin.url, sounds.coin.gain, 0]);
    click('Ny kamp');
    expect(screen.queryByRole('button', { name: 'Saml mønten op' })).not.toBeInTheDocument();
    expect(lives(2)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeEnabled();
  });

  it('keeps the screen on while the fight goes on, and lets it go dark once it is won', async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ release } as unknown as WakeLockSentinel));
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
    open([{ level: 1, sword: 'træ' }]);
    await pause(0);
    expect(request).toHaveBeenCalledWith('screen');
    await choose('2');
    await next(right);
    await choose('2');
    await pause(right);
    await choose('2');
    expect(screen.getByRole('status')).toHaveTextContent(won);
    expect(release).toHaveBeenCalledOnce();
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it('loses a heart for an answer far off, and lets the hero rest when none are left', async () => {
    const { played, chimed } = open([{ level: 7, sword: 'flamme' }]);
    expect(lives(4)).toBeInTheDocument();
    for (let bump = 0; bump < 5; bump++) {
      await choose('12');
      await next(wrong);
    }
    expect(hearts('0')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Helten er træt og hviler sig.');
    expect(played()).toContainEqual([sounds.bump.url, sounds.bump.gain, reveal]);
    expect(chimed()).toContainEqual(chimes.far);
    click('Prøv igen');
    expect(hearts('5')).toBeInTheDocument();
  });

  it('passes the turn round the table, each player with a sum at their own level', async () => {
    open(
      [
        { level: 7, sword: 'jern' },
        { level: 1, sword: 'træ' },
      ],
      [far, mille],
    );
    expect(lives(5)).toBeInTheDocument();
    expect(screen.getByText('Nu er det Fars tur')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '12 gange 2' })).toBeInTheDocument();
    await choose('12');
    expect(hearts('4')).toBeInTheDocument();
    await pause(wrong);
    expect(screen.getByText('Nu er det Milles tur')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 plus 1' })).toBeInTheDocument();
    await choose('3');
    expect(hearts('4')).toBeInTheDocument();
    await pause(wrong);
    expect(screen.getByText('Nu er det Fars tur')).toBeInTheDocument();
  });

  it('wins together, the monster as tough as both swords', async () => {
    const { onCoins } = open(
      [
        { level: 1, sword: 'træ' },
        { level: 1, sword: 'træ' },
      ],
      [mille, far],
    );
    expect(lives(4)).toBeInTheDocument();
    for (let turn = 0; turn < 4; turn++) {
      await choose('2');
      await next(right);
    }
    expect(screen.getByRole('status')).toHaveTextContent(won);
    // Each gets as many coins, wherever the coins are tapped, once they have all landed.
    expect(onCoins).toHaveBeenCalledWith([3, 3]);
    await pause(1);
    const coins = screen.getAllByRole('button', { name: 'Saml mønten op' });
    expect(coins).toHaveLength(6);
    fireEvent.click(coins[1] as HTMLElement);
    expect(screen.getByRole('img', { name: 'Fars pung: 1 mønt' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Milles pung: 0 mønter' })).toBeInTheDocument();
  });

  it('saves the fight at once after every answer, with the next turn and its sum', async () => {
    const { onSave } = open(
      [
        { level: 7, sword: 'jern' },
        { level: 1, sword: 'træ' },
      ],
      [far, mille],
    );
    click('12');
    const after = onSave.mock.lastCall?.[0];
    expect(after?.fight).toMatchObject({ health: 8, lives: 5, last: 'bumped' });
    expect(after?.activeId).toBe('mille');
    expect(after?.task.sum).toEqual([1, '+', 1]);
    expect(after?.recent).toEqual(['[12,"×",2]']);
    // The sum answered stays on screen through the pause; the saved next one comes after.
    await pause(reveal);
    expect(screen.getByRole('img', { name: '12 gange 2' })).toBeInTheDocument();
    await pause(wrong);
    expect(screen.getByRole('img', { name: '1 plus 1' })).toBeInTheDocument();
  });

  it('goes on from a saved fight, where it was, the slime as enraged as it was', () => {
    const task = { sum: [3, '+', 4], answer: 7, choices: [6, 7, 8], near: 2 } as const;
    const { container } = open([{ level: 1, sword: 'jern' }], [mille], {
      fight: {
        health: 3,
        lives: 1,
        outcome: 'fighting',
        last: 'struck',
        round: 4,
        threat: false,
        rageAt: 1,
        enraged: true,
        combo: 1,
        full: 3,
        berries: 2,
        hungry: false,
        shieldAt: 0,
        shield: 0,
        shieldRaised: false,
        maxHealth: 10,
        powerAt: 3,
        guards: 0,
      },
      lives: 3,
      activeId: 'mille',
      task,
      recent: [],
      seed: 3,
      foe: 'slime',
    });
    expect(hearts('1,5')).toBeInTheDocument();
    expect(screen.getByText(monsterName(text.da.names.slime, 3))).toBeInTheDocument();
    expect(lives(1)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 plus 4' })).toBeInTheDocument();
    expect(container.querySelector('.rs-foe-face')).toHaveAttribute('src', faces.slimeRage);
  });

  it('saves a new fight when one begins again', async () => {
    const { onSave } = open([{ level: 7, sword: 'træ' }]);
    for (let bump = 0; bump < 10; bump++) {
      await choose('12');
      await next(wrong);
    }
    click('Prøv igen');
    expect(onSave.mock.lastCall?.[0]).toMatchObject({
      fight: { health: 10, lives: 2, outcome: 'fighting' },
      lives: 2,
      activeId: 'mille',
    });
  });

  it('lights the weapon for each right answer in a row, and strikes a power stroke at the third', async () => {
    const { container, played } = open([{ level: 1, sword: 'flamme' }]);
    const combo = (count: number) =>
      screen.getByRole('img', { name: `Rigtige i træk: ${String(count)} af 3` });
    const stage = () => container.querySelector('.rs-stage');
    expect(combo(0)).toHaveAttribute('data-full', 'false');
    await choose('2');
    const damage = () => container.querySelector('.rs-damage');
    expect(damage()).toHaveTextContent('−1');
    await next(right);
    await choose('2');
    expect(combo(2)).toHaveAttribute('data-full', 'true');
    await next(right);
    // Enraged, it strikes back: dodged, the combo is full, and the next stroke is a power stroke.
    await choose('2');
    expect(combo(3)).toBeInTheDocument();
    await next(right);
    click('2');
    expect(stage()).toHaveAttribute('data-shake', 'false');
    await pause(reveal);
    expect(damage()).toHaveTextContent('−2');
    expect(stage()).toHaveAttribute('data-shake', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(won);
    expect(played().filter(([url]) => hits.some((hit) => hit.url === url))).toHaveLength(4);
  });

  it('walks the slime up to the hero while a sum is thought over; with iron it roars and steps back', async () => {
    const { container, babbled } = open();
    const bar = () => container.querySelector('.rs-life');
    expect(bar()).toHaveAttribute('data-walking', 'false');
    await pause(1);
    expect(bar()).toHaveAttribute('data-walking', 'true');
    expect(bar()).toHaveStyle({ '--walk-time': '15s' });
    await pause(15);
    expect(babbled()).toContainEqual([voices.slime, 8]);
    expect(bar()).toHaveAttribute('data-walking', 'false');
    expect(bar()).toHaveAttribute('data-back', 'true');
    expect(hearts('5')).toBeInTheDocument();
    await pause(2);
    expect(bar()).toHaveAttribute('data-walking', 'true');
  });

  it('lets the slime strike when it reaches the hero with the flame sword, the sum staying', async () => {
    const { onSave } = open([{ level: 1, sword: 'flamme' }]);
    await pause(16);
    expect(hearts('4')).toBeInTheDocument();
    expect(onSave.mock.lastCall?.[0].fight).toMatchObject({ last: 'hit', round: 0 });
    expect(screen.getByRole('img', { name: '1 plus 1' })).toBeInTheDocument();
    for (let blow = 1; blow < 5; blow++) await pause(19);
    expect(screen.getByRole('status')).toHaveTextContent('Helten er træt og hviler sig.');
    await pause(30);
    expect(hearts('0')).toBeInTheDocument();
  });

  it('lets the treasures help: a heart more, a charm that turns a blow aside, coins worth two', async () => {
    const gear = gearOf(['heartJar', 'guardCharm', 'goldPouch']);
    const { played, onCoins } = open([{ level: 7, sword: 'jern' }], [mille], null, 'slime', gear);
    const sixHearts = (left: string) =>
      screen.getByRole('img', { name: `Heltens hjerter: ${left} af 6` });
    expect(sixHearts('6')).toBeInTheDocument();
    expect(screen.getByAltText('Skjoldamuletten er klar')).toBeInTheDocument();
    await choose('12');
    expect(sixHearts('6')).toBeInTheDocument();
    expect(screen.getByAltText('Skjoldamuletten har taget et slag')).toBeInTheDocument();
    expect(played()).toContainEqual([sounds.clang.url, sounds.clang.gain, reveal]);
    await next(wrong);
    await choose('12');
    expect(sixHearts('5')).toBeInTheDocument();
    for (let turn = 0; turn < 8 && !screen.queryByText(won); turn++) {
      await next(wrong);
      await choose('24');
    }
    expect(onCoins).toHaveBeenCalledWith([6]);
    await pause(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Saml mønten op' })[0] as HTMLElement);
    expect(screen.getByRole('img', { name: 'Milles pung: 2 mønter' })).toBeInTheDocument();
  });

  it('lets the charm turn aside the blow of a monster that reaches the hero in time', async () => {
    const { played } = open([{ level: 1, sword: 'flamme' }], [mille], null, 'slime', {
      ...gearOf(['guardCharm']),
    });
    await pause(16);
    expect(hearts('5')).toBeInTheDocument();
    expect(played()).toContainEqual([sounds.clang.url, sounds.clang.gain, 0]);
    await pause(19);
    expect(hearts('4')).toBeInTheDocument();
  });

  it('sends the slime home when an answer comes, and keeps the player’s pace for the next walk', async () => {
    const { container } = open();
    const bar = () => container.querySelector('.rs-life');
    await pause(9);
    click('2');
    expect(bar()).toHaveAttribute('data-back', 'true');
    expect(bar()).toHaveAttribute('data-walking', 'false');
    await pause(reveal);
    await pause(right);
    expect(bar()).toHaveStyle({ '--walk-time': '27s' });
  });

  it('lets a wounded slime go to eat: a wrong answer lets it, costing no hearts', async () => {
    const { container, babbled } = open();
    for (let turn = 0; turn < 3; turn++) {
      await choose('2');
      await next(right);
    }
    // Struck twice and dodged once, it turns to the bush.
    expect(babbled()).toContainEqual([voices.slime, 3]);
    expect(
      screen.getByLabelText('Forkert: slimet spiser bær og får et liv tilbage'),
    ).toBeInTheDocument();
    await choose('1');
    expect(lives(2)).toBeInTheDocument();
    expect(hearts('5')).toBeInTheDocument();
    expect(container.querySelector('.rs-damage')).toHaveTextContent('+1');
    expect(container.querySelector('.rs-damage')).toHaveAttribute('data-heal', 'true');
    await pause(wrong);
    expect(screen.getByText('Forsvar')).toBeInTheDocument();
  });

  it('lets the slime spit a ball of slime, as the fight’s seed has it, to jump over or be splashed by', async () => {
    const task = { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 } as const;
    // The seed 0 has the slime spit at the third turn.
    const saved: SavedFight = {
      fight: { ...startFight(3), round: 2, threat: true },
      lives: 3,
      activeId: 'mille',
      task,
      recent: [],
      seed: 0,
      foe: 'slime',
    };
    const jumped = open([{ level: 1, sword: 'jern' }], [mille], saved);
    expect(screen.getByText('Forsvar')).toBeInTheDocument();
    click('2');
    expect(lives(3)).toHaveAttribute('data-away', 'false');
    expect(jumped.babbled()).toContainEqual([voices.slime, 3]);
    expect(jumped.played()).toContainEqual([sounds.spit.url, sounds.spit.gain, 0]);
    await pause(reveal);
    expect(hearts('5')).toBeInTheDocument();
    jumped.unmount();
    const splashed = open([{ level: 1, sword: 'jern' }], [mille], saved);
    await choose('1');
    expect(hearts('4')).toBeInTheDocument();
    expect(splashed.played()).toContainEqual([sounds.splash.url, sounds.splash.gain, reveal]);
  });

  it('lets the slime get out of the way of a stroke that does not land, as the seed has it', async () => {
    const task = { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 } as const;
    // With the seed 3 the slime steps back from the first stroke.
    const { played } = open([{ level: 1, sword: 'jern' }], [mille], {
      fight: startFight(3),
      lives: 3,
      activeId: 'mille',
      task,
      recent: [],
      seed: 3,
      foe: 'slime',
    });
    await choose('1');
    expect(hearts('4,5')).toBeInTheDocument();
    expect(played()).toContainEqual([sounds.slash.url, sounds.slash.gain, reveal]);
  });

  it('fights the giant slime, three times as tough, its portrait at the top', () => {
    const { container } = open([{ level: 1, sword: 'træ' }], [mille], null, 'giantSlime');
    expect(lives(6, 'Kæmpeslimets')).toBeInTheDocument();
    expect(container.querySelector('.rs-foe-face')).toHaveAttribute('src', giantSlime.face.calm);
  });

  it('wins the copper dog over with treats, and it becomes the heroes’ friend', async () => {
    const { played } = open([{ level: 1, sword: 'jern' }], [mille], null, 'copperDog');
    const grumpy = (count: number) =>
      screen.getByRole('img', { name: `Kobberhunden er sur: ${String(count)}` });
    // Half again as tough as the slime, rounded up.
    expect(grumpy(5)).toBeInTheDocument();
    expect(
      screen.getByLabelText('Rigtigt: kobberhunden får en godbid og bliver gladere'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /hund med øjne så store som tekopper/ }),
    ).toBeInTheDocument();
    await choose('2');
    expect(played()).toContainEqual([sounds.treat.url, sounds.treat.gain, reveal]);
    expect(grumpy(4)).toBeInTheDocument();
    for (let turn = 0; turn < 6 && !screen.queryByText(/jeres ven/); turn++) {
      await next(right);
      await choose('2');
    }
    const name = monsterName(text.da.names.copperDog, 0);
    expect(screen.getByRole('status')).toHaveTextContent(`${name} er blevet jeres ven!`);
    expect(played()).toContainEqual([sounds.bark.url, sounds.bark.gain, reveal + 0.15]);
  });

  it('has the boss’s shield take the strokes, a piece at a time, and slam down when enraged', async () => {
    const task = { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 } as const;
    const shielded: SavedFight = {
      fight: {
        ...startFight(6, giantSlime.plan),
        lives: 2,
        enraged: true,
        shield: 3,
        shieldRaised: true,
        round: 3,
      },
      lives: 6,
      activeId: 'mille',
      task,
      recent: [],
      seed: 0,
      foe: 'giantSlime',
    };
    const first = open([{ level: 1, sword: 'træ' }], [mille], shielded);
    expect(screen.getByRole('img', { name: 'Skjoldets stykker: 3' })).toBeInTheDocument();
    expect(
      screen.getByLabelText('Rigtigt: dit slag rammer skjoldet og slår et stykke af'),
    ).toBeInTheDocument();
    await choose('2');
    expect(screen.getByRole('img', { name: 'Skjoldets stykker: 2' })).toBeInTheDocument();
    expect(lives(2, 'Kæmpeslimets')).toBeInTheDocument();
    expect(first.played()).toContainEqual([sounds.clang.url, sounds.clang.gain, reveal]);
    first.unmount();
    // Enraged, it strikes back with a body slam (the seed 0 has it slam at this turn).
    open([{ level: 1, sword: 'træ' }], [mille], {
      ...shielded,
      fight: { ...shielded.fight, round: 4, threat: true },
    });
    click('1');
    expect(lives(2, 'Kæmpeslimets')).toHaveAttribute('data-away', 'true');
  });

  it('defends: the slime warns, the panel turns blue, and a right answer dodges', async () => {
    const { onSave, babbled, container } = open([{ level: 1, sword: 'flamme' }]);
    expect(screen.getByText('Angreb')).toBeInTheDocument();
    expect(container.querySelector('.rs-panel')).toHaveAttribute('data-turn', 'attack');
    await choose('2');
    await next(right);
    await choose('2');
    // The sum answered still shows as an attack through the pause.
    expect(screen.getByText('Angreb')).toBeInTheDocument();
    await next(right);
    expect(screen.getByText('Forsvar')).toBeInTheDocument();
    expect(screen.getByLabelText('Rigtigt: du undviger slimets angreb')).toBeInTheDocument();
    // The whole panel turns blue to defend, and red again to attack.
    expect(container.querySelector('.rs-panel')).toHaveAttribute('data-turn', 'defend');
    await choose('2');
    // The seed 0 has the slime spit at the third turn: it cries out as it does.
    expect(babbled()).toContainEqual([voices.slime, 3]);
    expect(lives(2)).toBeInTheDocument();
    expect(hearts('5')).toBeInTheDocument();
    expect(onSave.mock.lastCall?.[0].fight).toMatchObject({ last: 'dodged', threat: false });
    await next(right);
    expect(screen.getByText('Angreb')).toBeInTheDocument();
  });

  it('lets the slime’s charge land when the answer to defend is wrong, its life bar left behind', async () => {
    const task = { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 } as const;
    // The seed 1 has the slime charge at the third turn.
    const { container } = open([{ level: 1, sword: 'jern' }], [mille], {
      fight: { ...startFight(3), lives: 1, round: 2, threat: true },
      lives: 3,
      activeId: 'mille',
      task,
      recent: [],
      seed: 1,
      foe: 'slime',
    });
    expect(lives(1)).toHaveAttribute('data-away', 'false');
    click('1');
    expect(lives(1)).toHaveAttribute('data-away', 'true');
    expect(lives(1)).toHaveStyle({ '--away': '1.05s' });
    await pause(reveal);
    expect(hearts('4')).toBeInTheDocument();
    expect(container.querySelector('.rs-stage')).toHaveAttribute('data-shake', 'true');
  });

  it('uses the page’s clock and the app’s sound when none are given', async () => {
    // The app's own sound needs the browser's Web Audio, which the tests have not.
    vi.spyOn(sound, 'prepareEffects').mockResolvedValue(undefined);
    vi.spyOn(sound, 'prepareMusic').mockResolvedValue(undefined);
    vi.spyOn(sound, 'stopMusic').mockReturnValue(undefined);
    vi.spyOn(sound, 'chime').mockReturnValue(undefined);
    vi.spyOn(sound, 'babble').mockReturnValue(undefined);
    const music = vi.spyOn(sound, 'music').mockReturnValue(undefined);
    const effect = vi.spyOn(sound, 'effect').mockResolvedValue(undefined);
    const { container } = render(
      <Fight
        players={[mille]}
        settings={[{ level: 1, sword: 'træ', hero: 'Samurai', coins: 0 }]}
        saved={null}
        onSave={() => undefined}
        onCoins={() => undefined}
        onBack={() => undefined}
      />,
    );
    const choice = container.querySelector('.task-choice');
    if (choice) fireEvent.click(choice);
    await pause(reveal);
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement();
    // As the fight began, and again, going on, at the tap.
    expect(music).toHaveBeenCalledTimes(2);
    expect(effect).toHaveBeenCalled();
  });

  it('plays the fight’s music as it begins, but not when it is opened again already won', async () => {
    const { audios } = open();
    expect(audios).toHaveLength(1);
    cleanup();
    const won = {
      fight: { ...startFight(2), lives: 0, outcome: 'won', last: 'struck' },
      lives: 2,
      activeId: 'mille',
      task: { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 },
      recent: [],
      seed: 0,
      foe: 'slime',
    } as const satisfies SavedFight;
    const again = open([{ level: 1, sword: 'jern' }], [mille], won);
    expect(again.audios).toHaveLength(0);
    await pause(victoryLength);
    expect(again.audios).toHaveLength(1);
  });
});
