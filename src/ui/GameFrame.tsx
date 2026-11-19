import { createContext, use, type ReactNode } from 'react';
import type { Profile } from '../family/family';

/** What every screen of a game shows in its header: the game's icon and who is playing. */
export interface GameFrame {
  icon: ReactNode;
  /** The players, once chosen. */
  players: readonly Profile[];
}

const GameFrameContext = createContext<GameFrame | null>(null);

/** Gives every screen of a game its icon and players, for the header to show. */
export function GameFrameProvider({ children, ...frame }: GameFrame & { children: ReactNode }) {
  return <GameFrameContext value={frame}>{children}</GameFrameContext>;
}

/** The game the screen belongs to; null outside a game. */
export function useGameFrame(): GameFrame | null {
  return use(GameFrameContext);
}
