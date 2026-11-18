import type { Profile } from './family';

/** A profile's initial in its colour. */
export function Avatar({
  profile,
  size = 'large',
}: {
  profile: Profile;
  size?: 'large' | 'small';
}) {
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: `var(--profile-${profile.color})` }}
      aria-hidden="true"
    >
      {profile.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
