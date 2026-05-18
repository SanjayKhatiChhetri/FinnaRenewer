import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar, MobileNav } from "@/components/shared/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar userName={session.user?.name} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileNav userName={session.user?.name} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
