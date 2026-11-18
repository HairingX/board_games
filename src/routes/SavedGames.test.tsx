import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { listenForInstall } from '../lib/install';
import { openSaves } from '../lib/saves';
import { SavedGames } from './SavedGames';

listenForInstall(window);

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'storage');
});

function chooseFile(text: string): void {
  const input = screen.getByLabelText('Vælg sikkerhedskopi');
  fireEvent.change(input, { target: { files: [new File([text], 'kopi.json')] } });
}

const backupText = JSON.stringify({
  app: 'smaaspil',
  version: 1,
  madeAt: '2026-11-18T12:00:00.000Z',
  saves: { 'kopi-test': 42 },
});

describe('SavedGames', () => {
  it('in a browser tab, explains how to add the app to the Home Screen', () => {
    render(<SavedGames saves={openSaves()} />);
    expect(screen.getByText(/Jeres spil gemmes i browseren/)).toBeInTheDocument();
    expect(screen.getByText(/Tryk på Del-knappen/)).toBeInTheDocument();
  });

  it('offers the browser’s install dialog where there is one', async () => {
    render(<SavedGames saves={openSaves()} />);
    const prompt = vi.fn(() => Promise.resolve());
    act(() => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Føj til hjemmeskærmen' }));
      await Promise.resolve();
    });
    expect(prompt).toHaveBeenCalledOnce();
  });

  it('as an installed app, says the games are saved on the phone', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    render(<SavedGames saves={openSaves()} />);
    expect(screen.getByText(/gemmes på telefonen, hver gang/)).toBeInTheDocument();
  });

  it('says when the phone has promised to keep the games', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persisted: () => Promise.resolve(true), persist: () => Promise.resolve(true) },
    });
    render(<SavedGames saves={openSaves()} />);
    expect(await screen.findByText(/Telefonen gemmer jeres spil sikkert/)).toBeInTheDocument();
  });

  it('saves a backup as a file, and lets the link go later', async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:kopi');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const later: (() => void)[] = [];
    const realSetTimeout = window.setTimeout.bind(window);
    vi.spyOn(window, 'setTimeout').mockImplementation(((callback: () => void, ms?: number) => {
      if (ms === 60_000) {
        later.push(callback);
        return 0;
      }
      return realSetTimeout(callback, ms);
    }) as typeof window.setTimeout);

    render(<SavedGames saves={openSaves()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gem sikkerhedskopi' }));

    expect(await screen.findByText('Sikkerhedskopien er gemt som en fil.')).toBeInTheDocument();
    expect(click).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(JSON.parse((await blob?.text()) ?? '')).toMatchObject({ app: 'smaaspil' });
    later.forEach((callback) => {
      callback();
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:kopi');
  });

  it('brings back a backup once confirmed', async () => {
    const saves = openSaves();
    render(<SavedGames saves={saves} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hent sikkerhedskopi' }));
    chooseFile(backupText);

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Kopien fra 18. november 2026 erstatter');
    fireEvent.click(screen.getByRole('button', { name: 'Annullér' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    chooseFile(backupText);
    fireEvent.click(await screen.findByRole('button', { name: 'Ja, hent kopien' }));
    expect(
      await screen.findByText('Sikkerhedskopien fra 18. november 2026 er hentet.'),
    ).toBeInTheDocument();
    expect(await saves.read('kopi-test')).toBe(42);
    await saves.remove('kopi-test');
  });

  it('says so when the file is no backup, and ignores choosing nothing', async () => {
    render(<SavedGames saves={openSaves()} />);
    chooseFile('{"noget":"andet"}');
    expect(
      await screen.findByText('Filen er ikke en sikkerhedskopi fra Småspil.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Vælg sikkerhedskopi'), { target: { files: [] } });
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });
});
