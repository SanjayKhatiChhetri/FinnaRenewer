"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  libraryCredentials,
  userSettings,
  pushSubscriptions,
  renewalLogs,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  hasPassword: boolean;
  connectedProviders: { provider: string; providerAccountId: string }[];
  cardCount: number;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      createdAt: users.createdAt,
      hashedPassword: users.hashedPassword,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return null;

  const oauthAccounts = await db
    .select({
      provider: accounts.provider,
      providerAccountId: accounts.providerAccountId,
    })
    .from(accounts)
    .where(eq(accounts.userId, session.user.id));

  const cards = await db
    .select({ id: libraryCredentials.id })
    .from(libraryCredentials)
    .where(eq(libraryCredentials.userId, session.user.id));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: !!user.hashedPassword,
    connectedProviders: oauthAccounts,
    cardCount: cards.length,
  };
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) return { error: "Name is required (max 100 characters)" };

  await db
    .update(users)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // Cascade deletes handle accounts, sessions, credentials, settings, subscriptions, logs
  // (all have onDelete: "cascade" referencing users.id)
  await db.delete(users).where(eq(users.id, session.user.id));

  return { success: true };
}
