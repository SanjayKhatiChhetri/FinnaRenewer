import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
