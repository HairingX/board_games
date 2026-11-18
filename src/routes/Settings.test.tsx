import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { far, mille } from '../../tests/family';
import type { Family } from '../family/family';
import { I18nProvider } from '../i18n/I18n';
import { Settings } from './Settings';

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

async function open(family: Family) {
  const onChange = vi.fn<(family: Family) => void>();
  const onBack = vi.fn();
  render(
    <I18nProvider>
      <Settings family={family} current={far} onChange={onChange} onBack={onBack} />
    </I18nProvider>,
  );
  await screen.findByRole('heading', { name: 'Indstillinger' });
  return { onChange, onBack };
}

describe('Settings', () => {
  it('gathers the language, the family, the lock and the saved games', async () => {
    const { onBack } = await open({ profiles: [far, mille], lock: null });
    expect(screen.getByLabelText('Sprog')).toHaveValue('da');
    expect(screen.getByRole('button', { name: /^Familien 2 personer/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Voksenlås Fra/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jeres gemte spil' })).toBeInTheDocument();
    click('Tilbage');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('opens the family and the lock, and comes back from each', async () => {
    await open({ profiles: [far], lock: { salt: 's', hash: 'h' } });
    expect(screen.getByRole('button', { name: /^Familien 1 person/ })).toBeInTheDocument();
    click(/^Familien/);
    expect(screen.getByRole('heading', { name: 'Familien' })).toBeInTheDocument();
    click('Tilbage');
    click(/^Voksenlås Til/);
    expect(screen.getByRole('heading', { name: 'Voksenlås' })).toBeInTheDocument();
    click('Tilbage');
    expect(screen.getByRole('heading', { name: 'Indstillinger' })).toBeInTheDocument();
  });

  it('changes the app’s language', async () => {
    await open({ profiles: [far], lock: null });
    fireEvent.change(screen.getByLabelText('Sprog'), { target: { value: 'en' } });
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'xx' } });
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });
});
