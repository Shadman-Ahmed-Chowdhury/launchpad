export function HeroIllustration({ className }: { className?: string }) {
  const bars = [
    { width: 220, fill: "var(--gold-fill)" },
    { width: 168, fill: "currentColor", opacity: 0.55 },
    { width: 126, fill: "currentColor", opacity: 0.3 },
    { width: 84, fill: "currentColor", opacity: 0.15 },
  ];

  return (
    <svg
      viewBox="0 0 260 220"
      className={className}
      aria-hidden="true"
    >
      <line
        x1="1"
        y1="0"
        x2="1"
        y2="220"
        stroke="currentColor"
        strokeOpacity="0.15"
      />
      {bars.map((bar, index) => (
        <rect
          key={bar.width}
          x="10"
          y={14 + index * 54}
          width={bar.width}
          height="22"
          rx="11"
          fill={bar.fill}
          opacity={bar.opacity}
        />
      ))}
    </svg>
  );
}
