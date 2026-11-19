import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser, FakeOscillator } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { motionTokens } from '../../ui/motion';
import { BattleLab } from './BattleLab';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function open() {
  const fake = fakeSoundBrowser();
  const onBack = vi.fn();
  const sound = new SoundEngine(fake.browser);
  const effect = vi.spyOn(sound, 'effect');
  render(
    <BattleLab
      onBack={onBack}
      random={() => 0}
      sound={sound}
      now={() => 50}
      load={() => new Promise(() => undefined)}
    />,
  );
  const played = () => effect.mock.calls.map(([url]) => url);
  return { ...fake, onBack, played };
}

/** Lets the pause after an answer pass, and the sounds be fetched. */
async function pause(seconds: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000);
  });
}

const { right, wrong } = motionTokens.fightPause;

describe('BattleLab', () => {
  it('makes its sounds ready when it opens', () => {
    const { fetch } = open();
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('strikes the slime on a right answer, and asks the next sum after a pause', async () => {
    const { played, onBack } = open();
    expect(screen.getByRole('img', { name: 'Heltens hjerter: 3' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Slimets liv: 3' })).toBeInTheDocument();
    click('2');
    expect(screen.getByRole('img', { name: 'Slimets liv: 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeDisabled();
    await pause(right);
    expect(screen.getByRole('button', { name: '2' })).toBeEnabled();
    expect(played()).toEqual([
      expect.stringContaining('Slash') as string,
      expect.stringContaining('Hit1') as string,
    ]);
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('parries a close answer, taking nothing from either', async () => {
    const { played } = open();
    click('1');
    expect(screen.getByRole('img', { name: 'Heltens hjerter: 3' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Slimets liv: 3' })).toBeInTheDocument();
    await pause(wrong);
    expect(played()).toEqual([expect.stringContaining('Impact') as string]);
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
  });

  it('wins after three strokes, with a jingle and the hero cheering, and starts again', async () => {
    const { context, played } = open();
    for (let stroke = 0; stroke < 3; stroke++) {
      click('2');
      await pause(right);
    }
    expect(screen.getByRole('status')).toHaveTextContent('Slimet er besejret!');
    expect(played()).toContainEqual(expect.stringContaining('Success1'));
    expect(context.all(FakeOscillator).length).toBeGreaterThan(0);
    click('Ny kamp');
    expect(screen.getByRole('img', { name: 'Slimets liv: 3' })).toBeInTheDocument();
  });

  it('loses a heart on an answer far off, and rests once none are left', async () => {
    const { played } = open();
    fireEvent.click(screen.getByRole('radio', { name: '7' }));
    expect(screen.getByText('12 · 2 = ?')).toBeInTheDocument();
    for (let bump = 0; bump < 3; bump++) {
      click('12');
      await pause(wrong);
    }
    expect(screen.getByRole('img', { name: 'Heltens hjerter: 0' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Helten er træt og hviler sig.');
    expect(played()).toContainEqual(expect.stringContaining('Jump'));
    click('Prøv igen');
    expect(screen.getByRole('img', { name: 'Heltens hjerter: 3' })).toBeInTheDocument();
  });

  it('uses the page’s clock and the app’s sound when none are given', () => {
    const { container } = render(<BattleLab onBack={() => undefined} />);
    expect(screen.getByRole('img', { name: /lysning/ })).toBeInTheDocument();
    const choice = container.querySelector('.task-choice');
    if (choice) fireEvent.click(choice);
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement();
  });
});
