"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { libraryCredentials } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/server/services/encryption";
import { finnaLogin } from "@/server/finna/client";
import { fetchLoans } from "@/server/finna/loans";
import { renewSelected } from "@/server/finna/renew";
import { runRenewalForUser } from "@/server/services/renewal-engine";
import { readCachedData } from "@/server/services/sync";
import type { Loan, FinnaInstanceId } from "@/server/finna/types";

export async function fetchUserLoans(): Promise<{
  loans?: Loan[];
  syncedAt?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // Read from cache first
  const cached = await readCachedData(session.user.id);
  if (cached && cached.loans.length > 0) {
    return {
      loans: cached.loans,
      syncedAt: cached.syncedAt ?? undefined,
      error: cached.syncErrors.length > 0 ? cached.syncErrors.join("; ") : undefined,
    };
  }

  // No cache — return empty with flag (UI will trigger initial sync)
  if (cached) {
    return {
      loans: [],
      syncedAt: cached.syncedAt ?? undefined,
      error: cached.syncErrors.length > 0 ? cached.syncErrors.join("; ") : undefined,
    };
  }

  return { loans: [] };
}

export async function renewUserLoans() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  return runRenewalForUser(session.user.id, "manual");
}

export async function renewSingleLoan(
  loanId: string,
  credentialId?: string,
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const whereClause = credentialId
    ? and(
        eq(libraryCredentials.id, credentialId),
        eq(libraryCredentials.userId, session.user.id),
      )
    : eq(libraryCredentials.userId, session.user.id);

  const [creds] = await db
    .select()
    .from(libraryCredentials)
    .where(whereClause)
    .limit(1);

  if (!creds) return { error: "No library credentials linked" };

  try {
    const password = decrypt(creds.encryptedPassword, creds.iv, creds.authTag);
    const finnaSession = await finnaLogin(
      creds.finnaUsername,
      password,
      creds.finnaInstance as FinnaInstanceId,
    );
    const { loans, csrf, renewalUrl } = await fetchLoans(finnaSession);
    const results = await renewSelected(
      finnaSession,
      csrf,
      [loanId],
      loans,
      renewalUrl,
    );

    if (results.length === 0) return { error: "Loan not found" };
    const result = results[0];
    return {
      success: result.success,
      message: result.success
        ? "Renewed successfully"
        : result.errorMessage ?? "Renewal failed",
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to renew loan",
    };
  }
}
