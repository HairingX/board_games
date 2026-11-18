import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { GameInfo } from '../lib/games';
import Home from './Home.svelte';

const game: GameInfo = {
  id: 'regnespil',
  title: 'Regnespil',
  description: 'Plus, minus og gange',
  icon: '🧮',
  load: () => import('../../tests/fixtures/FakeGame.svelte'),
};

describe('Home', () => {
  it('says the games are coming when there are none', () => {
    render(Home, { games: [] });
    expect(screen.getByText('Spillene er på vej.')).toBeInTheDocument();
  });

  it('links each game to its screen', () => {
    render(Home, { games: [game] });
    const link = screen.getByRole('link', { name: /Regnespil/ });
    expect(link).toHaveAttribute('href', '#/spil/regnespil');
    expect(link).toHaveTextContent('Plus, minus og gange');
  });
});
