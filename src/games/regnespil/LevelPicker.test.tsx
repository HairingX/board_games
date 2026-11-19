import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LevelPicker } from './LevelPicker';

describe('LevelPicker', () => {
  it('offers fifteen levels, and says which grade a level suits', () => {
    const onChange = vi.fn();
    render(<LevelPicker level={4} onChange={onChange} />);
    expect(screen.getAllByRole('radio')).toHaveLength(15);
    expect(screen.getByRole('radio', { name: '4' })).toBeChecked();
    expect(screen.getByText('Niveau 4 · ca. 2. klasse')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: '15' }));
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it('says whom the levels beyond school suit', () => {
    render(<LevelPicker level={14} onChange={() => undefined} />);
    expect(screen.getByText('Niveau 14 · for voksne')).toBeInTheDocument();
  });
});
