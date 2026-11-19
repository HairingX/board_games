import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { lazy } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { far, mille, mor, playAs, savedFamily, seedFamily, typePin } from '../tests/family';
import { hashPin } from './family/pin';
import { rememberedSaveKey } from './family/remembered';
import FakeGame from '../tests/fixtures/FakeGame';
import { App } from './App';
import { cards } from './games/parkort/cards';
import { newDeck } from './games/parkort/deck';
import type { GameInfo } from './lib/games';
import { betaSaveKey } from './lib/beta';
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
  await screen.findByRole('button', { name: `${name}, skift spiller` });
}

describe('App', () => {
  it('asks who is playing first, then shows the real games', async () => {
    await startAs('Far');
    expect(screen.getByRole('heading', { name: 'Småspil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parkort/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Far, skift spiller' })).toBeInTheDocument();
  });

  it('shows a child only the games for children and everyone, and goes back to choose', async () => {
    await startAs('Mille', [fakeGame, grownUpGame]);
    expect(screen.getByRole('link', { name: /Testspil/ })).toBeInTheDocument();
    expect(screen.queryByText('Voksenspil')).not.toBeInTheDocument();
    expect(screen.queryByText('Jeres gemte spil')).not.toBeInTheDocument();

    goTo('#/spil/voksenspil');
    expect(screen.getByText('Det spil findes ikke.')).toBeInTheDocument();

    goTo('#/');
    click('Mille, skift spiller');
    expect(await screen.findByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
  });

  it('speaks the language chosen on the first screen, whoever plays', async () => {
    await seedFamily({ profiles: [far, mille] });
    render(<App />);
    await screen.findByRole('heading', { name: 'Hvem spiller?' });
    fireEvent.change(screen.getByLabelText('Sprog'), { target: { value: 'en' } });
    expect(await screen.findByRole('heading', { name: 'Who’s playing?' })).toBeInTheDocument();
    await playAs('Mille');
    expect(await screen.findByRole('button', { name: 'Mille, switch player' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('lets a grown-up open the settings from the home screen, and come back', async () => {
    await startAs('Far');
    click('Indstillinger');
    expect(await screen.findByRole('heading', { name: 'Indstillinger' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/indstillinger');
    click(/^Familien/);
    expect(await screen.findByRole('heading', { name: 'Familien' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/indstillinger/familien');
    click('Tilbage');
    await screen.findByRole('heading', { name: 'Indstillinger' });
    click('Tilbage');
    expect(await screen.findByRole('heading', { name: 'Småspil' })).toBeInTheDocument();
  });

  it('asks for the grown-ups’ code when the lock is turned on in the settings', async () => {
    await startAs('Far');
    click('Indstillinger');
    fireEvent.click(await screen.findByRole('button', { name: /^Voksenlås/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Slå voksenlåsen til' }));
    typePin('1357');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    typePin('1357');
    await screen.findByRole('button', { name: 'Slå voksenlåsen fra' });
    await waitFor(async () => {
      expect((await savedFamily()).lock).not.toBeNull();
    });
    click('Tilbage');
    await screen.findByRole('heading', { name: 'Indstillinger' });
    click('Tilbage');
    fireEvent.click(await screen.findByRole('button', { name: 'Far, skift spiller' }));
    await playAs('Far');
    expect(screen.getByText('Skriv voksenkoden.')).toBeInTheDocument();
  });

  it('asks who joins a game, then keeps the players and the place in the address', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await startAs('Far', [fakeGame]);

    goTo('#/spil/testspil');
    expect(screen.getByRole('heading', { name: 'Hvem er med?' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Testspil' })).toHaveTextContent('🎲Testspil');
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    click(/^Mille/);
    click('Start');
    expect(await screen.findByText('Et testspil')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/spil/testspil/far+mille');
    expect(screen.getByText(/Spillere: Far, Mille · testspil ·/)).toBeInTheDocument();
    click('Videre');
    expect(await screen.findByText(/· videre$/)).toBeInTheDocument();
    expect(window.location.hash).toBe('#/spil/testspil/far+mille/videre');

    goTo('#/spil/testspil');
    expect(screen.getByRole('heading', { name: 'Hvem er med?' })).toBeInTheDocument();
  });

  it.each([
    ['someone not in the family', '#/spil/testspil/far+oscar'],
    ['the same player twice', '#/spil/testspil/far+far'],
    ['too many players', '#/spil/testspil/far+mor+mille'],
    ['a child in a grown-ups’ game', '#/spil/voksenspil/far+mille'],
  ])('asks who joins when the address names %s', async (_what, hash) => {
    await startAs('Far', [fakeGame, grownUpGame]);
    goTo(hash);
    expect(screen.getByRole('heading', { name: 'Hvem er med?' })).toBeInTheDocument();
  });

  it('starts Parkort at once for the only two grown-ups, with the deck played before', async () => {
    await saves.write('parkort', { ...newDeck(cards), seen: ['os-to-1'] });
    await startAs('Far');
    goTo('#/spil/parkort');
    expect(await screen.findByText(`1 af ${String(cards.length)}`)).toBeInTheDocument();
    expect(await saves.read('parkort')).toBeUndefined();
    expect(await saves.read('parkort/far+mor')).toMatchObject({ seen: ['os-to-1'] });
    expect(window.location.hash).toBe('#/spil/parkort/far+mor');
    expect(screen.getByRole('img', { name: 'Spillere: Far og Mor' })).toBeInTheDocument();
    await saves.remove('parkort/far+mor');
  });

  it('starts the game even when the old save cannot be moved', async () => {
    const read = vi.spyOn(saves, 'read');
    await startAs('Far');
    read.mockRejectedValueOnce(new Error('broken'));
    goTo('#/spil/parkort');
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
        options?.onRegisteredSW?.(
          'sw.js',
          Object.assign(new EventTarget(), { update }) as unknown as ServiceWorkerRegistration,
        );
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
    await startAs('Far', [brokenGame]);
    goTo('#/spil/i-stykker');
    click('Start');
    expect(await screen.findByText('Spillet kunne ikke hentes.')).toBeInTheDocument();
  });

  it('says so when the hash names no game or page', async () => {
    await startAs('Far', [fakeGame]);
    goTo('#/spil/findes-ikke');
    expect(screen.getByText('Det spil findes ikke.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tilbage til forsiden' })).toHaveAttribute(
      'href',
      '#/',
    );
    goTo('#/findes-ikke');
    expect(screen.getByText('Den side findes ikke.')).toBeInTheDocument();
  });

  it('offers the games still being built only while beta is on', async () => {
    await startAs('Mille');
    expect(screen.queryByRole('link', { name: /Regnespil/ })).not.toBeInTheDocument();
    goTo('#/spil/regnespil');
    expect(screen.getByText('Det spil findes ikke.')).toBeInTheDocument();
  });

  it('keeps children out of the settings', async () => {
    await startAs('Mille');
    goTo('#/indstillinger');
    expect(screen.getByText('Den side findes ikke.')).toBeInTheDocument();
  });

  it('goes home when someone is chosen, wherever the address was', async () => {
    window.location.hash = '#/indstillinger/familien';
    await startAs('Mille');
    await waitFor(() => {
      expect(window.location.hash).toBe('#/');
    });
    expect(screen.getByRole('button', { name: 'Mille, skift spiller' })).toBeInTheDocument();
  });
});

describe('App, opened again', () => {
  async function reopen(remembered: object, hash = ''): Promise<void> {
    await seedFamily({ profiles: [far, mor, mille], lock: await hashPin('1234') });
    await saves.write(rememberedSaveKey, remembered);
    window.location.hash = hash;
    render(<App />);
  }

  it('opens on the start screen, and continues where the player was', async () => {
    await reopen({ player: 'mille', locked: false, place: '#/spil/regnespil', at: 0 });
    expect(await screen.findByRole('heading', { name: 'Småspil' })).toBeInTheDocument();
    expect(screen.getByText('Mille')).toBeInTheDocument();
    click('Fortsæt');
    await waitFor(() => {
      expect(window.location.hash).toBe('#/spil/regnespil');
    });
  });

  it('lets someone else play from the start screen', async () => {
    await reopen({ player: 'mille', locked: false, place: '#/spil/regnespil', at: 0 });
    fireEvent.click(await screen.findByRole('button', { name: 'Skift spiller' }));
    await playAs('Mor');
    expect(screen.getByText('Skriv voksenkoden.')).toBeInTheDocument();
    click('Annullér');
    await playAs('Mille');
    expect(await screen.findByRole('button', { name: 'Mille, skift spiller' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/');
  });

  it('stays on the address it was reloaded on', async () => {
    await reopen(
      { player: 'far', locked: true, place: '#/indstillinger', at: Date.now() },
      '#/indstillinger/familien',
    );
    expect(await screen.findByRole('heading', { name: 'Familien' })).toBeInTheDocument();
    await waitFor(async () => {
      expect(await saves.read(rememberedSaveKey)).toMatchObject({
        place: '#/indstillinger/familien',
      });
    });
  });

  it('opens a game still being built where it was, once beta is known to be on', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await saves.write(betaSaveKey, true);
    await reopen(
      { player: 'mille', locked: false, place: '#/spil/regnespil/mille', at: 0 },
      '#/spil/regnespil/mille',
    );
    expect(await screen.findByRole('heading', { name: /Klar til eventyret/ })).toBeInTheDocument();
    goTo('#/');
    const tile = screen.getByRole('link', { name: /Regnespil/ });
    expect(tile).toHaveTextContent('Under udvikling');
  });

  it('asks a grown-up behind the lock for the code once the app has lain unused', async () => {
    await reopen({ player: 'far', locked: true, place: '#/indstillinger', at: 0 });
    expect(await screen.findByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
  });

  it('notes when the app was last used each time it is left', async () => {
    await reopen({ player: 'mor', locked: true, place: '#/', at: Date.now() - 60_000 });
    await screen.findByText('Mor');
    // React runs effects after it shows a screen; let them run before the app is left.
    await act(() => Promise.resolve());
    const before = Date.now();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'visibilityState');
    await waitFor(async () => {
      const saved = (await saves.read(rememberedSaveKey)) as { at: number };
      expect(saved.at).toBeGreaterThanOrEqual(before);
    });
  });

  it('forgets who played when they switch', async () => {
    await reopen({ player: 'mille', locked: false, place: '#/', at: 0 }, '#/');
    fireEvent.click(await screen.findByRole('button', { name: 'Mille, skift spiller' }));
    expect(await screen.findByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
    await waitFor(async () => {
      expect(await saves.read(rememberedSaveKey)).toMatchObject({ player: null });
    });
  });
});
