import { auth } from "@/lib/auth";
import { getLinkedStatus } from "@/server/actions/library";
import { fetchUserLoans } from "@/server/actions/loans";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { LinkPrompt } from "@/components/dashboard/link-prompt";

export const metadata = { title: "Dashboard — Finna Renewer" };

export default async function DashboardPage() {
  const session = await auth();
  const { linked, cards } = await getLinkedStatus();

  if (!linked || !cards) {
    return <LinkPrompt />;
  }

  const result = await fetchUserLoans();

  return (
    <DashboardContent
      userName={session?.user?.name ?? "there"}
      cards={cards}
      initialLoans={result.loans ?? []}
      initialError={result.error}
      fetchedAt={new Date().toISOString()}
    />
  );
}
