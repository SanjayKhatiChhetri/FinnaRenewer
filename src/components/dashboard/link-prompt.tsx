import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";

export function LinkPrompt() {
  return (
    <div>
      <h1 className="font-display text-display font-medium text-ink mb-2">
        Dashboard
      </h1>
      <p className="text-body text-slate mb-8">
        Connect your Finna library card to get started.
      </p>

      <Card variant="lavender" padding="lg">
        <CardContent>
          <div className="flex flex-col items-center text-center py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft mb-5">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display text-heading-2 font-medium text-ink mb-2">
              Link your library card
            </h3>
            <p className="text-body text-charcoal max-w-md mb-6">
              Enter your Oulu Finna credentials to start viewing and
              automatically renewing your loans.
            </p>
            <Link href="/settings">
              <Button size="lg">
                Go to Settings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
