import type { Transition, Variants } from "motion/react";

/* Shared motion language for Reading Room. Curves mirror the CSS ease
   tokens (--ease-out-quart/quint/expo) so JS and CSS motion agree. */

export const easeOutQuart = [0.25, 1, 0.5, 1] as const;
export const easeOutQuint = [0.22, 1, 0.36, 1] as const;
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export const springSoft: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.9,
};

/* Page / section reveal — fade + small rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutQuint },
  },
};

/* Container that staggers its children (lists, card rows, nav). */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOutQuint },
  },
};

/* Inline feedback (renew success, toast). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: easeOutQuart },
  },
};

/* Reduced-motion: collapse any variant to a pure crossfade with no
   transform, so reveals still resolve to the visible state instantly. */
export function reduce(variants: Variants): Variants {
  const flatten = (v: Variants[string]) =>
    typeof v === "object" && v !== null
      ? { ...v, x: 0, y: 0, scale: 1, transition: { duration: 0 } }
      : v;
  return Object.fromEntries(
    Object.entries(variants).map(([k, v]) => [k, flatten(v)]),
  ) as Variants;
}
