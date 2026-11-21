import { db } from "@/lib/db";
import { libraryCredentials, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runRenewalForUser } from "@/server/services/renewal-engine";

export async function renewAllUsers() {
  // Distinct, because a user with several linked libraries must be renewed once, not once per library.
  const usersToRenew = await db
    .selectDistinct({ userId: libraryCredentials.userId })
    .from(libraryCredentials)
    .innerJoin(userSettings, eq(userSettings.userId, libraryCredentials.userId))
    .where(eq(userSettings.autoRenewEnabled, true));

  const results: { userId: string; status: string; message: string }[] = [];

  for (const { userId } of usersToRenew) {
    try {
      const result = await runRenewalForUser(userId, "cron");
      results.push({ userId, status: result.status, message: result.message });
    } catch (err) {
      results.push({
        userId,
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}
