import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our custom font-size tokens (--text-*) share the `text-*` prefix with color
// utilities. Without this, tailwind-merge treats `text-body-sm` and
// `text-on-primary` as the same group and silently drops one — which stripped
// button text colors. Registering the sizes keeps size and color in separate
// groups so both survive.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-lg",
            "display",
            "heading-1",
            "heading-2",
            "heading-3",
            "body-lg",
            "body",
            "body-sm",
            "caption",
            "micro",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

export function daysUntilDue(dueDate: Date): number {
  return Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function formatFinnishDate(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${d}.${m}.${y} ${h}:${min}`;
}
