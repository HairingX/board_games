import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FakeGame from '../../tests/fixtures/FakeGame';
import { games, type GameInfo } from '../lib/games';
import { Home } from './Home';

const playable: GameInfo = {
  id: 'regnespil',
  title: 'Regnespil',
  description: 'Plus, minus og gange',
  icon: '🧮',
  colors: ['#22c55e', '#0ea5e9'],
  Screen: FakeGame,
};

const upcoming: GameInfo = {
  id: 'parkort',
  title: 'Parkort',
  description: 'Spørgsmål til to',
  icon: '💞',
  colors: ['#f43f5e', '#f59e0b'],
};

describe('Home', () => {
  it('says the games are coming when there are none', () => {
    render(<Home games={[]} />);
    expect(screen.getByText('Spillene er på vej.')).toBeInTheDocument();
  });

  it('links a playable game to its screen', () => {
    render(<Home games={[playable]} />);
    const link = screen.getByRole('link', { name: /Regnespil/ });
    expect(link).toHaveAttribute('href', '#/spil/regnespil');
    expect(link).toHaveTextContent('Plus, minus og gange');
    expect(screen.queryByText('Kommer snart')).not.toBeInTheDocument();
  });

  it('shows a game without a screen as coming soon, without a link', () => {
    render(<Home games={[upcoming]} />);
    expect(screen.getByText('Parkort')).toBeInTheDocument();
    expect(screen.getByText('Kommer snart')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('offers a waiting new version, and says nothing when there is none', () => {
    const onUpdate = vi.fn();
    const { rerender } = render(<Home games={[]} onUpdate={onUpdate} />);
    expect(screen.getByText('Der er en ny version af Småspil.')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Opdatér' }).click();
    expect(onUpdate).toHaveBeenCalledOnce();
    rerender(<Home games={[]} />);
    expect(screen.queryByText('Der er en ny version af Småspil.')).not.toBeInTheDocument();
  });

  it('shows every registered game', () => {
    render(<Home games={games} />);
    for (const game of games) {
      expect(screen.getByText(game.title)).toBeInTheDocument();
    }
  });
});
