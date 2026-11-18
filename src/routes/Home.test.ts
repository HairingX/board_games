import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { games, type GameInfo } from '../lib/games';
import Home from './Home.svelte';

const playable: GameInfo = {
  id: 'regnespil',
  title: 'Regnespil',
  description: 'Plus, minus og gange',
  icon: '🧮',
  colors: ['#22c55e', '#0ea5e9'],
  load: () => import('../../tests/fixtures/FakeGame.svelte'),
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
    render(Home, { games: [] });
    expect(screen.getByText('Spillene er på vej.')).toBeInTheDocument();
  });

  it('links a playable game to its screen', () => {
    render(Home, { games: [playable] });
    const link = screen.getByRole('link', { name: /Regnespil/ });
    expect(link).toHaveAttribute('href', '#/spil/regnespil');
    expect(link).toHaveTextContent('Plus, minus og gange');
    expect(screen.queryByText('Kommer snart')).not.toBeInTheDocument();
  });

  it('shows a game without a screen as coming soon, without a link', () => {
    render(Home, { games: [upcoming] });
    expect(screen.getByText('Parkort')).toBeInTheDocument();
    expect(screen.getByText('Kommer snart')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows every registered game', () => {
    render(Home, { games });
    for (const game of games) {
      expect(screen.getByText(game.title)).toBeInTheDocument();
    }
  });
});
