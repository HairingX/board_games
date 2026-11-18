import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille } from '../../tests/family';
import FakeGame from '../../tests/fixtures/FakeGame';
import { games, type GameInfo } from '../lib/games';
import { Home } from './Home';
import { about } from '../../tests/games';
import { renderWithLanguage } from '../../tests/i18n';

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
  it('says the games are coming when there are none', async () => {
    await renderWithLanguage(
      <Home games={[]} player={far} onSwitch={() => undefined} onManageFamily={() => undefined} />,
    );
    expect(screen.getByText('Spillene er på vej.')).toBeInTheDocument();
  });

  it('links a playable game to its screen', async () => {
    await renderWithLanguage(
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

  it('shows a game without a screen as coming soon, without a link', async () => {
    await renderWithLanguage(
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

  it('offers a waiting new version, and says nothing when there is none', async () => {
    const onUpdate = vi.fn();
    const { rerender } = await renderWithLanguage(
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

  it('greets the player, lets them switch, and shows grown-ups their saved games only', async () => {
    const onSwitch = vi.fn();
    const onManage = vi.fn();
    const { rerender } = await renderWithLanguage(
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

  it('shows every registered game', async () => {
    await renderWithLanguage(
      <Home
        games={games}
        player={far}
        onSwitch={() => undefined}
        onManageFamily={() => undefined}
      />,
    );
    for (const game of games) {
      expect(screen.getByText(game.about.da.title)).toBeInTheDocument();
    }
  });

  it('lets grown-ups choose the language, and says which games are written in another', async () => {
    await renderWithLanguage(
      <Home
        games={games}
        player={far}
        onSwitch={() => undefined}
        onManageFamily={() => undefined}
      />,
    );
    const language = screen.getByRole('radiogroup', { name: 'Sprog' });
    expect(within(language).getByRole('radio', { name: 'Dansk' })).toBeChecked();
    expect(screen.queryByText('På dansk')).not.toBeInTheDocument();

    fireEvent.click(within(language).getByRole('radio', { name: 'English' }));
    expect(await screen.findByRole('radiogroup', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('lang', 'en');
    expect(screen.getByText('Hi, Far')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Parkort/ })).toHaveTextContent('In Danish');
    expect(screen.getByText('Sum Quest')).toBeInTheDocument();
  });

  it('does not let children change the language', async () => {
    await renderWithLanguage(
      <Home
        games={[]}
        player={mille}
        onSwitch={() => undefined}
        onManageFamily={() => undefined}
      />,
    );
    expect(screen.queryByRole('radiogroup', { name: 'Sprog' })).not.toBeInTheDocument();
  });
});
