/** Where the phone keeps whether the parts still being built are shown, for grown-ups to try. */
export const betaSaveKey = 'beta';

/** Whether beta is on; off unless it was turned on. */
export function reviveBeta(saved: unknown): boolean {
  return saved === true;
}
