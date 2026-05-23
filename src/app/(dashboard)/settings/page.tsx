import { getLinkedCards } from "@/server/actions/library";
import { getUserSettings } from "@/server/actions/settings";
import { SettingsContent } from "@/components/settings/settings-content";

export const metadata = { title: "Settings — Finna Renewer" };

export default async function SettingsPage() {
  const cards = await getLinkedCards();
  const settings = await getUserSettings();

  return <SettingsContent cards={cards} settings={settings} />;
}
