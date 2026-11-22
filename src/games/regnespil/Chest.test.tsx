import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { Chest, chosenFor } from './Chest';
import { sounds } from './sounds';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Chest', () => {
  it('springs open when tapped, offers its treasures, and keeps the one chosen', async () => {
    const engine = new SoundEngine(fakeSoundBrowser().browser);
    const effect = vi.spyOn(engine, 'effect');
    const onChoose = vi.fn();
    const onBack = vi.fn();
    render(
      <Chest
        offers={['heartJar', 'powerRing', 'goldPouch']}
        onChoose={onChoose}
        onBack={onBack}
        sound={engine}
      />,
    );
    expect(screen.queryByRole('button', { name: /Hjertekrukken/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Åbn kisten' }));
    expect(effect).toHaveBeenCalledWith(sounds.chest.url, sounds.chest.gain);
    expect(screen.getByRole('button', { name: 'Åbn kisten' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Vælg én skat' })).toBeInTheDocument();
    const ring = screen.getByRole('button', { name: /Kraftringen/ });
    expect(ring).toHaveTextContent('Kraftslag allerede efter to rigtige i træk');
    expect(screen.getByRole('button', { name: /Guldpungen/ })).toHaveTextContent('×2');
    fireEvent.click(ring);
    expect(screen.getByRole('status')).toHaveTextContent('I tog Kraftringen');
    expect(ring).toHaveAttribute('data-chosen', 'true');
    expect(screen.getByRole('button', { name: /Guldpungen/ })).toHaveAttribute(
      'data-other',
      'true',
    );
    expect(onChoose).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(chosenFor * 1000);
    });
    expect(onChoose).toHaveBeenCalledWith('powerRing');
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows the guard charm as a shield before a heart', () => {
    const engine = new SoundEngine(fakeSoundBrowser().browser);
    render(<Chest offers={['guardCharm']} onChoose={vi.fn()} onBack={vi.fn()} sound={engine} />);
    fireEvent.click(screen.getByRole('button', { name: 'Åbn kisten' }));
    expect(screen.getByRole('button', { name: /Skjoldamuletten/ })).toBeInTheDocument();
  });
});
