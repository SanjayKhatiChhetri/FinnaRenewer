"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { libraryCredentials } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/server/services/encryption";
import { finnaLogin } from "@/server/finna/client";
import { fetchLoans } from "@/server/finna/loans";
import { renewSelected } from "@/server/finna/renew";
import { FINNA_INSTANCES } from "@/server/finna/instances";
import { runRenewalForUser } from "@/server/services/renewal-engine";
import type { Loan, FinnaInstanceId } from "@/server/finna/types";

export async function fetchUserLoans(): Promise<{
  loans?: Loan[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const allCreds = await db
    .select()
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id));

  if (allCreds.length === 0) return { error: "No library credentials linked" };

  const allLoans: Loan[] = [];
  const errors: string[] = [];

  for (const creds of allCreds) {
    const instanceName =
      FINNA_INSTANCES[creds.finnaInstance as FinnaInstanceId]?.name ??
      creds.finnaInstance;
    const cardLabel = creds.label || instanceName;

    try {
      const password = decrypt(
        creds.encryptedPassword,
        creds.iv,
        creds.authTag,
      );
      const finnaSession = await finnaLogin(
        creds.finnaUsername,
        password,
        creds.finnaInstance as FinnaInstanceId,
      );
      const { loans } = await fetchLoans(finnaSession);

      for (const loan of loans) {
        allLoans.push({ ...loan, credentialId: creds.id, cardLabel });
      }
    } catch (err) {
      errors.push(
        `${cardLabel}: ${err instanceof Error ? err.message : "Failed"}`,
      );
    }
  }

  if (allLoans.length === 0 && errors.length > 0) {
    return { error: errors.join("; ") };
  }

  return { loans: allLoans };
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
