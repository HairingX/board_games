import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { saves } from '../lib/saves';
import {
  I18nProvider,
  localeSaveKey,
  reviveLocale,
  useLocale,
  useMessages,
  useSetLocale,
} from './I18n';
import type { Translations } from './locales';

const greeting: Translations<{ hello: string }> = { da: { hello: 'Hej' }, en: { hello: 'Hello' } };

/** Greets in the language spoken, and changes to the other language when tapped. */
function Greeting() {
  const locale = useLocale();
  const { hello } = useMessages(greeting);
  const setLocale = useSetLocale();
  return (
    <button
      type="button"
      onClick={() => {
        setLocale(locale === 'da' ? 'en' : 'da');
      }}
    >
      {hello}
    </button>
  );
}

function speak(languages: string[]): void {
  Object.defineProperty(navigator, 'languages', { value: languages, configurable: true });
}

afterEach(() => {
  speak(['da-DK', 'da']);
});

describe('I18nProvider', () => {
  it('speaks the phone’s language when the app speaks it, and says so to the page', async () => {
    speak(['en-GB', 'da']);
    render(<Greeting />, { wrapper: I18nProvider });
    expect(await screen.findByRole('button', { name: 'Hello' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('speaks Danish on a phone in a language it does not speak', async () => {
    speak(['fr-FR']);
    render(<Greeting />, { wrapper: I18nProvider });
    expect(await screen.findByRole('button', { name: 'Hej' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('da');
  });

  it('changes language and keeps the choice on the phone for next time', async () => {
    const { unmount } = render(<Greeting />, { wrapper: I18nProvider });
    fireEvent.click(await screen.findByRole('button', { name: 'Hej' }));
    expect(await screen.findByRole('button', { name: 'Hello' })).toBeInTheDocument();
    await waitFor(async () => {
      expect(await saves.read(localeSaveKey)).toBe('en');
    });
    unmount();

    render(<Greeting />, { wrapper: I18nProvider });
    expect(await screen.findByRole('button', { name: 'Hello' })).toBeInTheDocument();
  });

  it('follows the phone again when what was saved is no language it speaks', () => {
    expect(reviveLocale('de')).toBe('da');
    expect(reviveLocale('en')).toBe('en');
  });
});

describe('outside an I18nProvider', () => {
  it('speaks Danish', () => {
    function Plain() {
      return <p>{useMessages(greeting).hello}</p>;
    }
    render(<Plain />);
    expect(screen.getByText('Hej')).toBeInTheDocument();
  });

  it('cannot change language', () => {
    function Outside() {
      useSetLocale();
      return null;
    }
    expect(() => render(<Outside />)).toThrow('useSetLocale is used outside an I18nProvider.');
  });
});
