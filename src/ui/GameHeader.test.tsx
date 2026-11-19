import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameHeader } from './GameHeader';
import { GameIconProvider } from './GameIcon';

describe('GameHeader', () => {
  it('shows the game’s icon beside the title on a game’s screens', () => {
    render(
      <GameIconProvider icon="🎲">
        <GameHeader title="Testspil" />
      </GameIconProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Testspil' })).toHaveTextContent('🎲Testspil');
  });

  it('shows no icon outside a game', () => {
    render(<GameHeader title="Indstillinger" />);
    expect(screen.getByRole('heading', { name: 'Indstillinger' })).toHaveTextContent(
      /^Indstillinger$/,
    );
  });
});
