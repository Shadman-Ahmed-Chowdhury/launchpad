export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6 L11 3 L11 13 L19 13 L19 18 L6 18 Z" />
    </svg>
  );
}
