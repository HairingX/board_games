import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
