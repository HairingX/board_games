/*
 * Turns, shared by every game where players take turns: one player is active at a time, and
 * the turn passes round the table to the next.
 */

/** The player whose turn comes after the active one, by their place round the table. */
export function nextTurn(active: number, players: number): number {
  return (active + 1) % players;
}
