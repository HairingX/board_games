import { faces } from './faces';
import type { Profile } from './family';

/** A profile's picture, or its initial in its colour when it has none. */
export function Avatar({
  profile,
  size = 'large',
}: {
  profile: Profile;
  size?: 'large' | 'small' | 'tiny';
}) {
  const { picture } = profile;
  const src = picture?.kind === 'face' ? faces.get(picture.face) : picture?.src;
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: `var(--profile-${profile.color})` }}
      aria-hidden="true"
    >
      {src ? (
        <img
          className={picture?.kind === 'face' ? 'avatar-picture avatar-face' : 'avatar-picture'}
          src={src}
          alt=""
        />
      ) : (
        profile.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
