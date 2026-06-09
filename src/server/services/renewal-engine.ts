import { db } from "@/lib/db";
import {
  libraryCredentials,
  userSettings,
  renewalLogs,
  libraryCache,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "./encryption";
import { finnaLogin } from "@/server/finna/client";
import { fetchLoans } from "@/server/finna/loans";
import { renewAll } from "@/server/finna/renew";
import { FINNA_INSTANCES } from "@/server/finna/instances";
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
  triggeredBy: "manual" | "cron",
): Promise<{
  status: "success" | "partial" | "failed" | "nothing" | "error";
  message: string;
  results?: RenewalResult[];
}> {
  const allCreds = await db
    .select()
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, userId));

  if (allCreds.length === 0) {
    return { status: "error", message: "No library credentials linked" };
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  const renewDaysBefore = settings?.renewDaysBefore ?? 7;

  const now = new Date();
  const cutoff = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + renewDaysBefore + 1,
    0,
    0,
    0,
  );

  const allResults: RenewalResult[] = [];
  const cardErrors: string[] = [];
  let totalLoansAcrossCards = 0;

  for (const creds of allCreds) {
    const cardLabel =
      creds.label ||
      FINNA_INSTANCES[creds.finnaInstance as FinnaInstanceId]?.name ||
      creds.finnaInstance;

    try {
      const password = decrypt(
        creds.encryptedPassword,
        creds.iv,
        creds.authTag,
      );
      const session = await finnaLogin(
        creds.finnaUsername,
        password,
        creds.finnaInstance as FinnaInstanceId,
      );

      const { loans, csrf, renewalUrl } = await fetchLoans(session);
      totalLoansAcrossCards += loans.length;

      const toRenew = loans.filter(
        (l) => l.dueDate.getTime() > 0 && l.dueDate <= cutoff,
      );

      if (toRenew.length === 0) continue;

      const results = await renewAll(session, csrf, loans, renewalUrl);
      allResults.push(...results);

      // Refresh this card's cached loans with post-renewal due dates so the
      // dashboard reflects renewals immediately instead of waiting for the
      // next sync. Holds/fines are unaffected by renewal, so leave them.
      const newDueById = new Map(
        results
          .filter((r) => r.success && r.newDueDate)
          .map((r) => [r.loan.id, r.newDueDate as Date]),
      );
      const refreshedLoans = loans.map((l) => ({
        ...l,
        credentialId: creds.id,
        cardLabel,
        dueDate: newDueById.get(l.id) ?? l.dueDate,
      }));

      await db
        .insert(libraryCache)
        .values({
          credentialId: creds.id,
          loans: refreshedLoans,
          syncedAt: now,
        })
        .onConflictDoUpdate({
          target: [libraryCache.credentialId],
          set: { loans: refreshedLoans, syncedAt: now },
        });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      cardErrors.push(`${cardLabel}: ${message}`);
    }
  }

  // If all cards errored out with no loans processed
  if (cardErrors.length > 0 && allResults.length === 0 && totalLoansAcrossCards === 0) {
    const combinedError = cardErrors.join("; ");

    await db.insert(renewalLogs).values({
      userId,
      triggeredBy,
      status: "error",
      totalLoans: 0,
      renewedCount: 0,
      failedCount: 0,
      errorMessage: combinedError,
    });

    if (settings?.discordWebhookUrl) {
      const embed = buildErrorEmbed(combinedError);
      await sendDiscordWebhook(settings.discordWebhookUrl, embed).catch(
        () => {},
      );
    }

    if (settings?.notificationsEnabled) {
      await sendPushToUser(userId, {
        title: "Renewal Error",
        body: `Failed: ${combinedError.slice(0, 100)}`,
        tag: "finna-error",
        url: "/dashboard",
      }).catch(() => {});
    }

    return { status: "error", message: combinedError };
  }

  // Nothing to renew across any card
  if (allResults.length === 0) {
    if (settings?.discordWebhookUrl) {
      // Build embed from all loans (would need to re-fetch — keep simple for cron)
      await sendDiscordWebhook(
        settings.discordWebhookUrl,
        buildUpcomingEmbed([], renewDaysBefore),
      ).catch(() => {});
    }

    if (settings?.notificationsEnabled) {
      await sendPushToUser(userId, {
        title: "Finna Check-in",
        body: `All ${totalLoansAcrossCards} loans are safe. Nothing to renew.`,
        tag: "finna-checkin",
        url: "/dashboard",
      }).catch(() => {});
    }

    return {
      status: "nothing",
      message: `No loans due within ${renewDaysBefore} days`,
    };
  }

  const renewed = allResults.filter((r) => r.success).length;
  const failed = allResults.filter((r) => !r.success).length;

  let status: "success" | "partial" | "failed";
  if (failed === 0) status = "success";
  else if (renewed === 0) status = "failed";
  else status = "partial";

  await db.insert(renewalLogs).values({
    userId,
    triggeredBy,
    status,
    totalLoans: allResults.length,
    renewedCount: renewed,
    failedCount: failed,
    details: allResults.map((r) => ({
      title: r.loan.title,
      success: r.success,
      oldDueDate: r.loan.dueDate.toISOString(),
      newDueDate: r.newDueDate?.toISOString(),
      errorMessage: r.errorMessage,
    })),
    errorMessage:
      cardErrors.length > 0 ? cardErrors.join("; ") : undefined,
  });

  if (settings?.discordWebhookUrl) {
    const embed = buildRenewalEmbed(allResults);
    await sendDiscordWebhook(settings.discordWebhookUrl, embed).catch(
      () => {},
    );
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

  const message =
    cardErrors.length > 0
      ? `${renewed} renewed, ${failed} failed (${cardErrors.length} card error${cardErrors.length > 1 ? "s" : ""})`
      : `${renewed} renewed, ${failed} failed`;

  return { status, message, results: allResults };
}
