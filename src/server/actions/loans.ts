"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { libraryCredentials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/server/services/encryption";
import { finnaLogin } from "@/server/finna/client";
import { fetchLoans } from "@/server/finna/loans";
import { renewSelected } from "@/server/finna/renew";
import { runRenewalForUser } from "@/server/services/renewal-engine";
import type { Loan, FinnaInstanceId } from "@/server/finna/types";

export async function fetchUserLoans(): Promise<{
  loans?: Loan[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const [creds] = await db
    .select()
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id))
    .limit(1);

  if (!creds) return { error: "No library credentials linked" };

  try {
    const password = decrypt(creds.encryptedPassword, creds.iv, creds.authTag);
    const finnaSession = await finnaLogin(
      creds.finnaUsername,
      password,
      creds.finnaInstance as FinnaInstanceId,
    );
    const { loans } = await fetchLoans(finnaSession);
    return { loans };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to fetch loans",
    };
  }
}

export async function renewUserLoans() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  return runRenewalForUser(session.user.id, "manual");
}

export async function renewSingleLoan(
  loanId: string,
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const [creds] = await db
    .select()
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id))
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
