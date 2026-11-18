/** Parkort's emblem: two rings linked, for a couple. It looks the same either way up. */
export function Emblem({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="emblem"
      viewBox="-30 -18 60 36"
      width={size}
      height={(size * 36) / 60}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="-9" cy="0" r="14" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="9" cy="0" r="14" fill="none" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  );
}
