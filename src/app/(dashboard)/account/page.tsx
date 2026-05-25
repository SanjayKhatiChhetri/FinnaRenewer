import { fetchCachedData } from "@/server/actions/sync";
import { AccountContent } from "@/components/account/account-content";

export const metadata = { title: "Account — Finna Renewer" };

export default async function AccountPage() {
  const cached = await fetchCachedData();

  return (
    <AccountContent
      initialHolds={cached.holds}
      initialHoldsError={
        cached.syncErrors.length > 0
          ? cached.syncErrors.join("; ")
          : undefined
      }
      initialFines={cached.fines}
      initialFinesError={undefined}
      syncedAt={cached.syncedAt}
      hasCachedData={cached.hasCachedData}
    />
  );
}
