import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser, FakeOscillator } from '../../../tests/audio';
import { far, mille } from '../../../tests/family';
import type { Profile } from '../../family/family';
import { chimes } from '../../lib/sound/chimes';
import { sound, SoundEngine } from '../../lib/sound/engine';
import { motionTokens } from '../../ui/motion';
import { Fight } from './Fight';
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
  settings: readonly PlayerSettings[] = [{ level: 1, sword: 'jern' }],
  players: readonly Profile[] = [mille],
  saved: SavedFight | null = null,
) {
  const fake = fakeSoundBrowser();
  const onBack = vi.fn();
  const onSave = vi.fn<(fight: SavedFight) => void>();
  const engine = new SoundEngine(fake.browser);
  const effect = vi.spyOn(engine, 'effect');
  const chime = vi.spyOn(engine, 'chime');
  const view = render(
    <Fight
      players={players}
      settings={settings}
      saved={saved}
      onSave={onSave}
      onBack={onBack}
      random={() => 0}
      sound={engine}
      now={() => 50}
      load={() => new Promise(() => undefined)}
    />,
  );
  const played = () => effect.mock.calls.map(([url, volume]) => [url, volume]);
  const chimed = () => chime.mock.calls.map(([made]) => made);
  return { ...fake, ...view, onBack, onSave, played, chimed };
}

/** Lets the pause after an answer pass, and the sounds be fetched. */
async function pause(seconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}

const hearts = (left: string) => screen.getByRole('img', { name: `Heltens hjerter: ${left} af 5` });
const lives = (count: number) => screen.getByRole('img', { name: `Slimets liv: ${String(count)}` });
const { right, wrong } = motionTokens.fightPause;

describe('Fight', () => {
  it('makes its sounds and music ready when it opens, and fades the music when left', () => {
    const { fetch, unmount, audios, runLater } = open();
    expect(fetch).toHaveBeenCalledTimes(Object.keys(sounds).length + hits.length + 2);
    click('2');
    unmount();
    runLater();
    expect(audios[0]?.pause).toHaveBeenCalledOnce();
  });

  it('strikes the slime on a right answer, with music, and asks the next sum after a pause', async () => {
    const { played, chimed, audios, onBack } = open();
    expect(hearts('5')).toBeInTheDocument();
    expect(lives(3)).toBeInTheDocument();
    click('2');
    expect(lives(2)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeDisabled();
    expect(chimed()).toEqual([chimes.right]);
    expect(played()).toEqual([
      [sounds.slash.url, sounds.slash.gain],
      [hits[0]?.url, hits[0]?.gain],
    ]);
    expect(audios).toHaveLength(1);
    await pause(right);
    expect(screen.getByRole('button', { name: '2' })).toBeEnabled();
    expect(screen.queryByRole('status', { name: /tur/ })).not.toBeInTheDocument();
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('costs half a heart for a close answer with the iron sword', async () => {
    const { played, chimed } = open();
    click('1');
    expect(hearts('4,5')).toBeInTheDocument();
    expect(lives(3)).toBeInTheDocument();
    expect(chimed()).toEqual([chimes.close]);
    expect(played()).toEqual([[sounds.clang.url, sounds.clang.gain]]);
    await pause(wrong);
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
  });

  it('forgives a close answer with the wooden sword, and meets a softer slime', () => {
    open([{ level: 1, sword: 'træ' }]);
    expect(lives(2)).toBeInTheDocument();
    click('1');
    expect(hearts('5')).toBeInTheDocument();
  });

  it('wins with a fanfare, coins and a cheering hero, and starts again', async () => {
    const { played, context, audios, runLater } = open([{ level: 1, sword: 'træ' }]);
    click('2');
    await pause(right);
    click('2');
    expect(screen.getByRole('status')).toHaveTextContent('Slimet er besejret!');
    expect(played()).toContainEqual([sounds.victory.url, sounds.victory.gain]);
    expect(context.all(FakeOscillator).length).toBeGreaterThan(0);
    runLater();
    expect(audios[0]?.pause).toHaveBeenCalledOnce();
    await pause(victoryLength);
    expect(audios[1]?.src).toMatch(/^blob:/);
    expect(audios).toHaveLength(2);
    click('Ny kamp');
    expect(lives(2)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeEnabled();
  });

  it('loses a heart for an answer far off, and lets the hero rest when none are left', async () => {
    const { played, chimed } = open([{ level: 7, sword: 'flamme' }]);
    expect(lives(4)).toBeInTheDocument();
    expect(lives(4)).toHaveAttribute('data-away', 'false');
    click('12');
    expect(lives(4)).toHaveAttribute('data-away', 'true');
    expect(lives(4)).toHaveStyle({ '--away': '0.75s' });
    await pause(wrong);
    expect(lives(4)).toHaveAttribute('data-away', 'false');
    for (let bump = 1; bump < 5; bump++) {
      click('12');
      await pause(wrong);
    }
    expect(hearts('0')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Helten er træt og hviler sig.');
    expect(played()).toContainEqual([sounds.bump.url, sounds.bump.gain]);
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
    expect(lives(3)).toBeInTheDocument();
    expect(screen.getByText('Nu er det Fars tur')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '12 gange 2' })).toBeInTheDocument();
    click('12');
    expect(hearts('4')).toBeInTheDocument();
    await pause(wrong);
    expect(screen.getByText('Nu er det Milles tur')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 plus 1' })).toBeInTheDocument();
    click('3');
    expect(hearts('4')).toBeInTheDocument();
    await pause(wrong);
    expect(screen.getByText('Nu er det Fars tur')).toBeInTheDocument();
  });

  it('saves the fight after every answer, with the next turn and its sum', async () => {
    const { onSave } = open(
      [
        { level: 7, sword: 'jern' },
        { level: 1, sword: 'træ' },
      ],
      [far, mille],
    );
    click('12');
    const after = onSave.mock.lastCall?.[0];
    expect(after?.fight).toMatchObject({ health: 8, lives: 3, last: 'bumped' });
    expect(after?.activeId).toBe('mille');
    expect(after?.task.sum).toEqual([1, '+', 1]);
    expect(after?.recent).toEqual(['[12,"×",2]']);
    // The sum answered stays on screen through the pause; the saved next one comes after.
    expect(screen.getByRole('img', { name: '12 gange 2' })).toBeInTheDocument();
    await pause(wrong);
    expect(screen.getByRole('img', { name: '1 plus 1' })).toBeInTheDocument();
  });

  it('goes on from a saved fight, where it was', () => {
    const task = { sum: [3, '+', 4], answer: 7, choices: [6, 7, 8], near: 2 } as const;
    open([{ level: 1, sword: 'jern' }], [mille], {
      fight: { health: 3, lives: 1, outcome: 'fighting', last: 'struck', round: 4, threat: false },
      lives: 3,
      activeId: 'mille',
      task,
      recent: [],
    });
    expect(hearts('1,5')).toBeInTheDocument();
    expect(lives(1)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 plus 4' })).toBeInTheDocument();
  });

  it('saves a new fight when one begins again', async () => {
    const { onSave } = open([{ level: 1, sword: 'træ' }]);
    click('2');
    await pause(right);
    click('2');
    click('Ny kamp');
    expect(onSave.mock.lastCall?.[0]).toMatchObject({
      fight: { health: 10, lives: 2, outcome: 'fighting' },
      lives: 2,
      activeId: 'mille',
    });
  });

  it('defends every third turn: the slime warns, the tab turns blue, and a right answer dodges', async () => {
    const { onSave } = open([{ level: 1, sword: 'flamme' }]);
    expect(screen.getByText('Angreb')).toBeInTheDocument();
    click('2');
    await pause(right);
    click('2');
    // The sum answered still shows as an attack through the pause.
    expect(screen.getByText('Angreb')).toBeInTheDocument();
    await pause(right);
    expect(screen.getByText('Forsvar')).toBeInTheDocument();
    expect(screen.getByLabelText('Rigtigt: du undviger slimets angreb')).toBeInTheDocument();
    click('2');
    expect(lives(2)).toBeInTheDocument();
    expect(hearts('5')).toBeInTheDocument();
    expect(onSave.mock.lastCall?.[0].fight).toMatchObject({ last: 'dodged', threat: false });
    await pause(right);
    expect(screen.getByText('Angreb')).toBeInTheDocument();
  });

  it('lets the slime’s blow land when the answer to defend is wrong', async () => {
    open([{ level: 1, sword: 'jern' }]);
    click('2');
    await pause(right);
    click('2');
    await pause(right);
    click('1');
    expect(hearts('4')).toBeInTheDocument();
  });

  it('uses the page’s clock and the app’s sound when none are given', () => {
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
        settings={[{ level: 1, sword: 'træ' }]}
        saved={null}
        onSave={() => undefined}
        onBack={() => undefined}
      />,
    );
    const choice = container.querySelector('.task-choice');
    if (choice) fireEvent.click(choice);
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement();
    expect(music).toHaveBeenCalledOnce();
    expect(effect).toHaveBeenCalled();
  });
});
