"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

/* Counts up to `value` when scrolled into view. Reduced-motion renders
   the final value immediately. */
export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      if (ref.current) ref.current.textContent = String(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce, mv]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
