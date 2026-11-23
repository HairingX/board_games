import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameHeader } from './GameHeader';
import { far, mor } from '../../tests/family';
import { GameFrameProvider } from './GameFrame';

describe('GameHeader', () => {
  it('shows the game’s icon beside the title on a game’s screens', () => {
    render(
      <GameFrameProvider icon="🎲" players={[]}>
        <GameHeader title="Testspil" />
      </GameFrameProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Testspil' })).toHaveTextContent('🎲Testspil');
  });

  it('shows no icon outside a game', () => {
    render(<GameHeader title="Indstillinger" />);
    expect(screen.getByRole('heading', { name: 'Indstillinger' })).toHaveTextContent(
      /^Indstillinger$/,
    );
  });

  it('shows who is playing, small, named for screen readers', () => {
    render(
      <GameFrameProvider icon="🎲" players={[far, mor]}>
        <GameHeader title="Testspil" />
      </GameFrameProvider>,
    );
    expect(screen.getByRole('img', { name: 'Spillere: Far og Mor' })).toHaveTextContent('FM');
  });

  it('closes the game from its first screen, and goes back from those further in', () => {
    const { unmount } = render(
      <GameFrameProvider icon="🎲" players={[far]}>
        <GameHeader title="Testspil" />
      </GameFrameProvider>,
    );
    expect(screen.getByRole('link', { name: 'Luk spillet' })).toHaveAttribute('href', '#/');
    unmount();
    render(<GameHeader title="Indstillinger" />);
    expect(screen.getByRole('link', { name: 'Til forsiden' })).toHaveAttribute('href', '#/');
  });

  it('lets others play instead from the players’ pictures on the game’s first screen', () => {
    const changePlayers = vi.fn();
    const { rerender } = render(
      <GameFrameProvider icon="🎲" players={[far, mor]} changePlayers={changePlayers}>
        <GameHeader title="Testspil" />
      </GameFrameProvider>,
    );
    const button = screen.getByRole('button', { name: 'Skift spillere. Spillere: Far og Mor' });
    expect(button).toHaveTextContent('FMSkift');
    fireEvent.click(button);
    expect(changePlayers).toHaveBeenCalledOnce();
    // Further in, the pictures only say who plays, and the button at the left goes back.
    rerender(
      <GameFrameProvider icon="🎲" players={[far, mor]} changePlayers={changePlayers}>
        <GameHeader title="Testspil" onBack={() => undefined} />
      </GameFrameProvider>,
    );
    expect(screen.queryByRole('button', { name: /Skift spillere/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Spillere: Far og Mor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tilbage' })).toBeInTheDocument();
  });
});
