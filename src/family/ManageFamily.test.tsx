import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille, mor, typePin } from '../../tests/family';
import type { Family } from './family';
import { ManageFamily } from './ManageFamily';
import { hashPin } from './pin';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

/** Opens a profile from the family's list. */
const open = (name: string) => {
  click(new RegExp(`^${name} `));
};

function renderWith(family: Family) {
  const onChange = vi.fn<(family: Family) => void>();
  const onDone = vi.fn();
  const view = render(
    <ManageFamily family={family} current={far} onChange={onChange} onDone={onDone} />,
  );
  const changed = () => onChange.mock.lastCall?.[0];
  return { ...view, onChange, onDone, changed };
}

describe('ManageFamily', () => {
  it('adds a child without a code', () => {
    const { changed } = renderWith({ profiles: [far] });
    click('Tilføj en i familien');
    click('Annullér');
    click('Tilføj en i familien');
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Oscar' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Skifer' }));
    click('Gem');
    expect(changed()?.profiles.map((p) => [p.name, p.role, p.color, p.pin])).toEqual([
      ['Far', 'voksen', 'plum', null],
      ['Oscar', 'barn', 'slate', null],
    ]);
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
  });

  it('changes a profile’s name, colour and language, keeping its role and code', () => {
    const { changed } = renderWith({
      profiles: [far, { ...mille, pin: { salt: 's', hash: 'h' } }],
    });
    expect(screen.getByText('Barn · dansk')).toBeInTheDocument();
    open('Mille');
    click('Annullér');
    open('Mille');
    expect(screen.getByRole('heading', { name: 'Ret Mille' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Voksen eller barn' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Navn')).toHaveValue('Mille');
    expect(screen.getByRole('radio', { name: 'Dansk' })).toBeChecked();
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Milla' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Petrol' }));
    fireEvent.click(screen.getByRole('radio', { name: 'English' }));
    click('Gem');
    expect(changed()?.profiles[1]).toEqual({
      ...mille,
      name: 'Milla',
      color: 'teal',
      language: 'en',
      pin: { salt: 's', hash: 'h' },
    });
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
  });

  it('asks for a code when a grown-up is added', async () => {
    const { changed } = renderWith({ profiles: [far] });
    click('Tilføj en i familien');
    fireEvent.click(screen.getByRole('radio', { name: 'Voksen' }));
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Mor' } });
    click('Gem');
    expect(screen.getByRole('heading', { name: 'Kode til Mor' })).toBeInTheDocument();
    typePin('2222');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    typePin('2222');
    await screen.findByRole('heading', { name: 'Familien' });
    expect(changed()?.profiles[1]).toMatchObject({ name: 'Mor', role: 'voksen' });
    expect(changed()?.profiles[1]?.pin).not.toBeNull();
  });

  it('gives a profile a code, changes it, or takes it away', async () => {
    const { changed, rerender, onChange, onDone } = renderWith({ profiles: [far, mille] });
    open('Mille');
    click('Kode til Mille');
    click('Annullér');
    open('Mille');
    click('Kode til Mille');
    typePin('3333');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    typePin('3333');
    await screen.findByRole('heading', { name: 'Familien' });
    expect(changed()?.profiles[1]?.pin).not.toBeNull();

    const withPin: Family = { profiles: [far, { ...mille, pin: await hashPin('3333') }] };
    rerender(<ManageFamily family={withPin} current={far} onChange={onChange} onDone={onDone} />);
    open('Mille');
    expect(screen.getByRole('button', { name: 'Kode til Mille' })).toHaveTextContent('Skift kode');
    click('Kode til Mille');
    click('Ingen kode');
    expect(changed()?.profiles[1]?.pin).toBeNull();
  });

  it('takes someone out once confirmed, but not oneself or the last grown-up', () => {
    const { changed, onDone } = renderWith({ profiles: [far, mor, mille] });
    open('Far');
    expect(screen.getByRole('button', { name: 'Fjern Far' })).toBeDisabled();
    click('Annullér');
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
    click('Færdig');
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('keeps the last grown-up while there are children', () => {
    const { unmount } = render(
      <ManageFamily
        family={{ profiles: [far, mor, mille] }}
        current={mor}
        onChange={vi.fn()}
        onDone={vi.fn()}
      />,
    );
    open('Far');
    expect(screen.getByRole('button', { name: 'Fjern Far' })).toBeEnabled();
    unmount();
    render(
      <ManageFamily
        family={{ profiles: [far, mille] }}
        current={mor}
        onChange={vi.fn()}
        onDone={vi.fn()}
      />,
    );
    open('Far');
    expect(screen.getByRole('button', { name: 'Fjern Far' })).toBeDisabled();
  });
});
