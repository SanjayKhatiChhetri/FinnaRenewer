"use server";

import { auth } from "@/lib/auth";
import { readCachedData } from "@/server/services/sync";
import type { Fine } from "@/server/finna/types";

export async function fetchUserFines(): Promise<{
  fines?: Fine[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const cached = await readCachedData(session.user.id);
  if (cached) {
    return {
      fines: cached.fines,
      error: cached.syncErrors.length > 0 ? cached.syncErrors.join("; ") : undefined,
    };
  }

  return { fines: [] };
}
