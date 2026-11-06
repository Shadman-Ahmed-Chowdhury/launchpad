import { UserIcon } from "@/components/icons";

/**
 * Circular avatar used wherever a member's photo appears — the public
 * profile, the account menu, and the profile settings form. Falls back to a
 * placeholder person icon when `src` is null (no avatar uploaded yet).
 */
export function Avatar({
  src,
  alt,
  size = 40,
  className = "",
}: {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        role="img"
        aria-label={alt}
        style={{ width: size, height: size }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-hairline/40 text-muted ${className}`}
      >
        <UserIcon className="h-[55%] w-[55%]" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
