import { fetchUserHolds } from "@/server/actions/holds";
import { fetchUserFines } from "@/server/actions/fines";
import { AccountContent } from "@/components/account/account-content";

export const metadata = { title: "Account — Finna Renewer" };

export default async function AccountPage() {
  const [holdsResult, finesResult] = await Promise.all([
    fetchUserHolds(),
    fetchUserFines(),
  ]);

  return (
    <AccountContent
      initialHolds={holdsResult.holds ?? []}
      initialHoldsError={holdsResult.error}
      initialFines={finesResult.fines ?? []}
      initialFinesError={finesResult.error}
      fetchedAt={new Date().toISOString()}
    />
  );
}
