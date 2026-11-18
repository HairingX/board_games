import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { saves } from '../../lib/saves';
import { drag } from '../../../tests/drag';
import { cards } from './cards';
import { newDeck, type DeckState } from './deck';
import Parkort, { legacyKey, reviveDeck, saveKey } from './Parkort';

afterEach(async () => {
  await saves.remove(saveKey);
});

async function save(state: DeckState): Promise<void> {
  await saves.write(saveKey, state);
}

async function saved(): Promise<DeckState> {
  return (await saves.read(saveKey)) as DeckState;
}

/** Waits until the saved deck passes the check. */
async function expectSaved(check: (deck: DeckState) => void): Promise<void> {
  await waitFor(async () => {
    check(await saved());
  });
}

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

async function open(): Promise<void> {
  render(<Parkort />);
  await screen.findByRole('heading', { name: 'Parkort' });
}

/** A deck with the given cards first, in that order. */
function deckStartingWith(...ids: string[]): DeckState {
  const rest = cards.map((card) => card.id).filter((id) => !ids.includes(id));
  return { ...newDeck(cards), order: [...ids, ...rest] };
}

/** The deck as the first version saved it, without the face-up card and time. */
function firstVersion(state: DeckState): Partial<DeckState> {
  const copy: Partial<DeckState> = { ...state };
  delete copy.flipped;
  delete copy.playedAt;
  return copy;
}

const minder = cards.filter((card) => card.category === 'minder').map((card) => card.id);

describe('reviveDeck', () => {
  it('moves a deck saved by the first version out of localStorage', () => {
    const old = firstVersion(newDeck(cards));
    localStorage.setItem(legacyKey, JSON.stringify({ ...old, seen: ['os-to-1'] }));
    const deck = reviveDeck(undefined);
    expect(deck.seen).toEqual(['os-to-1']);
    expect(deck.flipped).toBeNull();
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it('starts a new deck from nothing, or from something unreadable', () => {
    expect(reviveDeck(undefined).seen).toEqual([]);
    expect(reviveDeck({ order: 1 }).order).toHaveLength(200);
  });
});

describe('Parkort setup', () => {
  it('starts with every category chosen and nothing talked about', async () => {
    await open();
    expect(screen.getByText('0 af 200')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(8);
    for (const chip of screen.getAllByRole('button', { pressed: true })) {
      expect(chip).toHaveTextContent('25');
    }
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
    expect(screen.queryByText(/Sidst spillet/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start forfra' })).not.toBeInTheDocument();
  });

  it('turns categories off and on, keeping their order, and needs at least one', async () => {
    await save({ ...newDeck(cards), categories: ['os-to'] });
    await open();
    expect(screen.getByText('0 af 25')).toBeInTheDocument();

    click(/Minder/);
    await expectSaved((deck) => {
      expect(deck.categories).toEqual(['os-to', 'minder']);
    });

    click(/Os to/);
    click(/Minder/);
    await expectSaved((deck) => {
      expect(deck.categories).toEqual([]);
    });
    expect(screen.getByText('0 af 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    expect(screen.getByText('Vælg mindst én kategori.')).toBeInTheDocument();
  });

  it('chooses the order', async () => {
    await open();
    fireEvent.click(screen.getByRole('radio', { name: 'Let til dyb' }));
    expect(screen.getByRole('radio', { name: 'Let til dyb' })).toBeChecked();
    await expectSaved((deck) => {
      expect(deck.mode).toBe('let-til-dyb');
    });
  });

  it('offers to start over once a card has only been put off, and counts it', async () => {
    await save({ ...newDeck(cards), later: ['os-to-1', 'minder-3'] });
    await open();
    expect(screen.getByText('2 kort venter til senere')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fortsæt hvor I slap' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start forfra' })).toBeInTheDocument();
  });

  it('continues where it was left, and starts over only once confirmed', async () => {
    await save({ ...newDeck(cards), seen: ['os-to-1', 'minder-2'], playedAt: Date.now() });
    await open();
    expect(screen.getByText('2 af 200')).toBeInTheDocument();
    expect(screen.getByText('Sidst spillet lige nu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fortsæt hvor I slap' })).toBeInTheDocument();

    click('Start forfra');
    click('Annullér');
    expect((await saved()).seen).toHaveLength(2);

    click('Start forfra');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Er I sikre?');
    click('Ja, start forfra');
    await expectSaved((deck) => {
      expect(deck.seen).toEqual([]);
    });
    expect(screen.getByText('0 af 200')).toBeInTheDocument();
  });
});

describe('Parkort play', () => {
  it('saves the card face up as soon as it is turned, and goes on to the next', async () => {
    await save(deckStartingWith('os-to-1', 'os-to-2'));
    await open();
    click('Start');

    expect(screen.getByRole('button', { name: 'Næste kort' })).toBeDisabled();
    expect(screen.getByText('Tryk på kortet for at vende det.')).toBeInTheDocument();
    click('Vend kortet');

    expect(screen.getByText('Hvad lagde du først mærke til ved mig, da vi mødtes?')).toBeVisible();
    expect(screen.getByText('Os to')).toBeInTheDocument();
    expect(screen.getByLabelText('Niveau: Let')).toBeInTheDocument();
    await expectSaved((deck) => {
      expect(deck.flipped).toBe('os-to-1');
      expect(deck.playedAt).not.toBeNull();
    });

    click('Næste kort');
    await expectSaved((deck) => {
      expect(deck.seen).toEqual(['os-to-1']);
      expect(deck.flipped).toBeNull();
    });
    expect(screen.getByLabelText('1 af 200 kort snakket om')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vend kortet' })).toBeEnabled();
  });

  it('shows the card that was face up when the game was left, face up', async () => {
    await save({ ...deckStartingWith('os-to-2'), flipped: 'os-to-2', playedAt: Date.now() });
    await open();
    expect(screen.getByRole('button', { name: 'Fortsæt hvor I slap' })).toBeInTheDocument();
    click('Fortsæt hvor I slap');
    expect(screen.getByRole('button', { name: 'Næste kort' })).toBeEnabled();
    expect(screen.getByText('Hvilken sang minder dig mest om os?')).toBeVisible();
  });

  it('puts a card off till the bottom of the pile, and says so', async () => {
    await save(deckStartingWith('os-to-1', 'os-to-2'));
    await open();
    click('Start');
    expect(screen.getByRole('button', { name: 'Tag den senere' })).toBeDisabled();
    click('Vend kortet');
    click('Tag den senere');

    await expectSaved((deck) => {
      expect(deck.later).toEqual(['os-to-1']);
      expect(deck.flipped).toBeNull();
    });
    expect((await saved()).seen).toEqual([]);
    expect(screen.getByText('Kortet ligger nu nederst i bunken.')).toBeInTheDocument();
  });

  it('goes back to the card before, face up, whether talked about or put off', async () => {
    await save(deckStartingWith('os-to-1', 'os-to-2', 'os-to-3'));
    await open();
    click('Start');
    expect(screen.getByRole('button', { name: 'Forrige' })).toBeDisabled();

    click('Vend kortet');
    click('Næste kort');
    click('Vend kortet');
    click('Tag den senere');
    click('Forrige');
    await waitFor(() => {
      expect(screen.getByText('Hvilken sang minder dig mest om os?')).toBeVisible();
    });
    expect(screen.getByRole('button', { name: 'Næste kort' })).toBeEnabled();
    await expectSaved((deck) => {
      expect(deck.later).toEqual([]);
    });

    click('Forrige');
    await waitFor(() => {
      expect(
        screen.getByText('Hvad lagde du først mærke til ved mig, da vi mødtes?'),
      ).toBeVisible();
    });
    await expectSaved((deck) => {
      expect(deck.seen).toEqual([]);
      expect(deck.flipped).toBe('os-to-1');
    });
    expect(screen.getByRole('button', { name: 'Forrige' })).toBeDisabled();
  });

  it('goes on when the card is thrown right, and back when thrown left', async () => {
    await save(deckStartingWith('os-to-1', 'os-to-2'));
    await open();
    click('Start');
    click('Vend kortet');
    const card = () => {
      const element = document.querySelector('.flip-card:last-of-type');
      if (!element) throw new Error('No card');
      return element;
    };

    await drag(card(), -300);
    expect((await saved()).seen).toEqual([]);

    await drag(card(), 300);
    await expectSaved((deck) => {
      expect(deck.seen).toEqual(['os-to-1']);
    });

    click('Vend kortet');
    await drag(card(), -300);
    await expectSaved((deck) => {
      expect(deck.seen).toEqual([]);
      expect(deck.flipped).toBe('os-to-1');
    });
  });

  it('celebrates when every chosen card has been talked about, and can start over', async () => {
    await save({ ...newDeck(cards), categories: ['minder'], seen: minder });
    await open();
    click('Fortsæt hvor I slap');

    expect(screen.getByRole('heading', { name: 'Godt snakket!' })).toBeInTheDocument();
    expect(
      screen.getByText('I har været alle 25 kort i de valgte kategorier igennem.'),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Forrige kort' })).not.toBeInTheDocument();
    click('Start forfra');
    await expectSaved((deck) => {
      expect(deck.seen).toEqual([]);
    });
    expect(screen.getByRole('button', { name: 'Vend kortet' })).toBeInTheDocument();
  });

  it('can go back to the last card from the end', async () => {
    await save({ ...newDeck(cards), categories: ['minder'], seen: minder.slice(1) });
    await open();
    click('Fortsæt hvor I slap');
    click('Vend kortet');
    click('Næste kort');
    click('Forrige kort');
    expect(screen.getByRole('button', { name: 'Næste kort' })).toBeEnabled();
  });

  it('goes back to the setup from the deck and from the end', async () => {
    await save({ ...newDeck(cards), categories: ['minder'], seen: minder.slice(1) });
    await open();
    click('Fortsæt hvor I slap');
    click('Tilbage');
    expect(screen.getByText('24 af 25')).toBeInTheDocument();

    click('Fortsæt hvor I slap');
    click('Vend kortet');
    click('Næste kort');
    click('Vælg andre kategorier');
    expect(within(screen.getByLabelText('Fremskridt')).getByText('25 af 25')).toBeInTheDocument();
  });

  it('shows the cards underneath only while there are any', async () => {
    await save({ ...newDeck(cards), categories: ['minder'], seen: minder.slice(2) });
    const { container } = render(<Parkort />);
    await screen.findByRole('heading', { name: 'Parkort' });
    act(() => {
      click('Fortsæt hvor I slap');
    });
    expect(container.querySelectorAll('.pk-stack')).toHaveLength(1);
  });
});
