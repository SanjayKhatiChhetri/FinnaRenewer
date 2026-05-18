import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { renewalLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { HistoryContent } from "@/components/history/history-content";

export const metadata = { title: "History — Finna Renewer" };

export default async function HistoryPage() {
  const session = await auth();

  const logs = await db
    .select()
    .from(renewalLogs)
    .where(eq(renewalLogs.userId, session!.user!.id!))
    .orderBy(desc(renewalLogs.createdAt))
    .limit(50);

  return <HistoryContent logs={logs} />;
}
