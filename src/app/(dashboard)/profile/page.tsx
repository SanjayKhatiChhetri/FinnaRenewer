import { getUserProfile } from "@/server/actions/profile";
import { ProfileContent } from "@/components/profile/profile-content";
import { redirect } from "next/navigation";

export const metadata = { title: "Profile — Finna Renewer" };

export default async function ProfilePage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  return <ProfileContent profile={profile} />;
}
