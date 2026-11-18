import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille } from '../../tests/family';
import FakeGame from '../../tests/fixtures/FakeGame';
import { games, type GameInfo } from '../lib/games';
import { Home } from './Home';

const playable: GameInfo = {
  id: 'regnespil',
  title: 'Regnespil',
  description: 'Plus, minus og gange',
  icon: '🧮',
  audience: 'børn',
  players: { min: 1, max: 4, progress: 'hver' },
  colors: { card: '#1f4e5a', accent: '#e9c46a' },
  Screen: FakeGame,
};

const upcoming: GameInfo = {
  id: 'parkort',
  title: 'Parkort',
  description: 'Spørgsmål til to',
  icon: '💞',
  audience: 'voksne',
  players: { min: 2, max: 2, progress: 'sammen' },
  colors: { card: '#3b2638', accent: '#c8a96b' },
};

describe('Home', () => {
  it('says the games are coming when there are none', () => {
    render(
      <Home games={[]} player={far} onSwitch={() => undefined} onManageFamily={() => undefined} />,
    );
    expect(screen.getByText('Spillene er på vej.')).toBeInTheDocument();
  });

  it('links a playable game to its screen', () => {
    render(
      <Home
        games={[playable]}
        player={far}
        onSwitch={() => undefined}
        onManageFamily={() => undefined}
      />,
    );
    const link = screen.getByRole('link', { name: /Regnespil/ });
    expect(link).toHaveAttribute('href', '#/spil/regnespil');
    expect(link).toHaveTextContent('Plus, minus og gange');
    expect(screen.queryByText('Kommer snart')).not.toBeInTheDocument();
  });

  it('shows a game without a screen as coming soon, without a link', () => {
    render(
      <Home
        games={[upcoming]}
        player={far}
        onSwitch={() => undefined}
        onManageFamily={() => undefined}
      />,
    );
    expect(screen.getByText('Parkort')).toBeInTheDocument();
    expect(screen.getByText('Kommer snart')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('offers a waiting new version, and says nothing when there is none', () => {
    const onUpdate = vi.fn();
    const { rerender } = render(
      <Home
        games={[]}
        player={far}
        onSwitch={() => undefined}
        onManageFamily={() => undefined}
        onUpdate={onUpdate}
      />,
    );
    expect(screen.getByText('Der er en ny version af Småspil.')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Opdatér' }).click();
    expect(onUpdate).toHaveBeenCalledOnce();
    rerender(
      <Home games={[]} player={far} onSwitch={() => undefined} onManageFamily={() => undefined} />,
    );
    expect(screen.queryByText('Der er en ny version af Småspil.')).not.toBeInTheDocument();
  });

  it('greets the player, lets them switch, and shows grown-ups their saved games only', () => {
    const onSwitch = vi.fn();
    const onManage = vi.fn();
    const { rerender } = render(
      <Home games={[]} player={far} onSwitch={onSwitch} onManageFamily={onManage} />,
    );
    expect(screen.getByText('Hej, Far')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jeres gemte spil' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Skift spiller' }).click();
    expect(onSwitch).toHaveBeenCalledOnce();
    screen.getByRole('button', { name: 'Familien' }).click();
    expect(onManage).toHaveBeenCalledOnce();
    rerender(<Home games={[]} player={mille} onSwitch={onSwitch} onManageFamily={onManage} />);
    expect(screen.queryByRole('heading', { name: 'Jeres gemte spil' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Familien' })).not.toBeInTheDocument();
  });

  it('shows every registered game', () => {
    render(
      <Home
        games={games}
        player={far}
        onSwitch={() => undefined}
        onManageFamily={() => undefined}
      />,
    );
    for (const game of games) {
      expect(screen.getByText(game.title)).toBeInTheDocument();
    }
  });
});
