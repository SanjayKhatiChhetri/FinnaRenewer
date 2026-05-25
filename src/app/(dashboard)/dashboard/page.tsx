import { auth } from "@/lib/auth";
import { getLinkedStatus } from "@/server/actions/library";
import { fetchCachedData } from "@/server/actions/sync";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { LinkPrompt } from "@/components/dashboard/link-prompt";

export const metadata = { title: "Dashboard — Finna Renewer" };

export default async function DashboardPage() {
  const session = await auth();
  const { linked, cards } = await getLinkedStatus();

  if (!linked || !cards) {
    return <LinkPrompt />;
  }

  const cached = await fetchCachedData();

  return (
    <DashboardContent
      userName={session?.user?.name ?? "there"}
      cards={cards}
      initialLoans={cached.loans}
      initialError={
        cached.syncErrors.length > 0
          ? cached.syncErrors.join("; ")
          : undefined
      }
      syncedAt={cached.syncedAt}
      hasCachedData={cached.hasCachedData}
    />
  );
}
