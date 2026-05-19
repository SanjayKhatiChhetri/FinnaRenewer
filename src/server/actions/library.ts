"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { libraryCredentials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/server/services/encryption";
import { finnaLogin } from "@/server/finna/client";
import { isValidInstanceId } from "@/server/finna/instances";
import type { FinnaInstanceId } from "@/server/finna/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const linkSchema = z.object({
  instance: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function linkLibraryCredentials(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = linkSchema.safeParse({
    instance: formData.get("instance"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Library, username, and password are required." };
  }

  const { instance, username, password } = parsed.data;

  if (!isValidInstanceId(instance)) {
    return { error: "Invalid library selection." };
  }

  try {
    await finnaLogin(username, password, instance as FinnaInstanceId);
  } catch {
    return { error: "Could not log in to Finna. Check your credentials." };
  }

  const { encrypted, iv, authTag } = encrypt(password);

  await db
    .insert(libraryCredentials)
    .values({
      userId: session.user.id,
      finnaInstance: instance,
      finnaUsername: username,
      encryptedPassword: encrypted,
      iv,
      authTag,
    })
    .onConflictDoUpdate({
      target: libraryCredentials.userId,
      set: {
        finnaInstance: instance,
        finnaUsername: username,
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

export async function unlinkLibraryCredentials() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await db
    .delete(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { success: true };
}

export async function getLinkedStatus() {
  const session = await auth();
  if (!session?.user?.id) return { linked: false };

  const [creds] = await db
    .select({
      id: libraryCredentials.id,
      username: libraryCredentials.finnaUsername,
      instance: libraryCredentials.finnaInstance,
    })
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id))
    .limit(1);

  return { linked: !!creds, username: creds?.username, instance: creds?.instance };
}
