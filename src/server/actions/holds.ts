"use server";

import { auth } from "@/lib/auth";
import { readCachedData } from "@/server/services/sync";
import type { Hold } from "@/server/finna/types";

export async function fetchUserHolds(): Promise<{
  holds?: Hold[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const cached = await readCachedData(session.user.id);
  if (cached) {
    return {
      holds: cached.holds,
      error: cached.syncErrors.length > 0 ? cached.syncErrors.join("; ") : undefined,
    };
  }

  return { holds: [] };
}
