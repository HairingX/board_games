import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fakeSoundBrowser, FakeBufferSource } from '../../../tests/audio';
import { SoundEngine } from '../../lib/sound/engine';
import { TaskLab } from './TaskLab';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

function open(random: () => number) {
  const fake = fakeSoundBrowser();
  const onBack = vi.fn();
  render(<TaskLab onBack={onBack} random={random} sound={new SoundEngine(fake.browser)} />);
  return { ...fake, onBack };
}

/** The sums the page shows, read aloud. */
const sum = () => screen.getByRole('img').getAttribute('aria-label');

describe('TaskLab', () => {
  it('asks a sum at level 1, and says the right answer is right, with a sound', async () => {
    const { context, onBack } = open(() => 0);
    expect(screen.getByRole('radio', { name: '1' })).toBeChecked();
    expect(screen.getByText('Niveau 1 · ca. 0.–1. klasse')).toBeInTheDocument();
    expect(sum()).toBe('1 plus 1');
    expect(screen.getByRole('img', { name: '1 plus 1' })).toHaveTextContent('1 + 1 = ?');
    click('2');
    expect(screen.getByRole('status')).toHaveTextContent('Rigtigt!');
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('data-state', 'right');
    expect(screen.getByText('1 af 1 rigtige')).toBeInTheDocument();
    await act(() => Promise.resolve());
    expect(context.all(FakeBufferSource)).toHaveLength(1);
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows a near answer as close and a far one as far, with the right answer', () => {
    open(() => 0);
    click('1');
    expect(screen.getByRole('status')).toHaveTextContent('Tæt på. Det rigtige svar er 2.');
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('data-state', 'close');
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('data-state', 'right');
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('data-state', 'other');
    expect(screen.getByRole('button', { name: '3' })).toBeDisabled();
    click('Næste');
    expect(screen.queryByRole('button', { name: 'Næste' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: '7' }));
    expect(screen.getByText('0 af 0 rigtige')).toBeInTheDocument();
    expect(sum()).toBe('12 gange 2');
    click('12');
    expect(screen.getByRole('status')).toHaveTextContent('Det rigtige svar er 24.');
    expect(screen.getByRole('button', { name: '12' })).toHaveAttribute('data-state', 'far');
  });

  it('asks the order of operations at level 8', () => {
    open(() => 0);
    fireEvent.click(screen.getByRole('radio', { name: '8' }));
    expect(screen.getByRole('img', { name: '2 plus 2 gange 2' })).toHaveTextContent(
      '2 + 2 · 2 = ?',
    );
  });
});
