/** Hand-tuned inline SVGs for the "Reading Room" system. All fills are
 *  design-system CSS vars, so every illustration re-themes automatically
 *  between Reading Room (light) and Dusk (dark). */

/* ── Brand mark — an ex-libris book stamp. Used as the logo everywhere. */
export function ExLibris({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="var(--color-primary)" />
      {/* open book */}
      <path
        d="M16 9.2c-1.7-1.1-3.7-1.6-5.8-1.4-.5 0-.9.4-.9.9v12.4c0 .5.5.9 1 .8 1.9-.2 3.8.2 5.4 1.2.2.1.4.1.6 0 1.6-1 3.5-1.4 5.4-1.2.5 0 1-.3 1-.8V8.7c0-.5-.4-.9-.9-.9-2.1-.2-4.1.3-5.8 1.4Z"
        fill="var(--color-on-primary)"
      />
      <path
        d="M16 9.2v13.9"
        stroke="var(--color-primary)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M11.6 11.4c1.2-.2 2.4-.1 3.5.4M11.6 14c1.2-.2 2.4-.1 3.5.4M20.4 11.4c-1.2-.2-2.4-.1-3.5.4M20.4 14c-1.2-.2-2.4-.1-3.5.4"
        stroke="var(--color-primary-soft)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* gold star clasp */}
      <path
        d="M16 3.6l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"
        fill="var(--color-accent)"
      />
    </svg>
  );
}

/* ── Refined bookshelf — empty/first-run hero spot. */
export function BookshelfIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" aria-hidden="true" className={className}>
      <rect x="18" y="118" width="164" height="7" rx="3.5" fill="var(--color-hairline-strong)" />
      <rect x="30" y="125" width="8" height="12" rx="2" fill="var(--color-hairline)" />
      <rect x="162" y="125" width="8" height="12" rx="2" fill="var(--color-hairline)" />

      <rect x="34" y="60" width="16" height="58" rx="3" fill="var(--color-primary)" />
      <rect x="37" y="68" width="10" height="3" rx="1.5" fill="var(--color-accent)" />
      <rect x="52" y="50" width="14" height="68" rx="3" fill="var(--color-tint-peach)" />
      <rect x="55" y="58" width="8" height="3" rx="1.5" fill="var(--color-hairline-strong)" />

      <g transform="rotate(11 80 118)">
        <rect x="72" y="56" width="15" height="62" rx="3" fill="var(--color-tint-sky)" />
        <rect x="75" y="64" width="9" height="3" rx="1.5" fill="var(--color-hairline-strong)" />
      </g>

      <rect x="95" y="56" width="18" height="62" rx="3" fill="var(--color-tint-mint)" />
      <rect x="99" y="64" width="10" height="3" rx="1.5" fill="var(--color-hairline-strong)" />
      <rect x="115" y="46" width="14" height="72" rx="3" fill="var(--color-primary-soft)" />
      <rect x="118" y="54" width="8" height="3" rx="1.5" fill="var(--color-primary)" />

      <rect x="133" y="106" width="44" height="12" rx="3" fill="var(--color-tint-yellow)" />
      <rect x="137" y="94" width="36" height="12" rx="3" fill="var(--color-accent-soft)" />

      <path
        d="M160 38l2.2 5.6 5.6 2.2-5.6 2.2-2.2 5.6-2.2-5.6-5.6-2.2 5.6-2.2z"
        fill="var(--color-accent)"
      />
      <circle cx="36" cy="38" r="3" fill="var(--color-primary)" opacity="0.45" />
      <circle cx="142" cy="70" r="2.5" fill="var(--color-accent)" opacity="0.5" />
    </svg>
  );
}

/* ── Hero reading-room scene — landing page. */
export function ReadingRoomScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 280" fill="none" aria-hidden="true" className={className}>
      {/* arched window */}
      <path
        d="M70 40c0-22 18-40 40-40h100c22 0 40 18 40 40v120H70V40Z"
        fill="var(--color-tint-sky)"
      />
      <path
        d="M70 40c0-22 18-40 40-40h100c22 0 40 18 40 40v120H70V40Z"
        stroke="var(--color-hairline-strong)"
        strokeWidth="2"
      />
      {/* moon/sun + window mullions */}
      <circle cx="160" cy="58" r="20" fill="var(--color-accent)" opacity="0.8" />
      <path d="M160 0v160M70 84h180" stroke="var(--color-hairline-strong)" strokeWidth="2" opacity="0.7" />

      {/* plant */}
      <rect x="22" y="150" width="30" height="34" rx="4" fill="var(--color-primary)" />
      <path
        d="M37 150c-10-6-16-18-14-30 10 4 16 16 14 30ZM37 150c8-7 12-20 8-32-9 5-12 20-8 32Z"
        fill="var(--color-success)"
      />

      {/* desk */}
      <rect x="16" y="184" width="288" height="10" rx="3" fill="var(--color-hairline-strong)" />

      {/* stack of books on desk */}
      <rect x="60" y="160" width="78" height="13" rx="3" fill="var(--color-tint-peach)" />
      <rect x="68" y="148" width="64" height="13" rx="3" fill="var(--color-primary-soft)" />
      <rect x="76" y="136" width="50" height="13" rx="3" fill="var(--color-tint-mint)" />

      {/* open book */}
      <path
        d="M168 172c14-9 30-9 44 0v22c-14-7-30-7-44 0v-22Z"
        fill="var(--color-canvas)"
        stroke="var(--color-hairline-strong)"
        strokeWidth="2"
      />
      <path d="M190 168v26" stroke="var(--color-hairline-strong)" strokeWidth="2" />

      {/* desk lamp */}
      <rect x="250" y="120" width="6" height="64" rx="3" fill="var(--color-ink)" opacity="0.7" />
      <path d="M253 120l26 12-8 16-22-12 4-16Z" fill="var(--color-primary)" />
      <ellipse cx="266" cy="150" rx="16" ry="7" fill="var(--color-accent)" opacity="0.35" />

      {/* sparkles */}
      <path
        d="M120 96l1.8 4.6 4.6 1.8-4.6 1.8-1.8 4.6-1.8-4.6-4.6-1.8 4.6-1.8z"
        fill="var(--color-accent)"
      />
      <circle cx="222" cy="104" r="3" fill="var(--color-primary)" opacity="0.5" />
    </svg>
  );
}

/* ── All caught up — dashboard empty state (safe, satisfied). */
export function AllCaughtUpIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={className}>
      <rect x="20" y="96" width="120" height="6" rx="3" fill="var(--color-hairline-strong)" />
      <rect x="34" y="48" width="16" height="48" rx="3" fill="var(--color-tint-peach)" />
      <rect x="52" y="40" width="14" height="56" rx="3" fill="var(--color-primary-soft)" />
      <rect x="68" y="52" width="16" height="44" rx="3" fill="var(--color-tint-sky)" />
      <rect x="86" y="44" width="14" height="52" rx="3" fill="var(--color-tint-mint)" />
      {/* gold seal with check */}
      <circle cx="116" cy="44" r="20" fill="var(--color-success-soft)" />
      <circle cx="116" cy="44" r="20" stroke="var(--color-success)" strokeWidth="2" />
      <path
        d="M108 44.5l5.5 5.5 11-11"
        stroke="var(--color-success)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Quiet shelf — empty history. */
export function QuietShelfIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={className}>
      <rect x="20" y="92" width="120" height="6" rx="3" fill="var(--color-hairline-strong)" />
      <rect x="40" y="58" width="14" height="34" rx="3" fill="var(--color-hairline)" />
      <rect x="56" y="50" width="12" height="42" rx="3" fill="var(--color-hairline-soft)" />
      <rect x="92" y="54" width="13" height="38" rx="3" fill="var(--color-hairline)" />
      {/* big empty gap in the middle, a few zzz */}
      <path
        d="M112 36h12l-12 12h12"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <path
        d="M126 24h8l-8 8h8"
        stroke="var(--color-accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  );
}

/* ── Offline — closed book, cloud-off. */
export function OfflineIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true" className={className}>
      <rect x="46" y="40" width="68" height="48" rx="6" fill="var(--color-primary-soft)" />
      <rect x="46" y="40" width="14" height="48" rx="6" fill="var(--color-primary)" />
      <path
        d="M70 50c12-4 26-4 36 0"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* cloud-off */}
      <path
        d="M96 28a14 14 0 0 1 13 9 10 10 0 0 1-1 20H78"
        stroke="var(--color-steel)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M58 22l52 52" stroke="var(--color-error)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/* ── Renewal success flourish — a gold wax seal that stamps in. */
export function SuccessSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="26" fill="var(--color-accent-soft)" />
      <circle
        cx="32"
        cy="32"
        r="26"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeDasharray="3 4"
      />
      <circle cx="32" cy="32" r="18" fill="var(--color-accent)" opacity="0.18" />
      <path
        d="M23 32.5l6 6 12-13"
        stroke="var(--color-success)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Small onboarding step spots. */
export function SpotLinkCard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <rect x="6" y="14" width="36" height="22" rx="4" fill="var(--color-primary-soft)" />
      <rect x="6" y="19" width="36" height="5" fill="var(--color-primary)" />
      <rect x="11" y="29" width="14" height="3" rx="1.5" fill="var(--color-primary)" opacity="0.6" />
      <circle cx="35" cy="30" r="3" fill="var(--color-accent)" />
    </svg>
  );
}

export function SpotWatchDates({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <circle cx="24" cy="25" r="15" fill="var(--color-tint-sky)" />
      <circle cx="24" cy="25" r="15" stroke="var(--color-info)" strokeWidth="2" />
      <path
        d="M24 17v8l5 3"
        stroke="var(--color-info)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="18" y="6" width="12" height="4" rx="2" fill="var(--color-info)" />
    </svg>
  );
}

export function SpotAutoRenew({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="16" fill="var(--color-tint-mint)" />
      <path
        d="M33 19a11 11 0 1 0 2 8"
        stroke="var(--color-success)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M33 13v6h-6"
        stroke="var(--color-success)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
