import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { lazy } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { far, mille, playAs, seedFamily } from '../tests/family';
import FakeGame from '../tests/fixtures/FakeGame';
import { App } from './App';
import type { GameInfo } from './lib/games';

const fakeGame: GameInfo = {
  id: 'testspil',
  title: 'Testspil',
  description: 'Bruges kun i tests',
  icon: '🎲',
  audience: 'alle',
  colors: { card: '#000', accent: '#fff' },
  Screen: FakeGame,
};

const grownUpGame: GameInfo = {
  ...fakeGame,
  id: 'voksenspil',
  title: 'Voksenspil',
  audience: 'voksne',
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

/** Renders the app with a family of Far and Mille, playing as the one named. */
async function startAs(name: string, games?: readonly GameInfo[]): Promise<void> {
  await seedFamily({ profiles: [far, mille], pin: { salt: 's', hash: 'h' } });
  render(games ? <App games={games} /> : <App />);
  await playAs(name);
}

describe('App', () => {
  it('asks who is playing first, then shows the real games', async () => {
    await startAs('Far');
    expect(screen.getByRole('heading', { name: 'Småspil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parkort/ })).toBeInTheDocument();
    expect(screen.getByText('Hej, Far')).toBeInTheDocument();
  });

  it('shows a child only the games for children and everyone, and goes back to choose', async () => {
    await startAs('Mille', [fakeGame, grownUpGame]);
    expect(screen.getByRole('link', { name: /Testspil/ })).toBeInTheDocument();
    expect(screen.queryByText('Voksenspil')).not.toBeInTheDocument();
    expect(screen.queryByText('Jeres gemte spil')).not.toBeInTheDocument();

    goTo('#/spil/voksenspil');
    expect(screen.getByText('Det spil findes ikke.')).toBeInTheDocument();

    goTo('#/');
    fireEvent.click(screen.getByRole('button', { name: 'Skift spiller' }));
    expect(await screen.findByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
  });

  it('offers a waiting new version on the home screen, and loads it when asked', async () => {
    const updateServiceWorker = vi.fn(() => Promise.resolve());
    const original = vi.mocked(useRegisterSW).getMockImplementation();
    vi.mocked(useRegisterSW).mockImplementation(() => ({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    }));
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: {} },
    });
    await startAs('Far');
    screen.getByRole('button', { name: 'Opdatér' }).click();
    expect(updateServiceWorker).toHaveBeenCalledOnce();
    Reflect.deleteProperty(navigator, 'serviceWorker');
    if (original) vi.mocked(useRegisterSW).mockImplementation(original);
  });

  it('asks the registered service worker for a new version when the app comes back', async () => {
    const update = vi.fn(() => Promise.resolve());
    vi.mocked(useRegisterSW).mockImplementationOnce((options) => {
      setTimeout(() => {
        options?.onRegisteredSW?.('sw.js', { update } as unknown as ServiceWorkerRegistration);
      });
      return {
        needRefresh: [false, vi.fn()],
        offlineReady: [false, vi.fn()],
        updateServiceWorker: vi.fn(() => Promise.resolve()),
      };
    });
    await startAs('Far');
    await waitFor(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      expect(update).toHaveBeenCalled();
    });
  });

  it('loads a real game on demand', async () => {
    window.location.hash = '#/spil/parkort';
    await startAs('Far');
    expect(await screen.findByRole('heading', { name: 'Parkort' })).toBeInTheDocument();
  });

  it('opens a game when the hash names it, and returns home', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await startAs('Far', [fakeGame]);

    goTo('#/spil/testspil');
    expect(screen.getByText('Et testspil')).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);

    goTo('#/');
    expect(screen.getByRole('link', { name: /Testspil/ })).toBeInTheDocument();
  });

  it('says so when a game cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.location.hash = '#/spil/i-stykker';
    await startAs('Far', [brokenGame]);
    expect(await screen.findByText('Spillet kunne ikke hentes.')).toBeInTheDocument();
  });

  it('says so when the hash names no game', async () => {
    window.location.hash = '#/spil/findes-ikke';
    await startAs('Far', [fakeGame]);
    expect(screen.getByText('Det spil findes ikke.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tilbage til forsiden' })).toHaveAttribute(
      'href',
      '#/',
    );
  });
});
