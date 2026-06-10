"use client";

import { motion, useReducedMotion } from "motion/react";

/* Wraps a route-group `template.tsx` so each navigation fades+rises in.
   template.tsx remounts on every route change, so no AnimatePresence is
   needed — the mount animation fires on each navigation. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
