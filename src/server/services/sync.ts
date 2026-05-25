"use server";

import { db } from "@/lib/db";
import { libraryCredentials, libraryCache } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "./encryption";
import { finnaLogin } from "@/server/finna/client";
import { fetchLoans } from "@/server/finna/loans";
import { fetchHolds } from "@/server/finna/holds";
import { fetchFines } from "@/server/finna/fines";
import { FINNA_INSTANCES } from "@/server/finna/instances";
import type { Loan, Hold, Fine, FinnaInstanceId } from "@/server/finna/types";

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

export interface SyncResult {
  credentialId: string;
  cardLabel: string;
  loans: Loan[];
  holds: Hold[];
  fines: Fine[];
  syncedAt: Date;
  error?: string;
}

/** Sync a single credential: login → fetch all data → write to cache */
async function syncCredential(creds: {
  id: string;
  finnaInstance: string;
  finnaUsername: string;
  encryptedPassword: string;
  iv: string;
  authTag: string;
  label: string | null;
}): Promise<SyncResult> {
  const instanceName =
    FINNA_INSTANCES[creds.finnaInstance as FinnaInstanceId]?.name ??
    creds.finnaInstance;
  const cardLabel = creds.label || instanceName;
  const now = new Date();

  try {
    const password = decrypt(creds.encryptedPassword, creds.iv, creds.authTag);
    const session = await finnaLogin(
      creds.finnaUsername,
      password,
      creds.finnaInstance as FinnaInstanceId,
    );

    // Fetch all data types in parallel from the same session
    const [loansData, holdsData, finesData] = await Promise.all([
      fetchLoans(session),
      fetchHolds(session),
      fetchFines(session),
    ]);

    const loans = loansData.loans.map((l) => ({
      ...l,
      credentialId: creds.id,
      cardLabel,
    }));
    const holds = holdsData.map((h) => ({ ...h, credentialId: creds.id, cardLabel }));
    const fines = finesData.map((f) => ({ ...f, credentialId: creds.id, cardLabel }));

    // Upsert cache
    await db
      .insert(libraryCache)
      .values({
        credentialId: creds.id,
        loans,
        holds,
        fines,
        syncedAt: now,
        syncError: null,
      })
      .onConflictDoUpdate({
        target: [libraryCache.credentialId],
        set: { loans, holds, fines, syncedAt: now, syncError: null },
      });

    return { credentialId: creds.id, cardLabel, loans, holds, fines, syncedAt: now };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Sync failed";

    // Write error to cache but keep stale data
    await db
      .insert(libraryCache)
      .values({
        credentialId: creds.id,
        loans: [],
        holds: [],
        fines: [],
        syncedAt: now,
        syncError: errorMessage,
      })
      .onConflictDoUpdate({
        target: [libraryCache.credentialId],
        set: { syncedAt: now, syncError: errorMessage },
      });

    return {
      credentialId: creds.id,
      cardLabel,
      loans: [],
      holds: [],
      fines: [],
      syncedAt: now,
      error: `${cardLabel}: ${errorMessage}`,
    };
  }
}

/** Sync all credentials for a user. Returns fresh data + sync timestamp. */
export async function syncUserData(userId: string): Promise<{
  results: SyncResult[];
  syncedAt: string;
  error?: string;
}> {
  const allCreds = await db
    .select()
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, userId));

  if (allCreds.length === 0) {
    return { results: [], syncedAt: new Date().toISOString(), error: "No library credentials linked" };
  }

  // Rate limit: check most recent sync across all credentials
  const existingCache = await db
    .select({ syncedAt: libraryCache.syncedAt })
    .from(libraryCache)
    .innerJoin(libraryCredentials, eq(libraryCredentials.id, libraryCache.credentialId))
    .where(eq(libraryCredentials.userId, userId))
    .limit(1);

  if (existingCache.length > 0) {
    const elapsed = Date.now() - existingCache[0].syncedAt.getTime();
    if (elapsed < RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return {
        results: [],
        syncedAt: existingCache[0].syncedAt.toISOString(),
        error: `Rate limited. Try again in ${waitSeconds}s.`,
      };
    }
  }

  const results = await Promise.all(allCreds.map(syncCredential));
  const errors = results.map((r) => r.error).filter(Boolean) as string[];
  const syncedAt = new Date().toISOString();

  return {
    results,
    syncedAt,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}

/** Sync all users (for cron). Returns summary per user. */
export async function syncAllUsers(): Promise<
  { userId: string; synced: number; errors: number }[]
> {
  // Get all unique user IDs with linked credentials
  const userIds = await db
    .selectDistinct({ userId: libraryCredentials.userId })
    .from(libraryCredentials);

  const summaries: { userId: string; synced: number; errors: number }[] = [];

  for (const { userId } of userIds) {
    const creds = await db
      .select()
      .from(libraryCredentials)
      .where(eq(libraryCredentials.userId, userId));

    const results = await Promise.all(creds.map(syncCredential));
    const errors = results.filter((r) => r.error).length;

    summaries.push({
      userId,
      synced: results.length - errors,
      errors,
    });
  }

  return summaries;
}

/** Read cached data for a user. Returns null if no cache exists. */
export async function readCachedData(userId: string): Promise<{
  loans: Loan[];
  holds: Hold[];
  fines: Fine[];
  syncedAt: string | null;
  syncErrors: string[];
} | null> {
  const cached = await db
    .select({
      credentialId: libraryCache.credentialId,
      loans: libraryCache.loans,
      holds: libraryCache.holds,
      fines: libraryCache.fines,
      syncedAt: libraryCache.syncedAt,
      syncError: libraryCache.syncError,
    })
    .from(libraryCache)
    .innerJoin(
      libraryCredentials,
      eq(libraryCredentials.id, libraryCache.credentialId),
    )
    .where(eq(libraryCredentials.userId, userId));

  if (cached.length === 0) return null;

  const allLoans = cached.flatMap((c) => c.loans ?? []);
  const allHolds = cached.flatMap((c) => c.holds ?? []);
  const allFines = cached.flatMap((c) => c.fines ?? []);
  const syncErrors = cached
    .map((c) => c.syncError)
    .filter(Boolean) as string[];

  // Use the oldest syncedAt across all credentials
  const oldestSync = cached.reduce(
    (oldest, c) => (c.syncedAt < oldest ? c.syncedAt : oldest),
    cached[0].syncedAt,
  );

  return {
    loans: allLoans,
    holds: allHolds,
    fines: allFines,
    syncedAt: oldestSync.toISOString(),
    syncErrors,
  };
}
