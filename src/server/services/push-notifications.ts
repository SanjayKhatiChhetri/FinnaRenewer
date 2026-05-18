import webPush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;

  webPush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  actions?: { action: string; title: string }[];
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!configureVapid()) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          stale.push(sub.id);
        }
      }
    })
  );

  if (stale.length > 0) {
    for (const id of stale) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.id, id));
    }
  }
}
