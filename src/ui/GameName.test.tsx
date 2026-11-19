import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { about } from '../../tests/games';
import { about as parkort } from '../games/parkort/about';
import { GameName } from './GameName';

describe('GameName', () => {
  it('sets the first of two joined words heavier, reading as one name', () => {
    const { container } = render(<GameName about={parkort} />);
    expect(container.querySelector('b')).toHaveTextContent('Par');
    expect(container.querySelector('.game-name-rest')).toHaveTextContent('kort');
    expect(container).toHaveTextContent(/^Parkort$/);
  });

  it('shows a name without a stress as it is', () => {
    const { container } = render(<GameName about={about('Regnespil')} />);
    expect(container.innerHTML).toBe('Regnespil');
  });
});
