import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, seedFamily } from '../../tests/family';
import { about } from '../../tests/games';
import { FamilyProvider } from '../family/FamilyContext';
import { hashPin } from '../family/pin';
import { I18nProvider } from '../i18n/I18n';
import type { GameInfo } from '../lib/games';
import { Start } from './Start';

const games: GameInfo[] = [
  {
    id: 'a',
    about: about('A'),
    languages: ['da'],
    icon: '🅰️',
    audience: 'alle',
    players: { min: 1, max: 1, progress: 'hver' },
    colors: { card: '#000', accent: '#fff' },
  },
];

async function open(onUpdate?: () => void) {
  render(
    <I18nProvider>
      <FamilyProvider>
        <Start games={games} {...(onUpdate ? { onUpdate } : {})} />
      </FamilyProvider>
    </I18nProvider>,
  );
  await screen.findByRole('heading', { name: 'Småspil' });
}

describe('Start', () => {
  it('says what the app is, with the games’ cards, above "Hvem spiller?"', async () => {
    await seedFamily({ profiles: [far] });
    await open();
    expect(
      screen.getByText('Små spil til sofaen, middagsbordet og køreturen.'),
    ).toBeInTheDocument();
    expect(screen.getByText('🅰️')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says what the app is the first time too, and offers its language', async () => {
    await open();
    expect(screen.getByRole('heading', { name: 'Velkommen til Småspil' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sprog'), { target: { value: 'en' } });
    expect(await screen.findByRole('heading', { name: 'Welcome to Småspil' })).toBeInTheDocument();
  });

  it('offers a new version before anyone is chosen', async () => {
    const onUpdate = vi.fn();
    await open(onUpdate);
    expect(screen.getByRole('status')).toHaveTextContent('Der er en ny version af Småspil.');
    fireEvent.click(screen.getByRole('button', { name: 'Opdatér' }));
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it('leaves the header out while the grown-ups’ code is asked for', async () => {
    await seedFamily({ profiles: [far], lock: await hashPin('1234') });
    await open();
    fireEvent.click(screen.getByRole('button', { name: /^Far/ }));
    expect(screen.getByRole('heading', { name: 'Hej, Far' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Småspil' })).not.toBeInTheDocument();
  });
});
