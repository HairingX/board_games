import { createContext, use, type ReactNode } from 'react';

const GameIconContext = createContext<ReactNode>(null);

/** Gives every screen of a game its icon, so the game's header always shows which game it is. */
export function GameIconProvider({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <GameIconContext value={icon}>{children}</GameIconContext>;
}

/** The icon of the game the screen belongs to; null outside a game. */
export function useGameIcon(): ReactNode {
  return use(GameIconContext);
}
