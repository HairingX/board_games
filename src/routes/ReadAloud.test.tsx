import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeSynth, FakeUtterance, voice } from '../../tests/speech';
import { ReadAloud } from './ReadAloud';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ReadAloud', () => {
  it('says when the browser cannot read aloud', () => {
    render(<ReadAloud />);
    expect(screen.getByRole('status')).toHaveTextContent('Denne browser kan ikke læse op.');
    expect(screen.getByText('Telefonens sprog: da-DK, da')).toBeInTheDocument();
  });

  it('says when the phone has shown no voices at all', () => {
    render(<ReadAloud synth={fakeSynth().synth} />);
    expect(screen.getByRole('status')).toHaveTextContent('Telefonen har ikke vist nogen stemmer.');
  });

  it('says when there is no voice for the language, and where to get one', () => {
    render(<ReadAloud synth={fakeSynth([voice('Daniel', 'en-GB')]).synth} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Telefonen har ingen stemme på dansk, så spillene kan ikke læse op endnu.',
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText(/Oplæst indhold → Stemmer/)).toBeInTheDocument();
  });

  it('lists the voices for the language, and reads a sum aloud with the one chosen', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const sara = voice('Sara', 'da-DK', { default: true });
    const magnus = voice('Magnus (Forbedret)', 'da-DK', { localService: false });
    const { synth } = fakeSynth([sara, magnus, voice('Daniel', 'en-GB')]);
    render(<ReadAloud synth={synth} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Telefonen har 2 stemmer på dansk. Tryk »Lyt« for at høre, hvordan de lyder.',
    );
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'SaraPå telefonen · telefonens valgLyt',
      'Magnus (Forbedret)Kræver internetLyt',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Lyt til Magnus (Forbedret)' }));
    expect(synth.speak.mock.lastCall?.[0]).toMatchObject({
      voice: magnus,
      text: 'Hvad er syv gange otte? Er det fireoghalvtreds, seksoghalvtreds eller otteoghalvtreds?',
    });
  });

  it('speaks of one voice as one', () => {
    render(<ReadAloud synth={fakeSynth([voice('Sara', 'da-DK')]).synth} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Telefonen har 1 stemme på dansk. Tryk »Lyt« for at høre, hvordan den lyder.',
    );
  });
});
