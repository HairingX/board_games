import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { far, mille, savedFamily, seedFamily, typePin } from '../../tests/family';
import { I18nProvider } from '../i18n/I18n';
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
    <I18nProvider>
      <FamilyProvider>
        <Start />
      </FamilyProvider>
    </I18nProvider>,
  );
  await screen.findByRole('heading');
}

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

/** Answers the grown-ups' sum on "Glemt koden?". */
function answerSum(): void {
  const [a, b] = screen.getByText(/Hvad er/).textContent.match(/\d+/g) ?? [];
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: String(Number(a) * Number(b)) },
  });
  click('Svar');
}

describe('WhoIsPlaying', () => {
  it('welcomes a new family with its first grown-up, without asking for a code', async () => {
    await open();
    expect(screen.getByRole('heading', { name: 'Velkommen til Småspil' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Voksen eller barn' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gem' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: '  Far ' } });
    click('Gem');

    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
    await waitFor(async () => {
      const saved = await savedFamily();
      expect(saved.lock).toBeNull();
      expect(saved.profiles).toEqual([
        { id: expect.any(String) as string, name: 'Far', role: 'voksen', color: 'plum' },
      ]);
    });
  });

  it('lets anyone straight in while the grown-ups’ lock is off', async () => {
    await seedFamily({ profiles: [far, mille] });
    await open();
    expect(screen.queryByText('Låst')).not.toBeInTheDocument();
    click(/^Far/);
    expect(screen.getByText('Spiller: Far')).toBeInTheDocument();
    click('Skift');
    click(/^Mille/);
    expect(screen.getByText('Spiller: Mille')).toBeInTheDocument();
  });

  it('asks for the code before a grown-up when the lock is on, but lets children in', async () => {
    await seedFamily({ profiles: [far, mille], lock: await hashPin('1234') });
    await open();
    expect(screen.getByRole('button', { name: /^Far/ })).toHaveTextContent('Låst');
    expect(screen.getByRole('button', { name: /^Mille/ })).not.toHaveTextContent('Låst');
    click(/^Far/);
    expect(screen.getByRole('heading', { name: 'Far' })).toBeInTheDocument();
    expect(screen.getByText('Skriv voksenkoden.')).toBeInTheDocument();
    click('Annullér');
    click(/^Mille/);
    expect(screen.getByText('Spiller: Mille')).toBeInTheDocument();
    click('Skift');

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

  it('lets a grown-up who forgot the code in with a sum, and a new code or the lock off', async () => {
    const old = await hashPin('1234');
    await seedFamily({ profiles: [far], lock: old });
    await open();
    click(/^Far/);
    click('Glemt koden?');
    click('Annullér');
    click(/^Far/);
    click('Glemt koden?');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1' } });
    click('Svar');
    expect(screen.getByText('Det var ikke rigtigt. Prøv igen.')).toBeInTheDocument();
    answerSum();

    expect(screen.getByRole('heading', { name: 'Vælg en kode' })).toBeInTheDocument();
    click('Annullér');
    click(/^Far/);
    click('Glemt koden?');
    answerSum();
    typePin('5678');
    await screen.findByRole('heading', { name: 'Skriv koden igen' });
    typePin('5678');
    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
    await waitFor(async () => {
      const { lock } = await savedFamily();
      expect(lock).not.toBeNull();
      expect(lock).not.toEqual(old);
    });

    click('Skift');
    click(/^Far/);
    click('Glemt koden?');
    answerSum();
    click('Slå voksenlåsen fra');
    expect(await screen.findByText('Spiller: Far')).toBeInTheDocument();
    await waitFor(async () => {
      expect((await savedFamily()).lock).toBeNull();
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
