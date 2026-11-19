import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille } from '../../tests/family';
import FakeGame from '../../tests/fixtures/FakeGame';
import { games, type GameInfo } from '../lib/games';
import { I18nProvider } from '../i18n/I18n';
import { Home } from './Home';
import { about } from '../../tests/games';

const playable: GameInfo = {
  id: 'regnespil',
  about: about('Regnespil', 'Plus, minus og gange'),
  languages: ['da', 'en'],
  icon: '🧮',
  audience: 'børn',
  players: { min: 1, max: 4, progress: 'hver' },
  colors: { card: '#1f4e5a', accent: '#e9c46a' },
  Screen: FakeGame,
};

const upcoming: GameInfo = {
  id: 'parkort',
  about: about('Parkort', 'Spørgsmål til to'),
  languages: ['da', 'en'],
  icon: '💞',
  audience: 'voksne',
  players: { min: 2, max: 2, progress: 'sammen' },
  colors: { card: '#3b2638', accent: '#c8a96b' },
};

describe('Home', () => {
  it('says the games are coming when there are none', () => {
    render(
      <Home games={[]} player={far} onSwitch={() => undefined} onSettings={() => undefined} />,
    );
    expect(screen.getByText('Spillene er på vej.')).toBeInTheDocument();
  });

  it('links a playable game to its screen', () => {
    render(
      <Home
        games={[playable]}
        player={far}
        onSwitch={() => undefined}
        onSettings={() => undefined}
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
        onSettings={() => undefined}
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
        onSettings={() => undefined}
        onUpdate={onUpdate}
      />,
    );
    expect(screen.getByText('Der er en ny version af Småspil.')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Opdatér' }).click();
    expect(onUpdate).toHaveBeenCalledOnce();
    rerender(
      <Home games={[]} player={far} onSwitch={() => undefined} onSettings={() => undefined} />,
    );
    expect(screen.queryByText('Der er en ny version af Småspil.')).not.toBeInTheDocument();
  });

  it('greets the player, lets them switch, and offers grown-ups the settings only', () => {
    const onSwitch = vi.fn();
    const onSettings = vi.fn();
    const { rerender } = render(
      <Home games={[]} player={far} onSwitch={onSwitch} onSettings={onSettings} />,
    );
    expect(screen.getByText('Far')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Far, skift spiller' }).click();
    expect(onSwitch).toHaveBeenCalledOnce();
    screen.getByRole('button', { name: 'Indstillinger' }).click();
    expect(onSettings).toHaveBeenCalledOnce();
    rerender(<Home games={[]} player={mille} onSwitch={onSwitch} onSettings={onSettings} />);
    expect(screen.queryByRole('button', { name: 'Indstillinger' })).not.toBeInTheDocument();
  });

  it('shows every registered game', () => {
    render(
      <Home games={games} player={far} onSwitch={() => undefined} onSettings={() => undefined} />,
    );
    const names = [...document.querySelectorAll('.tile-text strong')].map(
      (name) => name.textContent,
    );
    expect(names).toEqual(games.map((game) => game.about.da.title));
  });

  it('says which games are written in another language than the app speaks', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['en-GB'], configurable: true });
    render(
      <I18nProvider>
        <Home games={games} player={far} onSwitch={() => undefined} onSettings={() => undefined} />
      </I18nProvider>,
    );
    expect(await screen.findByRole('button', { name: 'Far, switch player' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parkort/ })).toHaveTextContent('In Danish');
    expect(screen.getByText('Sum Quest')).toBeInTheDocument();
    expect(screen.queryByText('På dansk')).not.toBeInTheDocument();
    Object.defineProperty(navigator, 'languages', { value: ['da-DK', 'da'], configurable: true });
  });
});
