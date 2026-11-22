import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { copperChapter, startJourney, type Chapter, type Journey } from './journey';
import { heroFaces } from './heroes';
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

function open(journey: Journey, chapter?: Chapter) {
  const onGo = vi.fn();
  const onBack = vi.fn();
  const engine = new SoundEngine(fakeSoundBrowser().browser);
  const effect = vi.spyOn(engine, 'effect');
  const view = render(
    <JourneyMap
      journey={journey}
      heroes={['Knight', 'Monkey']}
      onGo={onGo}
      onBack={onBack}
      sound={engine}
      {...(chapter ? { chapter } : {})}
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
    // The sign at the fork leads down the detour, as its step does.
    expect(
      screen.getByRole('button', {
        name: 'Et skilt: forbi et stærkt slim ligger en kiste ad denne vej. Gå videre og kæmp mod et stærkt slim',
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('walks the heroes to the step tapped, and only then goes on', async () => {
    const { onGo, effect } = open(atFork);
    fireEvent.click(screen.getByRole('button', { name: /^Et skilt/ }));
    expect(effect).toHaveBeenCalledWith(sounds.choose.url, sounds.choose.gain);
    expect(
      screen.getByRole('button', { name: /^Gå videre og kæmp mod et stærkt slim/ }),
    ).toBeDisabled();
    expect(onGo).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onGo).toHaveBeenCalledWith('krat');
  });

  it('walks the heroes down the main road when its step is tapped', async () => {
    const { onGo } = open(atFork);
    fireEvent.click(screen.getByRole('button', { name: 'Gå videre og kæmp mod slimet' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onGo).toHaveBeenCalledWith('eng');
  });

  it('names the way to a chest, and to the boss at the hollow tree', () => {
    const { unmount } = open({ ...atFork, at: 'krat', done: ['hund', 'sti', 'krat'] });
    expect(screen.getByRole('button', { name: 'Gå hen til kisten' })).toBeInTheDocument();
    // Past the fork, the sign only shows what lay that way.
    expect(
      screen.getByRole('img', {
        name: 'Et skilt: forbi et stærkt slim ligger en kiste ad denne vej',
      }),
    ).toBeInTheDocument();
    unmount();
    open({ ...atFork, at: 'lysning', done: ['hund', 'sti', 'eng', 'lysning'] });
    expect(
      screen.getByRole('button', { name: 'Gå til det hule træ og kæmp mod kæmpeslimet' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 skridt til det hule træ' })).toBeInTheDocument();
  });

  it('shows where the heroes are with a pin of the leader’s face, which walks with them', () => {
    const { container } = open(atFork);
    const pin = container.querySelector('.rs-party');
    expect(pin?.querySelector('img')).toHaveAttribute('src', heroFaces.Knight);
    expect(pin).toHaveAttribute('data-walking', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Gå videre og kæmp mod slimet' }));
    expect(container.querySelector('.rs-party')).toHaveAttribute('data-walking', 'true');
  });

  it('shows on a sign what guards its road and the chest past it, or the chest alone', () => {
    const signs = [
      { x: 20, y: 150, to: 'eng', shows: 'chest' },
      { x: 120, y: 80, to: 'kiste', shows: 'chest' },
    ] as const;
    open(atFork, { ...copperChapter, signs });
    expect(
      screen.getByRole('button', {
        name: 'Et skilt: forbi slimet ligger en kiste ad denne vej. Gå videre og kæmp mod slimet',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Et skilt: ad denne vej ligger en kiste' }),
    ).toBeInTheDocument();
  });
});
