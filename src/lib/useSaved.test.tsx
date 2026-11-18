import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Saves } from './saves';
import { useSaved } from './useSaved';

function fakeSaves(stored: unknown, failRead = false): Saves {
  return {
    read: vi.fn(() => (failRead ? Promise.reject(new Error('broken')) : Promise.resolve(stored))),
    write: vi.fn(() => Promise.reject(new Error('full'))),
    remove: vi.fn(() => Promise.resolve()),
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
});
