import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, typePin } from '../../tests/family';
import { AdultLock } from './AdultLock';
import type { Family } from './family';
import { pinMatches } from './pin';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

function renderWith(family: Family) {
  const onChange = vi.fn<(family: Family) => void>();
  const onBack = vi.fn();
  const view = render(<AdultLock family={family} onChange={onChange} onBack={onBack} />);
  return { ...view, onChange, onBack };
}

describe('AdultLock', () => {
  it('is off until a grown-up turns it on with a code typed twice', async () => {
    const { onChange, onBack } = renderWith({ profiles: [far], lock: null });
    expect(screen.getByText('Fra')).toBeInTheDocument();
    expect(screen.getByText(/før en voksen vælges på »Hvem spiller\?«/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Slå voksenlåsen fra' })).not.toBeInTheDocument();

    click('Slå voksenlåsen til');
    click('Annullér');
    click('Slå voksenlåsen til');
    expect(screen.getByRole('heading', { name: 'Vælg en kode' })).toBeInTheDocument();
    typePin('2468');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    expect(screen.getByText(/Guidet adgang/)).toBeInTheDocument();
    typePin('1111');
    expect(await screen.findByText('Koderne var ikke ens. Vælg koden igen.')).toBeInTheDocument();
    typePin('2468');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    typePin('2468');

    await screen.findByRole('button', { name: 'Slå voksenlåsen til' });
    const lock = onChange.mock.lastCall?.[0].lock;
    expect(lock && (await pinMatches('2468', lock))).toBe(true);
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('changes the code or turns the lock off when it is on', () => {
    const { onChange } = renderWith({ profiles: [far], lock: { salt: 's', hash: 'h' } });
    expect(screen.getByText('Til')).toBeInTheDocument();
    click('Slå voksenlåsen fra');
    expect(onChange).toHaveBeenCalledWith({ profiles: [far], lock: null });
    click('Skift koden');
    expect(screen.getByRole('heading', { name: 'Vælg en kode' })).toBeInTheDocument();
  });
});
