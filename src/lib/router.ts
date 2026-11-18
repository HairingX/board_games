/** Reads the game a location hash such as `#/spil/regnespil` names; undefined for home. */
export function parseGameId(hash: string): string | undefined {
  return /^#\/spil\/([a-z0-9-]+)\/?$/.exec(hash)?.[1];
}

/** The hash that leads to a game's screen. */
export function gameHref(id: string): string {
  return `#/spil/${id}`;
}
