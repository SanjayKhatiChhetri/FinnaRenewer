import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, KeyRound, CalendarCheck, RefreshCw } from "lucide-react";
import { BookshelfIllustration } from "@/components/shared/illustrations";

const steps = [
  {
    icon: KeyRound,
    title: "Link your card",
    body: "Add your Oulu Finna login once. It's stored encrypted, end to end.",
  },
  {
    icon: CalendarCheck,
    title: "We watch the due dates",
    body: "Your loans sync daily, so the dashboard always knows what's due.",
  },
  {
    icon: RefreshCw,
    title: "Renewals run themselves",
    body: "Anything due within a week gets renewed every Monday, automatically.",
  },
];

export function LinkPrompt() {
  return (
    <div>
      <h1 className="font-display text-display font-medium text-ink mb-2">
        Dashboard
      </h1>
      <p className="text-body text-slate mb-8">
        Connect your Finna library card to get started.
      </p>

      <Card variant="lavender" padding="lg" className="animate-fade-up">
        <CardContent>
          <div className="flex flex-col items-center text-center pt-2 pb-6">
            <BookshelfIllustration className="w-48 mb-4 animate-float" />
            <h3 className="font-display text-heading-2 font-medium text-ink mb-2">
              Your shelf is waiting
            </h3>
            <p className="text-body text-charcoal max-w-md">
              Link your library card and late fees become someone else&apos;s
              problem. Here&apos;s how it works:
            </p>
          </div>

          <ol className="grid gap-4 sm:grid-cols-3 mb-8">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                style={{ "--i": i } as React.CSSProperties}
                className="animate-fade-up stagger rounded-lg bg-canvas/70 p-4 text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-display text-body-sm font-medium text-ink">
                    {i + 1}. {title}
                  </span>
                </div>
                <p className="text-caption text-slate leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>

          <div className="flex justify-center pb-2">
            <Link href="/settings">
              <Button size="lg">
                Link my card
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
