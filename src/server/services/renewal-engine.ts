import { db } from "@/lib/db";
import { libraryCredentials, userSettings, renewalLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "./encryption";
import { finnaLogin } from "@/server/finna/client";
import { fetchLoans } from "@/server/finna/loans";
import { renewAll } from "@/server/finna/renew";
import type { FinnaInstanceId } from "@/server/finna/types";
import {
  sendDiscordWebhook,
  buildRenewalEmbed,
  buildUpcomingEmbed,
  buildErrorEmbed,
} from "./discord";
import { sendPushToUser } from "./push-notifications";
import type { RenewalResult } from "@/server/finna/types";

export async function runRenewalForUser(
  userId: string,
  triggeredBy: "manual" | "cron"
): Promise<{
  status: "success" | "partial" | "failed" | "nothing" | "error";
  message: string;
  results?: RenewalResult[];
}> {
  const [creds] = await db
    .select()
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, userId))
    .limit(1);

  if (!creds) {
    return { status: "error", message: "No library credentials linked" };
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  const renewDaysBefore = settings?.renewDaysBefore ?? 7;

  try {
    const password = decrypt(creds.encryptedPassword, creds.iv, creds.authTag);
    const session = await finnaLogin(
      creds.finnaUsername,
      password,
      creds.finnaInstance as FinnaInstanceId,
    );

    const { loans, csrf } = await fetchLoans(session);

    const now = new Date();
    const cutoff = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + renewDaysBefore + 1,
      0, 0, 0
    );

    const toRenew = loans.filter(
      (l) => l.dueDate.getTime() > 0 && l.dueDate <= cutoff
    );

    if (toRenew.length === 0) {
      if (settings?.discordWebhookUrl) {
        const embed = buildUpcomingEmbed(loans, renewDaysBefore);
        await sendDiscordWebhook(settings.discordWebhookUrl, embed).catch(() => {});
      }

      if (settings?.notificationsEnabled) {
        await sendPushToUser(userId, {
          title: "Finna Check-in",
          body: `All ${loans.length} loans are safe. Nothing to renew.`,
          tag: "finna-checkin",
          url: "/dashboard",
        }).catch(() => {});
      }

      return { status: "nothing", message: `No loans due within ${renewDaysBefore} days` };
    }

    const results = await renewAll(session, csrf, loans);

    const renewed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    let status: "success" | "partial" | "failed";
    if (failed === 0) status = "success";
    else if (renewed === 0) status = "failed";
    else status = "partial";

    await db.insert(renewalLogs).values({
      userId,
      triggeredBy,
      status,
      totalLoans: results.length,
      renewedCount: renewed,
      failedCount: failed,
      details: results.map((r) => ({
        title: r.loan.title,
        success: r.success,
        oldDueDate: r.loan.dueDate.toISOString(),
        newDueDate: r.newDueDate?.toISOString(),
        errorMessage: r.errorMessage,
      })),
    });

    if (settings?.discordWebhookUrl) {
      const embed = buildRenewalEmbed(results);
      await sendDiscordWebhook(settings.discordWebhookUrl, embed).catch(() => {});
    }

    if (settings?.notificationsEnabled) {
      await sendPushToUser(userId, {
        title: status === "success" ? "Renewal Complete" : "Renewal Issues",
        body:
          status === "success"
            ? `All ${renewed} loans renewed successfully!`
            : `${renewed} renewed, ${failed} failed. Check the dashboard.`,
        tag: "finna-renewal",
        url: "/dashboard",
      }).catch(() => {});
    }

    return { status, message: `${renewed} renewed, ${failed} failed`, results };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await db.insert(renewalLogs).values({
      userId,
      triggeredBy,
      status: "error",
      totalLoans: 0,
      renewedCount: 0,
      failedCount: 0,
      errorMessage: message,
    });

    if (settings?.discordWebhookUrl) {
      const embed = buildErrorEmbed(message);
      await sendDiscordWebhook(settings.discordWebhookUrl, embed).catch(() => {});
    }

    if (settings?.notificationsEnabled) {
      await sendPushToUser(userId, {
        title: "Renewal Error",
        body: `Failed: ${message.slice(0, 100)}`,
        tag: "finna-error",
        url: "/dashboard",
      }).catch(() => {});
    }

    return { status: "error", message };
  }
}
