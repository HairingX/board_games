import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { far, mille } from '../../../tests/family';
import { saves } from '../../lib/saves';
import { sound } from '../../lib/sound/engine';
import { soundSaveKey } from '../../lib/sound/settings';
import { startJourney, type Journey } from './journey';
import Regnespil, { adventurePlace, bossPlace, fightPlace, listeningPlace } from './Regnespil';

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  // The app's own sound needs the browser's Web Audio, which the tests have not.
  vi.spyOn(sound, 'prepareEffects').mockResolvedValue(undefined);
  vi.spyOn(sound, 'prepareMusic').mockResolvedValue(undefined);
  vi.spyOn(sound, 'stopMusic').mockReturnValue(undefined);
  vi.spyOn(sound, 'music').mockReturnValue(undefined);
  for (const quiet of ['chime', 'babble'] as const) {
    vi.spyOn(sound, quiet).mockReturnValue(undefined);
  }
  vi.spyOn(sound, 'effect').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function open(place: readonly string[] = []) {
  const go = vi.fn();
  const music = vi.spyOn(sound, 'music').mockReturnValue(undefined);
  render(<Regnespil players={[far, mille]} saveKey="regnespil" place={place} go={go} />);
  return { go, music };
}

/** Where the journey of Far and Mille is saved. */
const journeyKey = 'regnespil/eventyr/rejse/far+mille';

/** One player's part of the setup screen. */
const playerPart = (name: string) =>
  within(screen.getByRole('heading', { name }).closest('li') as HTMLElement);

describe('Regnespil', () => {
  it('suggests where each player starts: a grown-up hard, a child gently', async () => {
    open();
    expect(await screen.findByRole('heading', { name: 'Klar til eventyret' })).toBeInTheDocument();
    const fars = playerPart('Far');
    expect(fars.getByRole('group', { name: 'Fars niveau' })).toHaveTextContent(
      'Niveau 13gymnasieniveau',
    );
    expect(fars.getByRole('radio', { name: /Svær/ })).toBeChecked();
    const milles = playerPart('Mille');
    expect(milles.getByRole('group', { name: 'Milles niveau' })).toHaveTextContent(
      'Niveau 1ca. 0.–1. klasse',
    );
    expect(milles.getByRole('button', { name: 'Lettere' })).toBeDisabled();
    expect(milles.getByRole('radio', { name: /Let/ })).toBeChecked();
  });

  it('keeps each player’s level and sword on their profile', async () => {
    open();
    await screen.findByRole('heading', { name: 'Klar til eventyret' });
    const milles = playerPart('Mille');
    fireEvent.click(milles.getByRole('button', { name: 'Sværere' }));
    fireEvent.click(milles.getByRole('radio', { name: /Mellem/ }));
    expect(milles.getByRole('group', { name: 'Milles niveau' })).toHaveTextContent('Niveau 2');
    fireEvent.click(milles.getByRole('button', { name: 'Lettere' }));
    fireEvent.click(milles.getByRole('radio', { name: 'Guldridder' }));
    expect(
      within(milles.getByRole('radiogroup', { name: 'Milles helt' })).getByRole('radio', {
        name: 'Guldridder',
      }),
    ).toBeChecked();
    await waitFor(async () => {
      expect(await saves.read('regnespil/mille')).toEqual({
        level: 1,
        sword: 'jern',
        hero: 'KnightGold',
        coins: 0,
      });
    });
  });

  it('goes no further than the hardest level', async () => {
    await saves.write('regnespil/far', { level: 15, sword: 'jern' });
    open();
    const fars = await screen.findByRole('group', { name: 'Fars niveau' });
    expect(fars).toHaveTextContent('Niveau 15for mestre');
    expect(within(fars).getByRole('button', { name: 'Sværere' })).toBeDisabled();
    expect(playerPart('Far').getByRole('radio', { name: /Mellem/ })).toBeChecked();
  });

  it('offers the giant slime, as a boss to try, from the setup', async () => {
    const { go } = open();
    fireEvent.click(await screen.findByRole('button', { name: 'Mod kæmpeslimet' }));
    expect(go).toHaveBeenCalledWith([fightPlace, bossPlace]);
  });

  it('fights the boss in its place, beginning afresh from a save against another monster', async () => {
    const task = { sum: [3, '+', 4], answer: 7, choices: [6, 7, 8], near: 2 };
    await saves.write('regnespil/far', { level: 13, sword: 'flamme', hero: 'Knight', coins: 0 });
    await saves.write('regnespil/mille', { level: 1, sword: 'træ', hero: 'Monkey', coins: 0 });
    await saves.write('regnespil/kamp/far+mille', {
      fight: { health: 4, lives: 1, outcome: 'fighting', last: 'struck' },
      lives: 3,
      activeId: 'mille',
      task,
      recent: [],
    });
    render(
      <Regnespil
        players={[far, mille]}
        saveKey="regnespil"
        place={[fightPlace, bossPlace]}
        go={vi.fn()}
      />,
    );
    expect(await screen.findByRole('img', { name: 'Kæmpeslimets liv: 18' })).toBeInTheDocument();
  });

  it('starts a quick fight with its music from the tap', async () => {
    const { go, music } = open();
    fireEvent.click(await screen.findByRole('button', { name: 'En hurtig kamp' }));
    expect(music).toHaveBeenCalledOnce();
    expect(go).toHaveBeenCalledWith([fightPlace]);
  });

  it('sets how loud music and effects play, and keeps it on the phone', async () => {
    const levels = vi.spyOn(sound, 'setSettings');
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Lyd' }));
    fireEvent.change(screen.getByRole('slider', { name: /Musik/ }), { target: { value: '40' } });
    expect(levels).toHaveBeenLastCalledWith({ music: 0.4, effects: 1 });
    await waitFor(async () => {
      expect(await saves.read(soundSaveKey)).toEqual({ music: 0.4, effects: 1 });
    });
  });

  it('opens the listening test from the setup, and goes back', async () => {
    const { go } = open();
    fireEvent.click(await screen.findByRole('button', { name: 'Lyttetest' }));
    expect(go).toHaveBeenCalledWith([listeningPlace]);
  });

  it('shows the listening test in its place', async () => {
    const { go } = open([listeningPlace]);
    expect(await screen.findByRole('heading', { name: /Lyttetest/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(go).toHaveBeenCalledWith([]);
  });

  it('puts a victory’s coins in the player’s purse, kept on their profile', async () => {
    const task = { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 };
    await saves.write('regnespil/mille', { level: 1, sword: 'træ', hero: 'Monkey', coins: 4 });
    await saves.write('regnespil/kamp/mille', {
      fight: { health: 10, lives: 1, outcome: 'fighting', last: 'struck' },
      lives: 2,
      activeId: 'mille',
      task,
      recent: [],
    });
    render(<Regnespil players={[mille]} saveKey="regnespil" place={[fightPlace]} go={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: '2' }));
    await waitFor(async () => {
      expect(await saves.read('regnespil/mille')).toMatchObject({ coins: 7 });
    });
  });

  it('goes on with a saved fight when it is opened again, and begins afresh without its player', async () => {
    // Its own players' swords, whatever other tests saved: flame and wood, 4 and 2 lives.
    await saves.write('regnespil/far', { level: 13, sword: 'flamme', hero: 'Knight', coins: 0 });
    await saves.write('regnespil/mille', { level: 1, sword: 'træ', hero: 'Monkey', coins: 0 });
    const task = { sum: [3, '+', 4], answer: 7, choices: [6, 7, 8], near: 2 };
    const fight = { health: 4, lives: 1, outcome: 'fighting', last: 'struck' };
    await saves.write('regnespil/kamp/far+mille', {
      fight,
      lives: 3,
      activeId: 'mille',
      task,
      recent: [],
    });
    const { unmount } = render(
      <Regnespil players={[far, mille]} saveKey="regnespil" place={[fightPlace]} go={vi.fn()} />,
    );
    expect(await screen.findByRole('img', { name: 'Slimets liv: 1' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 plus 4' })).toBeInTheDocument();
    unmount();
    await saves.write('regnespil/kamp/far+mille', {
      fight,
      lives: 3,
      activeId: 'oscar',
      task,
      recent: [],
    });
    render(
      <Regnespil players={[far, mille]} saveKey="regnespil" place={[fightPlace]} go={vi.fn()} />,
    );
    expect(await screen.findByRole('img', { name: 'Slimets liv: 6' })).toBeInTheDocument();
  });

  it('fights in the clearing, and goes back to the setup', async () => {
    const { go } = open([fightPlace]);
    expect(await screen.findByRole('img', { name: /Slimets liv/ })).toBeInTheDocument();
    expect(screen.getByText('Nu er det Fars tur')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(go).toHaveBeenCalledWith([]);
  });

  it('begins the adventure from the setup, with its music from the tap', async () => {
    const { go, music } = open();
    fireEvent.click(await screen.findByRole('button', { name: 'Start eventyret' }));
    expect(go).toHaveBeenCalledWith([adventurePlace]);
    expect(music).toHaveBeenCalled();
    await waitFor(async () => {
      expect(await saves.read(journeyKey)).toMatchObject({ scene: 'film', at: 'hund' });
    });
  });

  it('shows the film, then the copper dog, when the adventure is opened without a journey', async () => {
    open([adventurePlace]);
    fireEvent.click(await screen.findByRole('button', { name: /Spring over/ }, { timeout: 4000 }));
    expect(await screen.findByRole('img', { name: /Kobberhunden er sur/ })).toBeInTheDocument();
  });

  it('goes on with the adventure, or asks before beginning it again', async () => {
    await saves.write(journeyKey, { ...startJourney(3), scene: 'map', done: ['hund'] });
    const { go } = open();
    fireEvent.click(await screen.findByRole('button', { name: 'Start eventyret forfra' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('mønterne i pungene bliver');
    fireEvent.click(screen.getByRole('button', { name: 'Annullér' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fortsæt eventyret' }));
    expect(go).toHaveBeenLastCalledWith([adventurePlace]);
    fireEvent.click(screen.getByRole('button', { name: 'Start eventyret forfra' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ja, start forfra' }));
    await waitFor(async () => {
      expect(await saves.read(journeyKey)).toMatchObject({ scene: 'film', done: [] });
    });
  });

  it('goes on with a journey standing at a fight, its music begun from the tap', async () => {
    await saves.write(journeyKey, { ...startJourney(5), scene: 'fight' });
    const { music } = open();
    fireEvent.click(await screen.findByRole('button', { name: 'Fortsæt eventyret' }));
    expect(music).toHaveBeenCalledWith(expect.stringContaining('Fight'), expect.any(Number));
  });

  it('never goes on with a fight of a journey begun before', async () => {
    await saves.write('regnespil/eventyr/kamp/far+mille', {
      fight: { health: 10, lives: 0, outcome: 'won', last: 'struck' },
      lives: 9,
      activeId: 'far',
      task: { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 },
      recent: [],
      foe: 'copperDog',
      step: '3/hund',
    });
    await saves.write(journeyKey, { ...startJourney(4), scene: 'fight' });
    open([adventurePlace]);
    expect(await screen.findByRole('img', { name: /Kobberhunden er sur/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Videre' })).not.toBeInTheDocument();
  });

  it('begins a journey anew from the setup once the last one has ended', async () => {
    await saves.write(journeyKey, { ...startJourney(3), scene: 'end', at: 'træet' });
    open();
    fireEvent.click(await screen.findByRole('button', { name: 'Start eventyret' }));
    await waitFor(async () => {
      expect(await saves.read(journeyKey)).toMatchObject({ scene: 'film', at: 'hund' });
    });
  });

  it('opens the chest after the copper dog, and walks on from the map to the next fight', async () => {
    await saves.write(journeyKey, { ...startJourney(3), scene: 'chest', done: ['hund'] });
    open([adventurePlace]);
    fireEvent.click(await screen.findByRole('button', { name: 'Åbn kisten' }));
    const [first] = screen
      .getAllByRole('button')
      .filter((one) => one.classList.contains('rs-treasure'));
    fireEvent.click(first as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /^Tag / }));
    const step = await screen.findByRole(
      'button',
      { name: 'Gå videre og kæmp mod slimet' },
      { timeout: 3000 },
    );
    fireEvent.click(step);
    expect(
      await screen.findByRole('img', { name: /Slimets liv/ }, { timeout: 3000 }),
    ).toBeInTheDocument();
    const saved = (await saves.read(journeyKey)) as Journey;
    expect(saved).toMatchObject({ at: 'sti', scene: 'fight' });
    expect(saved.treasures).toHaveLength(1);
  });

  it('goes on from a fight won on the journey, and ends the chapter at the hollow tree', async () => {
    const task = { sum: [1, '+', 1], answer: 2, choices: [1, 2, 3], near: 2 };
    await saves.write('regnespil/mille', { level: 1, sword: 'træ', hero: 'Monkey', coins: 0 });
    await saves.write(journeyKey.replace('far+mille', 'mille'), {
      ...startJourney(3),
      at: 'træet',
      done: ['hund', 'sti', 'eng', 'lysning'],
      treasures: ['goldPouch'],
      scene: 'fight',
    });
    await saves.write('regnespil/eventyr/kamp/mille', {
      fight: { health: 10, lives: 1, outcome: 'fighting', last: 'struck' },
      lives: 6,
      activeId: 'mille',
      task,
      recent: [],
      foe: 'giantSlime',
      step: '3/træet',
    });
    render(
      <Regnespil players={[mille]} saveKey="regnespil" place={[adventurePlace]} go={vi.fn()} />,
    );
    expect(await screen.findByRole('img', { name: 'Kæmpeslimets liv: 1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Videre' }, { timeout: 3000 }));
    // Each coin of the victory worth two, from the gold pouch.
    await waitFor(async () => {
      expect(await saves.read('regnespil/mille')).toMatchObject({ coins: 6 });
    });
    fireEvent.click(await screen.findByRole('button', { name: /Spring over/ }, { timeout: 4000 }));
    expect(screen.getByRole('heading', { name: 'Kapitel 1 er klaret!' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Spil kapitlet igen' }));
    expect(await screen.findByRole('img', { name: 'Eventyrets film' })).toBeInTheDocument();
  });
});
