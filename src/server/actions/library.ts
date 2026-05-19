"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { libraryCredentials } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/server/services/encryption";
import { finnaLogin } from "@/server/finna/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const linkSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function linkLibraryCredentials(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = linkSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Username and password are required." };
  }

  const { username, password } = parsed.data;

  try {
    await finnaLogin(username, password);
  } catch {
    return { error: "Could not log in to Finna. Check your credentials." };
  }

  const { encrypted, iv, authTag } = encrypt(password);

  await db
    .insert(libraryCredentials)
    .values({
      userId: session.user.id,
      finnaUsername: username,
      encryptedPassword: encrypted,
      iv,
      authTag,
    })
    .onConflictDoUpdate({
      target: libraryCredentials.userId,
      set: {
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
    .select({ id: libraryCredentials.id, username: libraryCredentials.finnaUsername })
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id))
    .limit(1);

  return { linked: !!creds, username: creds?.username };
}
