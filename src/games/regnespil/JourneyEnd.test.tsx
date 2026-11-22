import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { JourneyEnd } from './JourneyEnd';

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function open(treasures: Parameters<typeof JourneyEnd>[0]['treasures']) {
  const onAgain = vi.fn();
  const onBack = vi.fn();
  render(
    <JourneyEnd
      heroes={['Knight']}
      treasures={treasures}
      onAgain={onAgain}
      onBack={onBack}
      sound={new SoundEngine(fakeSoundBrowser().browser)}
      now={() => 0}
      load={() => new Promise(() => undefined)}
    />,
  );
  return { onAgain, onBack };
}

describe('JourneyEnd', () => {
  it('plays the end’s film, then shows the chapter done, the treasures found, and to play again', () => {
    const { onAgain } = open(['heartJar', 'guardCharm']);
    expect(screen.getByRole('img', { name: 'Eventyrets film' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Spring over/ }));
    expect(screen.getByRole('heading', { name: 'Kapitel 1 er klaret!' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Skattene I fandt' })).toBeInTheDocument();
    expect(screen.getByText('Hjertekrukken')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Spil kapitlet igen' }));
    expect(onAgain).toHaveBeenCalledOnce();
  });

  it('shows no treasures when none were found, and goes back', () => {
    const { onBack } = open([]);
    fireEvent.click(screen.getByRole('button', { name: /Spring over/ }));
    expect(screen.queryByRole('heading', { name: 'Skattene I fandt' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
