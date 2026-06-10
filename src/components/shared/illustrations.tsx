/** Hand-tuned inline SVGs in the design system's pastel palette.
 *  Token-driven fills so they follow any future theme changes. */

export function BookshelfIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Shelf */}
      <rect x="18" y="118" width="164" height="7" rx="3.5" fill="var(--color-hairline-strong)" />
      <rect x="30" y="125" width="8" height="12" rx="2" fill="var(--color-hairline)" />
      <rect x="162" y="125" width="8" height="12" rx="2" fill="var(--color-hairline)" />

      {/* Upright books */}
      <rect x="34" y="60" width="16" height="58" rx="3" fill="var(--color-tint-lavender)" />
      <rect x="37" y="68" width="10" height="4" rx="2" fill="var(--color-primary-soft)" />
      <rect x="52" y="50" width="14" height="68" rx="3" fill="var(--color-tint-peach)" />
      <rect x="55" y="58" width="8" height="4" rx="2" fill="var(--color-canvas)" opacity="0.7" />

      {/* Leaning book */}
      <g transform="rotate(11 80 118)">
        <rect x="72" y="56" width="15" height="62" rx="3" fill="var(--color-tint-sky)" />
        <rect x="75" y="64" width="9" height="4" rx="2" fill="var(--color-canvas)" opacity="0.7" />
      </g>

      <rect x="95" y="56" width="18" height="62" rx="3" fill="var(--color-tint-mint)" />
      <rect x="99" y="64" width="10" height="4" rx="2" fill="var(--color-canvas)" opacity="0.7" />
      <rect x="115" y="46" width="14" height="72" rx="3" fill="var(--color-tint-rose)" />
      <rect x="118" y="54" width="8" height="4" rx="2" fill="var(--color-canvas)" opacity="0.7" />

      {/* Stacked pair, lying flat */}
      <rect x="133" y="106" width="44" height="12" rx="3" fill="var(--color-tint-yellow)" />
      <rect x="137" y="94" width="36" height="12" rx="3" fill="var(--color-primary-soft)" />

      {/* Sparkles */}
      <path
        d="M160 38l2.2 5.6 5.6 2.2-5.6 2.2-2.2 5.6-2.2-5.6-5.6-2.2 5.6-2.2z"
        fill="var(--color-primary)"
        opacity="0.85"
      />
      <circle cx="36" cy="38" r="3" fill="var(--color-warning)" opacity="0.5" />
      <circle cx="142" cy="70" r="2.5" fill="var(--color-primary)" opacity="0.35" />
    </svg>
  );
}
