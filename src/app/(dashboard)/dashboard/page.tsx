import { auth } from "@/lib/auth";
import { getLinkedStatus } from "@/server/actions/library";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { LinkPrompt } from "@/components/dashboard/link-prompt";

export const metadata = { title: "Dashboard — Finna Renewer" };

export default async function DashboardPage() {
  const session = await auth();
  const { linked, username } = await getLinkedStatus();

  if (!linked) {
    return <LinkPrompt />;
  }

  return (
    <DashboardContent
      userName={session?.user?.name ?? "there"}
      finnaUsername={username!}
    />
  );
}
