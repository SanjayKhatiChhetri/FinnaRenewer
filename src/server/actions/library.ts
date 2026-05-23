"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { libraryCredentials } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@/server/services/encryption";
import { finnaLogin } from "@/server/finna/client";
import { isValidInstanceId } from "@/server/finna/instances";
import { FINNA_INSTANCES } from "@/server/finna/instances";
import type { FinnaInstanceId, LinkedCard } from "@/server/finna/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const linkSchema = z.object({
  instance: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  label: z.string().optional(),
});

export async function linkLibraryCredentials(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = linkSchema.safeParse({
    instance: formData.get("instance"),
    username: formData.get("username"),
    password: formData.get("password"),
    label: formData.get("label") || undefined,
  });

  if (!parsed.success) {
    return { error: "Library, username, and password are required." };
  }

  const { instance, username, password, label } = parsed.data;

  if (!isValidInstanceId(instance)) {
    return { error: "Invalid library selection." };
  }

  try {
    await finnaLogin(username, password, instance as FinnaInstanceId);
  } catch {
    return { error: "Could not log in to Finna. Check your credentials." };
  }

  const { encrypted, iv, authTag } = encrypt(password);

  // Upsert: same user + instance + username = update, otherwise insert
  await db
    .insert(libraryCredentials)
    .values({
      userId: session.user.id,
      label: label ?? null,
      finnaInstance: instance,
      finnaUsername: username,
      encryptedPassword: encrypted,
      iv,
      authTag,
    })
    .onConflictDoUpdate({
      target: [
        libraryCredentials.userId,
        libraryCredentials.finnaInstance,
        libraryCredentials.finnaUsername,
      ],
      set: {
        label: label ?? null,
        encryptedPassword: encrypted,
        iv,
        authTag,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}

export async function unlinkLibraryCredentials(credentialId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  if (credentialId) {
    // Delete specific card (verify ownership)
    await db
      .delete(libraryCredentials)
      .where(
        and(
          eq(libraryCredentials.id, credentialId),
          eq(libraryCredentials.userId, session.user.id),
        ),
      );
  } else {
    // Legacy: delete all cards for user
    await db
      .delete(libraryCredentials)
      .where(eq(libraryCredentials.userId, session.user.id));
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}

export async function getLinkedCards(): Promise<LinkedCard[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const cards = await db
    .select({
      id: libraryCredentials.id,
      label: libraryCredentials.label,
      finnaInstance: libraryCredentials.finnaInstance,
      finnaUsername: libraryCredentials.finnaUsername,
    })
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id));

  return cards.map((c) => ({
    ...c,
    instanceName:
      FINNA_INSTANCES[c.finnaInstance as FinnaInstanceId]?.name ??
      c.finnaInstance,
  }));
}

/** Backwards-compatible helper used by dashboard page */
export async function getLinkedStatus() {
  const cards = await getLinkedCards();
  if (cards.length === 0) {
    return { linked: false };
  }
  return {
    linked: true,
    username: cards[0].finnaUsername,
    instance: cards[0].finnaInstance,
    cards,
  };
}
