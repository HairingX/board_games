import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { SoundSettings } from '../lib/sound/engine';
import { SoundMenu } from './SoundMenu';

function Menu() {
  const [settings, setSettings] = useState<SoundSettings>({ music: 1, effects: 0.5 });
  return <SoundMenu settings={settings} onChange={setSettings} />;
}

describe('SoundMenu', () => {
  it('opens a slider for the music and one for the effects, and closes again', () => {
    render(<Menu />);
    const speaker = screen.getByRole('button', { name: 'Lyd' });
    expect(speaker).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(speaker);
    expect(speaker).toHaveAttribute('aria-expanded', 'true');
    const music = screen.getByRole('slider', { name: /Musik/ });
    const effects = screen.getByRole('slider', { name: /Lydeffekter/ });
    expect(music).toHaveValue('100');
    expect(effects).toHaveAttribute('aria-valuetext', '50\u00a0%');
    fireEvent.change(music, { target: { value: '30' } });
    expect(screen.getByRole('slider', { name: /Musik/ })).toHaveAttribute(
      'aria-valuetext',
      '30\u00a0%',
    );
    fireEvent.change(effects, { target: { value: '0' } });
    expect(screen.getByRole('slider', { name: /Lydeffekter/ })).toHaveValue('0');
    fireEvent.click(speaker);
    expect(screen.queryByRole('slider', { name: /Musik/ })).not.toBeInTheDocument();
  });
});
