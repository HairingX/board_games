import { render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { expect } from 'vitest';
import { I18nProvider } from '../src/i18n/I18n';

/** Renders inside the app's language, once the language saved has been read. */
export async function renderWithLanguage(ui: ReactElement) {
  const result = render(ui, { wrapper: I18nProvider });
  await waitFor(() => {
    expect(result.container).not.toBeEmptyDOMElement();
  });
  return result;
}
