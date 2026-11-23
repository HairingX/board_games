import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille, mor } from '../../tests/family';
import type { GameInfo } from '../lib/games';
import { ChoosePlayers } from './ChoosePlayers';
import type { Family, Profile } from './family';
import { about } from '../../tests/games';

const together: GameInfo = {
  id: 'sammen',
  about: about('Sammen'),
  languages: ['da', 'en'],
  icon: '',
  audience: 'voksne',
  players: { min: 2, max: 2, progress: 'sammen' },
  colors: { card: '#000', accent: '#fff' },
};

const forAll: GameInfo = {
  ...together,
  id: 'alle',
  about: about('Alle'),
  audience: 'alle',
  players: { min: 1, max: 3, progress: 'hver' },
};

const family: Family = { profiles: [far, mor, mille], lock: null };

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

function renderWith(game: GameInfo, current: Profile) {
  const onChange = vi.fn<(family: Family) => void>();
  const onStart = vi.fn<(players: Profile[]) => void>();
  render(
    <ChoosePlayers
      game={game}
      family={family}
      current={current}
      onChange={onChange}
      onStart={onStart}
    />,
  );
  return { onChange, onStart };
}

describe('ChoosePlayers', () => {
  it('offers only those who may play, starting with who is on the home screen', () => {
    const { onStart } = renderWith(together, far);
    expect(screen.getByText('Vælg 2 spillere.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mille/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Far/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();

    click(/Mor/);
    click('Start');
    expect(onStart).toHaveBeenCalledWith([far, mor]);
  });

  it('lets no more join than the game takes, and lets players leave again', () => {
    renderWith(together, far);
    click(/Mor/);
    click(/Far/);
    expect(screen.getByRole('button', { name: /Far/ })).toHaveAttribute('aria-pressed', 'false');
    click(/Far/);
    renderWith(forAll, mille);
    expect(screen.getByText('Vælg 1–3 spillere.')).toBeInTheDocument();
  });

  it('greys out the others once the game is full', () => {
    renderWith({ ...forAll, players: { min: 1, max: 1, progress: 'hver' } }, far);
    expect(screen.getByRole('button', { name: /Mor/ })).toBeDisabled();
  });

  it('lets a child add only children, and joins the new player', () => {
    const { onChange } = renderWith(forAll, mille);
    click('Tilføj en ny spiller');
    expect(screen.queryByRole('radiogroup', { name: 'Voksen eller barn' })).not.toBeInTheDocument();
    click('Annullér');
    click('Tilføj en ny spiller');
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Oscar' } });
    click('Gem');
    const added = onChange.mock.lastCall?.[0].profiles.at(-1);
    expect(added).toMatchObject({ name: 'Oscar', role: 'barn' });
  });

  it('adds grown-ups to a game for grown-ups', () => {
    const { onChange } = renderWith(together, far);
    click('Tilføj en ny spiller');
    expect(screen.queryByRole('radiogroup', { name: 'Voksen eller barn' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Moster' } });
    click('Gem');
    expect(onChange.mock.lastCall?.[0].profiles.at(-1)).toMatchObject({ role: 'voksen' });
  });

  it('lets a grown-up choose who a new player is in a game for everyone', () => {
    renderWith(forAll, far);
    click('Tilføj en ny spiller');
    expect(screen.getByRole('radiogroup', { name: 'Voksen eller barn' })).toBeInTheDocument();
  });

  it('does not join a new player when the game is full', () => {
    const { onStart } = renderWith(
      { ...forAll, players: { min: 1, max: 1, progress: 'hver' } },
      far,
    );
    click('Tilføj en ny spiller');
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Gæst' } });
    click('Gem');
    click('Start');
    expect(onStart).toHaveBeenCalledWith([far]);
  });

  it('says whether the players chosen go on with their game or begin a new one', async () => {
    const going = vi.fn((players: readonly Profile[]) =>
      Promise.resolve(players.some((player) => player.id === mille.id)),
    );
    const onStart = vi.fn();
    render(
      <ChoosePlayers
        game={forAll}
        family={family}
        current={far}
        onChange={vi.fn()}
        onStart={onStart}
        chosen={[far.id, mille.id]}
        going={going}
      />,
    );
    expect(
      await screen.findByText('Far og Mille har et spil i gang. Det fortsætter, hvor det slap.'),
    ).toBeInTheDocument();
    click('Fortsæt spillet');
    expect(onStart).toHaveBeenCalledWith([far, mille]);
    click(/^Mille/);
    expect(
      await screen.findByText('Far har ikke et spil i gang, så et nyt begynder.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start et nyt spil' })).toBeEnabled();
    // With no one chosen, nothing is asked or said.
    click(/^Far/);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    });
    expect(going).toHaveBeenCalledTimes(2);
  });

  it('says nothing while it is not known, or if it cannot be found out', async () => {
    let answer: (going: boolean) => void = () => undefined;
    const { unmount } = render(
      <ChoosePlayers
        game={forAll}
        family={family}
        current={far}
        onChange={vi.fn()}
        onStart={vi.fn()}
        going={() =>
          new Promise((resolve) => {
            answer = resolve;
          })
        }
      />,
    );
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
    unmount();
    answer(true);
    render(
      <ChoosePlayers
        game={forAll}
        family={family}
        current={far}
        onChange={vi.fn()}
        onStart={vi.fn()}
        going={() => Promise.reject(new Error('broken'))}
      />,
    );
    await Promise.resolve();
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
  });
});
