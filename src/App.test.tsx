import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { lazy } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { far, mille, mor, playAs, savedFamily, seedFamily, typePin } from '../tests/family';
import FakeGame from '../tests/fixtures/FakeGame';
import { App } from './App';
import { cards } from './games/parkort/cards';
import { newDeck } from './games/parkort/deck';
import type { GameInfo } from './lib/games';
import { saves } from './lib/saves';
import { about } from '../tests/games';

const fakeGame: GameInfo = {
  id: 'testspil',
  about: about('Testspil', 'Bruges kun i tests'),
  languages: ['da', 'en'],
  icon: '🎲',
  audience: 'alle',
  players: { min: 1, max: 2, progress: 'hver' },
  colors: { card: '#000', accent: '#fff' },
  Screen: FakeGame,
};

const grownUpGame: GameInfo = {
  ...fakeGame,
  id: 'voksenspil',
  about: about('Voksenspil'),
  audience: 'voksne',
};

const brokenGame: GameInfo = {
  ...fakeGame,
  id: 'i-stykker',
  Screen: lazy(() => Promise.reject(new Error('offline'))),
};

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

function goTo(hash: string): void {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

/** Renders the app with a family of Far, Mor and Mille, playing as the one named. */
async function startAs(name: string, games?: readonly GameInfo[]): Promise<void> {
  await seedFamily({ profiles: [far, mor, mille] });
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
    click('Skift spiller');
    expect(await screen.findByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
  });

  it('speaks the language chosen on the first screen, whoever plays', async () => {
    await seedFamily({ profiles: [far, mille] });
    render(<App />);
    await screen.findByRole('heading', { name: 'Hvem spiller?' });
    fireEvent.change(screen.getByLabelText('Sprog'), { target: { value: 'en' } });
    expect(await screen.findByRole('heading', { name: 'Who’s playing?' })).toBeInTheDocument();
    await playAs('Mille');
    expect(screen.getByText('Hi, Mille')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('lets a grown-up open the settings from the home screen, and come back', async () => {
    await startAs('Far');
    click('Indstillinger');
    expect(screen.getByRole('heading', { name: 'Indstillinger' })).toBeInTheDocument();
    click(/^Familien/);
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
    click('Tilbage');
    click('Tilbage');
    expect(screen.getByRole('heading', { name: 'Småspil' })).toBeInTheDocument();
  });

  it('asks for the grown-ups’ code when the lock is turned on in the settings', async () => {
    await startAs('Far');
    click('Indstillinger');
    click(/^Voksenlås/);
    click('Slå voksenlåsen til');
    typePin('1357');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    typePin('1357');
    await screen.findByRole('button', { name: 'Slå voksenlåsen fra' });
    await waitFor(async () => {
      expect((await savedFamily()).lock).not.toBeNull();
    });
    click('Tilbage');
    click('Tilbage');
    click('Skift spiller');
    await playAs('Far');
    expect(screen.getByText('Skriv voksenkoden.')).toBeInTheDocument();
  });

  it('asks who joins a game before it starts', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await startAs('Far', [fakeGame]);

    goTo('#/spil/testspil');
    expect(screen.getByRole('heading', { name: 'Hvem er med?' })).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    click(/^Mille/);
    click('Start');
    expect(await screen.findByText('Et testspil')).toBeInTheDocument();
    goTo('#/spil/testspil');
    expect(screen.getByText('Et testspil')).toBeInTheDocument();

    goTo('#/');
    expect(screen.getByRole('link', { name: /Testspil/ })).toBeInTheDocument();
    goTo('#/spil/testspil');
    expect(screen.getByRole('heading', { name: 'Hvem er med?' })).toBeInTheDocument();
  });

  it('gives a couple the Parkort deck that was played before players were chosen', async () => {
    await saves.write('parkort', { ...newDeck(cards), seen: ['os-to-1'] });
    window.location.hash = '#/spil/parkort';
    await startAs('Far');
    click(/^Mor/);
    click('Start');
    expect(await screen.findByText(`1 af ${String(cards.length)}`)).toBeInTheDocument();
    expect(await saves.read('parkort')).toBeUndefined();
    expect(await saves.read('parkort/far+mor')).toMatchObject({ seen: ['os-to-1'] });
    await saves.remove('parkort/far+mor');
  });

  it('starts the game even when the old save cannot be moved', async () => {
    const read = vi.spyOn(saves, 'read');
    window.location.hash = '#/spil/parkort';
    await startAs('Far');
    read.mockRejectedValueOnce(new Error('broken'));
    click(/^Mor/);
    click('Start');
    expect(await screen.findByText(`0 af ${String(cards.length)}`)).toBeInTheDocument();
    read.mockRestore();
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
    click('Opdatér');
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

  it('says so when a game cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    window.location.hash = '#/spil/i-stykker';
    await startAs('Far', [brokenGame]);
    click('Start');
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
