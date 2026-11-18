import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';
import type { GameInfo } from './lib/games';

const fakeGame: GameInfo = {
  id: 'testspil',
  title: 'Testspil',
  description: 'Bruges kun i tests',
  icon: '🎲',
  load: () => import('../tests/fixtures/FakeGame.svelte'),
};

const brokenGame: GameInfo = {
  ...fakeGame,
  id: 'i-stykker',
  load: () => Promise.reject(new Error('offline')),
};

function goTo(hash: string): void {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

afterEach(() => {
  window.location.hash = '';
});

describe('App', () => {
  it('starts on the home screen', () => {
    render(App);
    expect(screen.getByRole('heading', { name: 'Småspil' })).toBeInTheDocument();
  });

  it('opens a game when the hash names it, and returns home', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(App, { games: [fakeGame] });

    goTo('#/spil/testspil');
    expect(await screen.findByText('Et testspil')).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);

    goTo('#/');
    expect(await screen.findByRole('link', { name: /Testspil/ })).toBeInTheDocument();
  });

  it('says so when a game cannot be loaded', async () => {
    window.location.hash = '#/spil/i-stykker';
    render(App, { games: [brokenGame] });
    expect(screen.getByText('Henter spillet…')).toBeInTheDocument();
    expect(await screen.findByText('Spillet kunne ikke hentes.')).toBeInTheDocument();
  });

  it('says so when the hash names no game', () => {
    window.location.hash = '#/spil/findes-ikke';
    render(App, { games: [fakeGame] });
    expect(screen.getByText('Det spil findes ikke.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tilbage til forsiden' })).toHaveAttribute(
      'href',
      '#/',
    );
  });
});
