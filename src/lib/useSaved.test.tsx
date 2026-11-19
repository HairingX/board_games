import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Saves } from './saves';
import { useSaved, useSavedEach } from './useSaved';

function fakeSaves(stored: unknown, failRead = false): Saves {
  return {
    read: vi.fn(() => (failRead ? Promise.reject(new Error('broken')) : Promise.resolve(stored))),
    write: vi.fn(() => Promise.reject(new Error('full'))),
    remove: vi.fn(() => Promise.resolve()),
    entries: vi.fn(() => Promise.resolve([])),
  };
}

const revive = (saved: unknown) => (typeof saved === 'number' ? saved : 0);

function Counter({ saves }: { saves: Saves }) {
  const [count, setCount] = useSaved('tæller', revive, saves);
  if (count === undefined) return <p>Henter</p>;
  return (
    <button
      type="button"
      onClick={() => {
        setCount(count + 1);
      }}
    >
      {count}
    </button>
  );
}

describe('useSaved', () => {
  it('reads the save, then saves every change', async () => {
    const saves = fakeSaves(4);
    render(<Counter saves={saves} />);
    expect(screen.getByText('Henter')).toBeInTheDocument();
    const button = await screen.findByRole('button', { name: '4' });
    act(() => {
      button.click();
    });
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(saves.write).toHaveBeenCalledWith('tæller', 5);
  });

  it('revives from nothing when the save cannot be read', async () => {
    render(<Counter saves={fakeSaves(undefined, true)} />);
    expect(await screen.findByRole('button', { name: '0' })).toBeInTheDocument();
  });

  it('ignores a save that arrives after the component is gone', async () => {
    const saves = fakeSaves(7);
    const { unmount } = render(<Counter saves={saves} />);
    unmount();
    await Promise.resolve();
    expect(saves.read).toHaveBeenCalledOnce();
  });

  it('keeps a change made before the save was read, rather than what is read later', async () => {
    let finishRead: (stored: unknown) => void = () => undefined;
    const saves: Saves = {
      ...fakeSaves(undefined),
      read: vi.fn(
        () =>
          new Promise((resolve) => {
            finishRead = resolve;
          }),
      ),
    };
    function Setter() {
      const [value, setValue] = useSaved('tæller', revive, saves);
      return (
        <button
          type="button"
          onClick={() => {
            setValue(9);
          }}
        >
          {value ?? 'Henter'}
        </button>
      );
    }
    render(<Setter />);
    act(() => {
      screen.getByRole('button', { name: 'Henter' }).click();
    });
    await act(async () => {
      finishRead(4);
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
  });
});

describe('useSavedEach', () => {
  /** Each player's score, kept under their own key, with a button to add one to the first. */
  function Scores({ keys, saves }: { keys: readonly string[]; saves: Saves }) {
    const [scores, setScore] = useSavedEach(
      keys,
      (saved, index) => (typeof saved === 'number' ? saved : index * 100),
      saves,
    );
    if (!scores) return <p>Henter</p>;
    return (
      <button
        type="button"
        onClick={() => {
          setScore(0, (scores[0] ?? 0) + 1);
        }}
      >
        {scores.join(' ')}
      </button>
    );
  }

  function savesOf(stored: Record<string, unknown>): Saves {
    return {
      ...fakeSaves(undefined),
      read: vi.fn((key: string) =>
        key === 'broken' ? Promise.reject(new Error('broken')) : Promise.resolve(stored[key]),
      ),
      write: vi.fn(() => Promise.resolve()),
    };
  }

  it('reads every key, revives each by its place, and saves a change to one', async () => {
    const saves = savesOf({ a: 4 });
    render(<Scores keys={['a', 'b', 'broken']} saves={saves} />);
    expect(screen.getByText('Henter')).toBeInTheDocument();
    const button = await screen.findByRole('button', { name: '4 100 200' });
    act(() => {
      button.click();
    });
    expect(screen.getByRole('button', { name: '5 100 200' })).toBeInTheDocument();
    expect(saves.write).toHaveBeenCalledWith('a', 5);
  });

  it('reads once for the same keys in a new list, and again for other keys', async () => {
    const saves = savesOf({ a: 1, c: 3 });
    const { rerender } = render(<Scores keys={['a']} saves={saves} />);
    await screen.findByRole('button', { name: '1' });
    rerender(<Scores keys={['a']} saves={saves} />);
    expect(saves.read).toHaveBeenCalledOnce();
    rerender(<Scores keys={['c']} saves={saves} />);
    expect(screen.getByText('Henter')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('keeps a change made before the keys were read, and survives a failed write', async () => {
    let finishRead: (stored: unknown) => void = () => undefined;
    const saves: Saves = {
      ...fakeSaves(undefined),
      read: vi.fn(
        () =>
          new Promise((resolve) => {
            finishRead = resolve;
          }),
      ),
    };
    function Early() {
      const [values, setValue] = useSavedEach(['x'], () => 0, saves);
      return (
        <button
          type="button"
          onClick={() => {
            setValue(0, 9);
          }}
        >
          {values?.join(' ') ?? 'Henter'}
        </button>
      );
    }
    const { unmount } = render(<Early />);
    act(() => {
      screen.getByRole('button', { name: 'Henter' }).click();
    });
    await act(async () => {
      finishRead(4);
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
    expect(saves.write).toHaveBeenCalledWith('x', 9);
    unmount();
  });

  it('ignores what is read after the component is gone', async () => {
    const saves = savesOf({ a: 1 });
    const { unmount } = render(<Scores keys={['a']} saves={saves} />);
    unmount();
    await Promise.resolve();
    expect(saves.read).toHaveBeenCalledOnce();
  });
});
