"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings, pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const settingsSchema = z.object({
  discordWebhookUrl: z.string().url().optional().or(z.literal("")),
  renewDaysBefore: z.coerce.number().int().min(1).max(30),
  autoRenewEnabled: z.coerce.boolean(),
  notificationsEnabled: z.coerce.boolean(),
});

export async function updateSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = settingsSchema.safeParse({
    discordWebhookUrl: formData.get("discordWebhookUrl") || "",
    renewDaysBefore: formData.get("renewDaysBefore"),
    autoRenewEnabled: formData.get("autoRenewEnabled") === "on",
    notificationsEnabled: formData.get("notificationsEnabled") === "on",
  });

  if (!parsed.success) return { error: "Invalid settings" };

  await db
    .insert(userSettings)
    .values({
      userId: session.user.id,
      ...parsed.data,
      discordWebhookUrl: parsed.data.discordWebhookUrl || null,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        ...parsed.data,
        discordWebhookUrl: parsed.data.discordWebhookUrl || null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/settings");
  return { success: true };
}

export async function getUserSettings() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1);

  return settings ?? {
    discordWebhookUrl: null,
    renewDaysBefore: 7,
    autoRenewEnabled: true,
    notificationsEnabled: true,
  };
}

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: session.user.id,
      },
    });

  return { success: true };
}

export async function unsubscribePush(endpoint: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));

  return { success: true };
}
