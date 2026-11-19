import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille, mor } from '../../tests/family';
import type { SettingsPage } from '../lib/router';
import type { Family } from './family';
import { faces } from './faces';
import { ManageFamily } from './ManageFamily';
import { squarePhoto } from './photo';

vi.mock('./photo', () => ({
  squarePhoto: vi.fn(() => Promise.resolve('data:image/jpeg;base64,AAA')),
}));

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

/** Opens a profile from the family's list. */
const open = (name: string) => {
  click(new RegExp(`^${name} `));
};

type FamilyPage = Extract<SettingsPage, { name: 'family' | 'family-new' | 'person' }>;

/** The family's pages where the settings put them; leaving them calls onBack. */
function InSettings({
  start,
  onBack,
  ...props
}: Omit<Parameters<typeof ManageFamily>[0], 'page' | 'go'> & {
  start: FamilyPage;
  onBack: () => void;
}) {
  const [page, setPage] = useState<FamilyPage>(start);
  return (
    <ManageFamily
      {...props}
      page={page}
      go={(next) => {
        if (next.name === 'main') onBack();
        else setPage(next as FamilyPage);
      }}
    />
  );
}

function renderWith(
  profiles: Family['profiles'],
  current = far,
  start: FamilyPage = { name: 'family' },
) {
  const onChange = vi.fn<(family: Family) => void>();
  const onBack = vi.fn();
  const view = render(
    <InSettings
      family={{ profiles, lock: null }}
      current={current}
      onChange={onChange}
      onBack={onBack}
      start={start}
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

  it('keeps a birthday, given or changed, and leaves it out when cleared', () => {
    const { changed } = renderWith([far, { ...mille, born: '2018-04-23' }]);
    open('Mille');
    const born = screen.getByLabelText('Fødselsdag');
    expect(born).toHaveValue('2018-04-23');
    expect(born).toHaveAccessibleDescription(/Kan udelades/);
    fireEvent.change(born, { target: { value: '2019-05-01' } });
    click('Gem');
    expect(changed()?.profiles[1]).toEqual({ ...mille, born: '2019-05-01' });
    open('Mille');
    fireEvent.change(screen.getByLabelText('Fødselsdag'), { target: { value: '' } });
    click('Gem');
    expect(changed()?.profiles[1]).toEqual(mille);
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

  it('shows the list for a person who is no longer in the family', () => {
    renderWith([far], far, { name: 'person', id: 'mille' });
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
  });

  it('gives a profile a face, an own photo, or its initial again', async () => {
    const { changed, unmount } = renderWith([far, mille]);
    open('Mille');
    const [, second = ''] = [...faces.keys()];
    fireEvent.click(screen.getByRole('radio', { name: 'Ansigt 2' }));
    expect(screen.getByRole('radio', { name: 'Ansigt 2' })).toBeChecked();
    click('Gem');
    expect(changed()?.profiles[1]).toEqual({ ...mille, picture: { kind: 'face', face: second } });

    open('Mille');
    const input = screen.getByLabelText('Vælg dit eget billede');
    click('Vælg dit eget billede');
    fireEvent.change(input, { target: { files: [] } });
    vi.mocked(squarePhoto).mockRejectedValueOnce(new Error('not a picture'));
    fireEvent.change(input, { target: { files: [new File(['x'], 'kat.txt')] } });
    await act(() => Promise.resolve());
    expect(screen.queryByRole('radio', { name: 'Dit eget billede' })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { files: [new File(['x'], 'mig.jpg')] } });
    expect(await screen.findByRole('radio', { name: 'Dit eget billede' })).toBeChecked();
    click('Gem');
    expect(changed()?.profiles[1]?.picture).toEqual({
      kind: 'photo',
      src: 'data:image/jpeg;base64,AAA',
    });
    unmount();

    const withPhoto = {
      ...mille,
      picture: { kind: 'photo', src: 'data:image/png;base64,B' } as const,
    };
    const next = renderWith([far, withPhoto]);
    open('Mille');
    expect(screen.getByRole('radio', { name: 'Dit eget billede' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Forbogstav' }));
    expect(screen.getByRole('radio', { name: 'Forbogstav' })).toHaveTextContent('M');
    click('Gem');
    expect(next.changed()?.profiles[1]).toEqual(mille);
  });

  it('shows a question mark for the initial until a name is written', () => {
    renderWith([far]);
    click('Tilføj en i familien');
    expect(screen.getByRole('radio', { name: 'Forbogstav' })).toHaveTextContent('?');
  });
});
