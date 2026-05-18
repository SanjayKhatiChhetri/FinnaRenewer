import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, libraryCredentials, userSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { runRenewalForUser } from "@/server/services/renewal-engine";

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usersWithCreds = await db
    .select({
      userId: users.id,
      autoRenew: userSettings.autoRenewEnabled,
    })
    .from(users)
    .innerJoin(libraryCredentials, eq(libraryCredentials.userId, users.id))
    .leftJoin(userSettings, eq(userSettings.userId, users.id))
    .where(
      and(
        eq(userSettings.autoRenewEnabled, true)
      )
    );

  const results: { userId: string; status: string; message: string }[] = [];

  for (const { userId } of usersWithCreds) {
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

  return NextResponse.json({ processed: results.length, results });
}
