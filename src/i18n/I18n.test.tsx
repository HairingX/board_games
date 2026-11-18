import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useLocale, useMessages } from './I18n';
import type { Translations } from './locales';

const greeting: Translations<{ hello: string }> = { da: { hello: 'Hej' }, en: { hello: 'Hello' } };

function Greeting() {
  return (
    <p>
      {useMessages(greeting).hello} ({useLocale()})
    </p>
  );
}

describe('I18nProvider', () => {
  it('speaks the language given, and says so to the page', () => {
    const { rerender } = render(
      <I18nProvider locale="en">
        <Greeting />
      </I18nProvider>,
    );
    expect(screen.getByText('Hello (en)')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');

    rerender(
      <I18nProvider locale="da">
        <Greeting />
      </I18nProvider>,
    );
    expect(screen.getByText('Hej (da)')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('da');
  });

  it('speaks Danish where no provider says else', () => {
    render(<Greeting />);
    expect(screen.getByText('Hej (da)')).toBeInTheDocument();
  });
});
