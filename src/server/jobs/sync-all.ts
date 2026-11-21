import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncAllUsers, readCachedData } from "@/server/services/sync";
import { sendPushToUser } from "@/server/services/push-notifications";
import { daysUntilDue } from "@/lib/utils";

export async function syncAllUsersAndNotify() {
  const syncResults = await syncAllUsers();

  for (const { userId } of syncResults) {
    try {
      await notifyLoansDueSoon(userId);
    } catch {
      // One user's notification failure must not stop the others.
    }
  }

  return syncResults;
}

async function notifyLoansDueSoon(userId: string) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!settings?.notificationsEnabled) return;

  const cached = await readCachedData(userId);
  if (!cached || cached.loans.length === 0) return;

  const renewDaysBefore = settings.renewDaysBefore ?? 7;
  const dueSoon = cached.loans.filter((loan) => {
    const days = daysUntilDue(new Date(loan.dueDate));
    return days >= 0 && days <= renewDaysBefore;
  });

  if (dueSoon.length === 0) return;

  await sendPushToUser(userId, {
    title: "Loans Due Soon",
    body: `${dueSoon.length} loan${dueSoon.length > 1 ? "s" : ""} due within ${renewDaysBefore} days.`,
    tag: "finna-due-soon",
    url: "/dashboard",
  });
}
