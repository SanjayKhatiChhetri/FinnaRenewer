import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { libraryCredentials, userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncAllUsers } from "@/server/services/sync";
import { readCachedData } from "@/server/services/sync";
import { sendPushToUser } from "@/server/services/push-notifications";
import { daysUntilDue } from "@/lib/utils";

export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sync all users' Finna data into cache
  const syncResults = await syncAllUsers();

  // Send "due soon" push notifications for users with notifications enabled
  for (const { userId } of syncResults) {
    try {
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      if (!settings?.notificationsEnabled) continue;

      const cached = await readCachedData(userId);
      if (!cached || cached.loans.length === 0) continue;

      const renewDaysBefore = settings.renewDaysBefore ?? 7;
      const dueSoon = cached.loans.filter((l) => {
        const days = daysUntilDue(new Date(l.dueDate));
        return days >= 0 && days <= renewDaysBefore;
      });

      if (dueSoon.length > 0) {
        await sendPushToUser(userId, {
          title: "Loans Due Soon",
          body: `${dueSoon.length} loan${dueSoon.length > 1 ? "s" : ""} due within ${renewDaysBefore} days.`,
          tag: "finna-due-soon",
          url: "/dashboard",
        }).catch(() => {});
      }
    } catch {
      // Don't let one user's notification failure break the loop
    }
  }

  return NextResponse.json({
    synced: syncResults.length,
    results: syncResults,
  });
}
