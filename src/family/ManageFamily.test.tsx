import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille, mor } from '../../tests/family';
import type { Family } from './family';
import { ManageFamily } from './ManageFamily';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

/** Opens a profile from the family's list. */
const open = (name: string) => {
  click(new RegExp(`^${name} `));
};

function renderWith(profiles: Family['profiles'], current = far) {
  const onChange = vi.fn<(family: Family) => void>();
  const onBack = vi.fn();
  const view = render(
    <ManageFamily
      family={{ profiles, lock: null }}
      current={current}
      onChange={onChange}
      onBack={onBack}
    />,
  );
  const changed = () => onChange.mock.lastCall?.[0];
  return { ...view, onChange, onBack, changed };
}

describe('ManageFamily', () => {
  it('lists the family, and goes back to the settings', () => {
    const { onBack } = renderWith([far, mille]);
    expect(screen.getByRole('button', { name: 'Far Voksen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mille Barn' })).toBeInTheDocument();
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('adds a child or a grown-up, without a code', () => {
    const { changed } = renderWith([far]);
    click('Tilføj en i familien');
    click('Annullér');
    click('Tilføj en i familien');
    click('Tilbage');
    click('Tilføj en i familien');
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Oscar' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Skifer' }));
    click('Gem');
    expect(changed()?.profiles.map((p) => [p.name, p.role, p.color])).toEqual([
      ['Far', 'voksen', 'plum'],
      ['Oscar', 'barn', 'slate'],
    ]);
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();

    click('Tilføj en i familien');
    fireEvent.click(screen.getByRole('radio', { name: 'Voksen' }));
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Mor' } });
    click('Gem');
    expect(changed()?.profiles.at(-1)).toMatchObject({ name: 'Mor', role: 'voksen' });
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
  });

  it('changes a profile’s name and colour, keeping its role', () => {
    const { changed } = renderWith([far, mille]);
    open('Mille');
    click('Annullér');
    open('Mille');
    expect(screen.getByRole('heading', { name: 'Ret Mille' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Voksen eller barn' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Navn')).toHaveValue('Mille');
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Milla' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Petrol' }));
    click('Gem');
    expect(changed()?.profiles[1]).toEqual({ ...mille, name: 'Milla', color: 'teal' });
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
  });

  it('takes someone out once confirmed, but not oneself or the last grown-up', () => {
    const { changed } = renderWith([far, mor, mille]);
    open('Far');
    expect(screen.getByRole('button', { name: 'Fjern Far' })).toBeDisabled();
    click('Tilbage');
    open('Mor');
    click('Fjern Mor');
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Annullér' }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    click('Fjern Mor');
    click('Ja, fjern');
    expect(changed()?.profiles.map((p) => p.id)).toEqual(['far', 'mille']);
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
  });

  it('keeps the last grown-up while there are children', () => {
    const { unmount } = renderWith([far, mor, mille], mor);
    open('Far');
    expect(screen.getByRole('button', { name: 'Fjern Far' })).toBeEnabled();
    unmount();
    renderWith([far, mille], mor);
    open('Far');
    expect(screen.getByRole('button', { name: 'Fjern Far' })).toBeDisabled();
  });
});
