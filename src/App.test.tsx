import { act, render, screen } from '@testing-library/react';
import { lazy } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FakeGame from '../tests/fixtures/FakeGame';
import { App } from './App';
import type { GameInfo } from './lib/games';

const fakeGame: GameInfo = {
  id: 'testspil',
  title: 'Testspil',
  description: 'Bruges kun i tests',
  icon: '🎲',
  colors: ['#000', '#fff'],
  Screen: FakeGame,
};

const brokenGame: GameInfo = {
  ...fakeGame,
  id: 'i-stykker',
  Screen: lazy(() => Promise.reject(new Error('offline'))),
};

function goTo(hash: string): void {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('App', () => {
  it('starts on the home screen with the real games', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Småspil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parkort/ })).toBeInTheDocument();
  });

  it('loads a real game on demand', async () => {
    window.location.hash = '#/spil/parkort';
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Parkort' })).toBeInTheDocument();
  });

  it('opens a game when the hash names it, and returns home', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(<App games={[fakeGame]} />);

    goTo('#/spil/testspil');
    expect(screen.getByText('Et testspil')).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);

    goTo('#/');
    expect(screen.getByRole('link', { name: /Testspil/ })).toBeInTheDocument();
  });

  it('says so when a game cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.location.hash = '#/spil/i-stykker';
    render(<App games={[brokenGame]} />);
    expect(screen.getByText('Henter spillet…')).toBeInTheDocument();
    expect(await screen.findByText('Spillet kunne ikke hentes.')).toBeInTheDocument();
  });

  it('says so when the hash names no game', () => {
    window.location.hash = '#/spil/findes-ikke';
    render(<App games={[fakeGame]} />);
    expect(screen.getByText('Det spil findes ikke.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tilbage til forsiden' })).toHaveAttribute(
      'href',
      '#/',
    );
  });
});
