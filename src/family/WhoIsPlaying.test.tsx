import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { far, mille, savedFamily, seedFamily, typePin } from '../../tests/family';
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

describe('WhoIsPlaying', () => {
  it('welcomes a new family with its first grown-up, and a code', async () => {
    await open();
    expect(screen.getByRole('heading', { name: 'Velkommen til Småspil' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Voksen eller barn' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gem' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: '  Far ' } });
    click('Gem');

    expect(screen.getByRole('heading', { name: 'Kode til Far' })).toBeInTheDocument();
    click('Annullér');
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Far' } });
    click('Gem');
    typePin('1234');
    expect(await screen.findByRole('heading', { name: 'Skriv koden igen' })).toBeInTheDocument();
    expect(screen.getByText(/Guidet adgang/)).toBeInTheDocument();
    typePin('1111');
    expect(await screen.findByText('Koderne var ikke ens. Vælg koden igen.')).toBeInTheDocument();
    typePin('1234');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    typePin('1234');

    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
    const [saved] = (await savedFamily()).profiles;
    expect(saved).toMatchObject({ name: 'Far', role: 'voksen', color: 'plum' });
    expect(saved?.pin).not.toBeNull();
  });

  it('lets the first grown-up go without a code', async () => {
    await open();
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Mor' } });
    click('Gem');
    click('Ingen kode');
    expect(await screen.findByText('Spiller: Mor')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await savedFamily()).profiles[0]?.pin).toBeNull();
    });
  });

  it('lets anyone without a code straight in', async () => {
    await seedFamily({ profiles: [far, mille] });
    await open();
    expect(screen.queryByText('Kode')).not.toBeInTheDocument();
    click(/^Mille/);
    expect(screen.getByText('Spiller: Mille')).toBeInTheDocument();
  });

  it('asks for the code of a profile that has one, and lets in with the right one', async () => {
    await seedFamily({ profiles: [{ ...far, pin: await hashPin('1234') }, mille] });
    await open();
    expect(screen.getByText('Kode')).toBeInTheDocument();
    click(/^Far/);
    expect(screen.getByRole('heading', { name: 'Hej, Far' })).toBeInTheDocument();
    click('Annullér');
    click(/^Far/);
    expect(screen.getByRole('button', { name: 'Slet' })).toBeDisabled();
    click('9');
    click('Slet');
    typePin('4321');
    expect(
      await screen.findByText('Det var ikke den rigtige kode. Prøv igen.'),
    ).toBeInTheDocument();
    typePin('1234');
    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
  });

  it('lets someone who forgot the code in with a sum and a new code, or none', async () => {
    await seedFamily({ profiles: [{ ...far, pin: await hashPin('1234') }] });
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

    expect(screen.getByRole('heading', { name: 'Kode til Far' })).toBeInTheDocument();
    click('Annullér');
    click(/^Far/);
    click('Glemt koden?');
    const [c, d] = screen.getByText(/Hvad er/).textContent.match(/\d+/g) ?? [];
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: String(Number(c) * Number(d)) },
    });
    click('Svar');
    click('Ingen kode');

    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await savedFamily()).profiles[0]?.pin).toBeNull();
    });
  });

  it('needs to be used inside the family', () => {
    function Outside() {
      useFamily();
      return null;
    }
    expect(() => render(<Outside />)).toThrow('useFamily is used outside a FamilyProvider.');
  });
});
