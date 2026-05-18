import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Zap, Bell, Shield } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-canvas">
      {/* Nav */}
      <header className="border-b border-hairline-soft">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-body font-medium text-ink">
              Finna Renewer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-6">
        <section className="py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-pill bg-tint-lavender px-3.5 py-1.5 text-caption font-medium text-primary-deep mb-6">
            <Zap className="h-3.5 w-3.5" />
            Automatic library loan renewal
          </div>

          <h1 className="font-display text-display-xl md:text-[4rem] font-medium text-ink tracking-tight leading-[1.05] text-balance max-w-3xl mx-auto">
            Never pay a late fee on your library books again
          </h1>

          <p className="mt-6 text-body-lg text-slate max-w-xl mx-auto leading-relaxed">
            Connect your Oulu Finna library card and we&apos;ll automatically
            renew your loans before they&apos;re due. Get notified via push
            or Discord.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Start for free</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">Log in</Button>
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="pb-24 grid gap-4 md:grid-cols-3">
          <FeatureCard
            tint="bg-tint-mint"
            icon={<Zap className="h-5 w-5 text-success" />}
            title="Auto-renew"
            description="Loans due within 7 days are renewed automatically every week. Configurable threshold."
          />
          <FeatureCard
            tint="bg-tint-sky"
            icon={<Bell className="h-5 w-5 text-info" />}
            title="Push notifications"
            description="Get instant alerts on your phone or desktop when renewals happen or need attention."
          />
          <FeatureCard
            tint="bg-tint-lavender"
            icon={<Shield className="h-5 w-5 text-primary" />}
            title="Secure"
            description="Library credentials are encrypted with AES-256-GCM. We never store plain-text passwords."
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center">
          <p className="text-caption text-steel">
            Finna Renewer &middot; Open source &middot; Not affiliated with Finna or Oulu City Library
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  tint,
  icon,
  title,
  description,
}: {
  tint: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={`${tint} rounded-lg p-8`}>
      <div className="mb-4">{icon}</div>
      <h3 className="font-display text-heading-3 font-medium text-ink mb-2">
        {title}
      </h3>
      <p className="text-body-sm text-charcoal leading-relaxed">
        {description}
      </p>
    </div>
  );
}
