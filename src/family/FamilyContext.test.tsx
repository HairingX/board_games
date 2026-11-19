import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { far, seedFamily } from '../../tests/family';
import { saves } from '../lib/saves';
import { FamilyProvider, useFamily } from './FamilyContext';
import { rememberedSaveKey } from './remembered';

function Who() {
  const { current } = useFamily();
  return <p>{current?.name ?? 'Ingen'}</p>;
}

describe('FamilyProvider', () => {
  it('notes nothing when the app is left before the family has been read', async () => {
    await seedFamily({ profiles: [far] });
    render(
      <FamilyProvider>
        <Who />
      </FamilyProvider>,
    );
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'visibilityState');
    expect(await screen.findByText('Ingen')).toBeInTheDocument();
    expect(await saves.read(rememberedSaveKey)).toBeUndefined();
  });

  it('notes nothing when the app is only shown again', async () => {
    await seedFamily({ profiles: [far] });
    render(
      <FamilyProvider>
        <Who />
      </FamilyProvider>,
    );
    await screen.findByText('Ingen');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(await saves.read(rememberedSaveKey)).toBeUndefined();
  });
});
