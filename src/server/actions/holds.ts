"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { libraryCredentials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/server/services/encryption";
import { finnaLogin } from "@/server/finna/client";
import { fetchHolds } from "@/server/finna/holds";
import { FINNA_INSTANCES } from "@/server/finna/instances";
import type { Hold, FinnaInstanceId } from "@/server/finna/types";

export async function fetchUserHolds(): Promise<{
  holds?: Hold[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const allCreds = await db
    .select()
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id));

  if (allCreds.length === 0) return { error: "No library credentials linked" };

  const results = await Promise.all(
    allCreds.map(async (creds) => {
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
        const holds = await fetchHolds(finnaSession);
        return {
          holds: holds.map((h) => ({ ...h, credentialId: creds.id, cardLabel })),
          error: null,
        };
      } catch (err) {
        return {
          holds: [] as Hold[],
          error: `${cardLabel}: ${err instanceof Error ? err.message : "Failed"}`,
        };
      }
    }),
  );

  const allHolds = results.flatMap((r) => r.holds);
  const errors = results.map((r) => r.error).filter(Boolean) as string[];

  if (allHolds.length === 0 && errors.length > 0) {
    return { error: errors.join("; ") };
  }

  return { holds: allHolds };
}
