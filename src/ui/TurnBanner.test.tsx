import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mille } from '../../tests/family';
import { common } from './text';
import { TurnBanner } from './TurnBanner';

describe('TurnBanner', () => {
  it('says whose turn it is, with their picture', () => {
    render(<TurnBanner player={mille} />);
    expect(screen.getByRole('status')).toHaveTextContent('Nu er det Milles tur');
  });

  it('writes the genitive the Danish way, and the English way', () => {
    expect(common.da.turn('Jonas')).toBe('Nu er det Jonas’ tur');
    expect(common.da.turn('Max')).toBe('Nu er det Max’ tur');
    expect(common.en.turn('Jonas')).toBe('It’s Jonas’s turn');
  });
});
