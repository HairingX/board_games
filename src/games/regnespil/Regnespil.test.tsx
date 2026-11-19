import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { far, mille } from '../../../tests/family';
import { saves } from '../../lib/saves';
import { sound } from '../../lib/sound/engine';
import Regnespil, { fightPlace } from './Regnespil';

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  // The app's own sound needs the browser's Web Audio, which the tests have not.
  vi.spyOn(sound, 'prepareEffects').mockResolvedValue(undefined);
  vi.spyOn(sound, 'prepareMusic').mockResolvedValue(undefined);
  vi.spyOn(sound, 'stopMusic').mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function open(place: readonly string[] = []) {
  const go = vi.fn();
  const music = vi.spyOn(sound, 'music').mockReturnValue(undefined);
  render(<Regnespil players={[far, mille]} saveKey="regnespil" place={place} go={go} />);
  return { go, music };
}

/** One player's part of the setup screen. */
const playerPart = (name: string) =>
  within(screen.getByRole('heading', { name }).closest('li') as HTMLElement);

describe('Regnespil', () => {
  it('suggests where each player starts: a grown-up hard, a child gently', async () => {
    open();
    expect(await screen.findByRole('heading', { name: 'Klar til eventyret' })).toBeInTheDocument();
    const fars = playerPart('Far');
    expect(fars.getByRole('group', { name: 'Fars niveau' })).toHaveTextContent(
      'Niveau 13gymnasieniveau',
    );
    expect(fars.getByRole('radio', { name: /Svær/ })).toBeChecked();
    const milles = playerPart('Mille');
    expect(milles.getByRole('group', { name: 'Milles niveau' })).toHaveTextContent(
      'Niveau 1ca. 0.–1. klasse',
    );
    expect(milles.getByRole('button', { name: 'Lettere' })).toBeDisabled();
    expect(milles.getByRole('radio', { name: /Let/ })).toBeChecked();
  });

  it('keeps each player’s level and sword on their profile', async () => {
    open();
    await screen.findByRole('heading', { name: 'Klar til eventyret' });
    const milles = playerPart('Mille');
    fireEvent.click(milles.getByRole('button', { name: 'Sværere' }));
    fireEvent.click(milles.getByRole('radio', { name: /Mellem/ }));
    expect(milles.getByRole('group', { name: 'Milles niveau' })).toHaveTextContent('Niveau 2');
    fireEvent.click(milles.getByRole('button', { name: 'Lettere' }));
    await waitFor(async () => {
      expect(await saves.read('regnespil/mille')).toEqual({ level: 1, sword: 'jern' });
    });
  });

  it('goes no further than the hardest level', async () => {
    await saves.write('regnespil/far', { level: 15, sword: 'jern' });
    open();
    const fars = await screen.findByRole('group', { name: 'Fars niveau' });
    expect(fars).toHaveTextContent('Niveau 15for mestre');
    expect(within(fars).getByRole('button', { name: 'Sværere' })).toBeDisabled();
    expect(playerPart('Far').getByRole('radio', { name: /Mellem/ })).toBeChecked();
  });

  it('starts the fight with its music from the tap', async () => {
    const { go, music } = open();
    fireEvent.click(await screen.findByRole('button', { name: 'Til kamp!' }));
    expect(music).toHaveBeenCalledOnce();
    expect(go).toHaveBeenCalledWith([fightPlace]);
  });

  it('fights in the clearing, and goes back to the setup', async () => {
    const { go } = open([fightPlace]);
    expect(await screen.findByRole('heading', { name: /Lysningen/ })).toBeInTheDocument();
    expect(screen.getByText('Nu er det Fars tur')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tilbage' }));
    expect(go).toHaveBeenCalledWith([]);
  });
});
