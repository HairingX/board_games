import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { startJourney, type Journey } from './journey';
import { sounds } from './sounds';
import { JourneyMap } from './JourneyMap';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function open(journey: Journey) {
  const onGo = vi.fn();
  const onBack = vi.fn();
  const engine = new SoundEngine(fakeSoundBrowser().browser);
  const effect = vi.spyOn(engine, 'effect');
  const view = render(
    <JourneyMap
      journey={journey}
      hero="Knight"
      onGo={onGo}
      onBack={onBack}
      sound={engine}
      now={() => Date.now() / 1000}
      load={() => new Promise(() => undefined)}
    />,
  );
  return { ...view, onGo, onBack, effect };
}

const atFork: Journey = { ...startJourney(1), at: 'sti', done: ['hund', 'sti'], scene: 'map' };

describe('JourneyMap', () => {
  it('shows how far it is to the hollow tree, and the steps the heroes can go to', () => {
    const { container, onBack } = open(atFork);
    expect(screen.getByRole('img', { name: '3 skridt til det hule træ' })).toBeInTheDocument();
    expect(container.querySelectorAll('.rs-progress-pip[data-done="true"]')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Gå videre og kæmp mod slimet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Gå videre og kæmp mod et stærkt slim' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Et skilt: ad denne vej ligger en kiste' }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.rs-roads line[data-walked="true"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('walks the heroes to the step tapped, and only then goes on', async () => {
    const { onGo, effect } = open(atFork);
    fireEvent.click(screen.getByRole('button', { name: /et stærkt slim/ }));
    expect(effect).toHaveBeenCalledWith(sounds.choose.url, sounds.choose.gain);
    expect(screen.getByRole('button', { name: /et stærkt slim/ })).toBeDisabled();
    expect(onGo).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onGo).toHaveBeenCalledWith('krat');
  });

  it('names the way to a chest, and to the boss at the hollow tree', () => {
    const { unmount } = open({ ...atFork, at: 'krat', done: ['hund', 'sti', 'krat'] });
    expect(screen.getByRole('button', { name: 'Gå hen til kisten' })).toBeInTheDocument();
    unmount();
    open({ ...atFork, at: 'lysning', done: ['hund', 'sti', 'eng', 'lysning'] });
    expect(
      screen.getByRole('button', { name: 'Gå til det hule træ og kæmp mod kæmpeslimet' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 skridt til det hule træ' })).toBeInTheDocument();
  });
});
