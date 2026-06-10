import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Landing } from "@/components/landing/landing";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return <Landing />;
}
