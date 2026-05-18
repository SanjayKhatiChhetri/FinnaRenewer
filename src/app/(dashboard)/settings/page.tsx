import { getLinkedStatus } from "@/server/actions/library";
import { getUserSettings } from "@/server/actions/settings";
import { SettingsContent } from "@/components/settings/settings-content";

export const metadata = { title: "Settings — Finna Renewer" };

export default async function SettingsPage() {
  const { linked, username } = await getLinkedStatus();
  const settings = await getUserSettings();

  return (
    <SettingsContent
      linked={linked}
      finnaUsername={username}
      settings={settings}
    />
  );
}
