import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { far, mille, savedFamily, seedFamily } from '../../tests/family';
import { FamilyProvider, useFamily } from './FamilyContext';
import { hashPin } from './pin';
import { WhoIsPlaying } from './WhoIsPlaying';

/** The app's start, in short: "Hvem spiller?" until someone is chosen. */
function Start() {
  const { current, leave } = useFamily();
  return current ? (
    <>
      <p>Spiller: {current.name}</p>
      <button type="button" onClick={leave}>
        Skift
      </button>
    </>
  ) : (
    <WhoIsPlaying />
  );
}

async function open(): Promise<void> {
  render(
    <FamilyProvider>
      <Start />
    </FamilyProvider>,
  );
  await screen.findByRole('heading');
}

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

async function typePin(pin: string): Promise<void> {
  for (const digit of pin) click(digit);
  await waitFor(() => {
    expect(screen.queryByLabelText(/^[1-3] af 4 cifre$/)).not.toBeInTheDocument();
  });
}

describe('WhoIsPlaying', () => {
  it('welcomes a new family and starts with a grown-up', async () => {
    await open();
    expect(screen.getByRole('heading', { name: 'Velkommen til Småspil' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Voksen eller barn' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gem' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: '  Far ' } });
    click('Gem');

    expect(await screen.findByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
    expect((await savedFamily()).profiles).toMatchObject([
      { name: 'Far', role: 'voksen', color: 'plum' },
    ]);
  });

  it('asks for a code when the first child is added, typed twice alike', async () => {
    await seedFamily({ profiles: [far] });
    await open();
    click('Tilføj en i familien');
    expect(screen.getByRole('radio', { name: 'Barn' })).toBeChecked();
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Mille' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Okker' }));
    click('Gem');

    expect(screen.getByRole('heading', { name: 'Vælg en kode' })).toBeInTheDocument();
    await typePin('1234');
    expect(screen.getByRole('heading', { name: 'Skriv koden igen' })).toBeInTheDocument();
    expect(screen.getByText(/Guidet adgang/)).toBeInTheDocument();
    await typePin('1111');
    expect(screen.getByText('Koderne var ikke ens. Vælg koden igen.')).toBeInTheDocument();
    await typePin('1234');
    await typePin('1234');

    expect(await screen.findByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
    const family = await savedFamily();
    expect(family.profiles.map((p) => [p.name, p.role, p.color])).toEqual([
      ['Far', 'voksen', 'plum'],
      ['Mille', 'barn', 'ochre'],
    ]);
    expect(family.pin).not.toBeNull();
  });

  it('adds a grown-up without a code, and lets the form be left', async () => {
    await seedFamily({ profiles: [far] });
    await open();
    click('Tilføj en i familien');
    click('Annullér');
    click('Tilføj en i familien');
    fireEvent.click(screen.getByRole('radio', { name: 'Voksen' }));
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Mor' } });
    click('Gem');
    await screen.findByRole('button', { name: /^Mor/ });
    expect((await savedFamily()).pin).toBeNull();
  });

  it('lets a grown-up straight in while unlocked, and a child in, locking the app', async () => {
    await seedFamily({ profiles: [far, mille], pin: await hashPin('1234') });
    await open();
    click(/^Far/);
    expect(screen.getByText('Spiller: Far')).toBeInTheDocument();
    click('Skift');
    click(/^Mille/);
    expect(screen.getByText('Spiller: Mille')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await savedFamily()).locked).toBe(true);
    });
  });

  it('asks a grown-up for the code while locked, and unlocks with the right one', async () => {
    await seedFamily({ profiles: [far, mille], locked: true, pin: await hashPin('1234') });
    await open();
    expect(screen.getByText('Kode')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tilføj en i familien' })).not.toBeInTheDocument();

    click(/^Far/);
    click('Annullér');
    click(/^Far/);
    expect(screen.getByRole('button', { name: 'Slet' })).toBeDisabled();
    click('9');
    click('Slet');
    await typePin('4321');
    expect(screen.getByText('Det var ikke den rigtige kode. Prøv igen.')).toBeInTheDocument();
    await typePin('1234');

    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await savedFamily()).locked).toBe(false);
    });
  });

  it('lets a grown-up who forgot the code in with a sum, and asks for a new code later', async () => {
    await seedFamily({ profiles: [far, mille], locked: true, pin: await hashPin('1234') });
    await open();
    click(/^Far/);
    click('Glemt koden?');
    click('Annullér');
    click(/^Far/);
    click('Glemt koden?');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1' } });
    click('Svar');
    expect(screen.getByText('Det var ikke rigtigt. Prøv igen.')).toBeInTheDocument();
    const [a, b] = screen.getByText(/Hvad er/).textContent.match(/\d+/g) ?? [];
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: String(Number(a) * Number(b)) },
    });
    click('Svar');

    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
    await waitFor(async () => {
      expect(await savedFamily()).toMatchObject({ locked: false, pin: null });
    });

    click('Skift');
    click(/^Mille/);
    expect(screen.getByRole('heading', { name: 'Vælg en kode' })).toBeInTheDocument();
    click('Annullér');
    click(/^Mille/);
    await typePin('2468');
    await typePin('2468');
    expect(await screen.findByText('Spiller: Mille')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await savedFamily()).pin).not.toBeNull();
    });
  });

  it('takes someone out of the family, keeps the last grown-up, and changes the code', async () => {
    const mor = { ...far, id: 'mor', name: 'Mor', color: 'teal' as const };
    await seedFamily({ profiles: [far, mor, mille], pin: await hashPin('1234') });
    await open();
    click('Rediger familien');

    click('Fjern Mor');
    click('Annullér');
    click('Fjern Mor');
    click('Ja, fjern');
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Fjern Mor' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Fjern Far' })).toBeDisabled();

    const before = (await savedFamily()).pin;
    click('Skift kode');
    await typePin('5555');
    await typePin('5555');
    expect(await screen.findByRole('heading', { name: 'Familien' })).toBeInTheDocument();
    expect((await savedFamily()).pin).not.toEqual(before);

    click('Færdig');
    expect(screen.getByRole('heading', { name: 'Hvem spiller?' })).toBeInTheDocument();
  });

  it('has no code to change before one is chosen', async () => {
    await seedFamily({ profiles: [far] });
    await open();
    click('Rediger familien');
    expect(screen.queryByRole('button', { name: 'Skift kode' })).not.toBeInTheDocument();
  });

  it('needs to be used inside the family', () => {
    function Outside() {
      useFamily();
      return null;
    }
    expect(() => render(<Outside />)).toThrow('useFamily is used outside a FamilyProvider.');
  });
});
