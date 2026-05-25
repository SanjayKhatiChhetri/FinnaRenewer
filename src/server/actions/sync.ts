"use server";

import { auth } from "@/lib/auth";
import {
  syncUserData as syncUser,
  readCachedData,
} from "@/server/services/sync";
import type { Loan, Hold, Fine } from "@/server/finna/types";

export interface CachedDataResult {
  loans: Loan[];
  holds: Hold[];
  fines: Fine[];
  syncedAt: string | null;
  syncErrors: string[];
  hasCachedData: boolean;
}

/** Read cached loans/holds/fines for the current user */
export async function fetchCachedData(): Promise<CachedDataResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { loans: [], holds: [], fines: [], syncedAt: null, syncErrors: ["Not authenticated"], hasCachedData: false };
  }

  const cached = await readCachedData(session.user.id);
  if (!cached) {
    return { loans: [], holds: [], fines: [], syncedAt: null, syncErrors: [], hasCachedData: false };
  }

  return { ...cached, hasCachedData: true };
}

/** Trigger a full sync from Finna for the current user (rate-limited) */
export async function triggerSync(): Promise<{
  loans: Loan[];
  holds: Hold[];
  fines: Fine[];
  syncedAt: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { loans: [], holds: [], fines: [], syncedAt: new Date().toISOString(), error: "Not authenticated" };
  }

  const { results, syncedAt, error } = await syncUser(session.user.id);

  if (error && results.length === 0) {
    // Rate limited or no credentials — try returning stale cache
    const cached = await readCachedData(session.user.id);
    return {
      loans: cached?.loans ?? [],
      holds: cached?.holds ?? [],
      fines: cached?.fines ?? [],
      syncedAt: cached?.syncedAt ?? syncedAt,
      error,
    };
  }

  const loans = results.flatMap((r) => r.loans);
  const holds = results.flatMap((r) => r.holds);
  const fines = results.flatMap((r) => r.fines);

  return { loans, holds, fines, syncedAt, error };
}
