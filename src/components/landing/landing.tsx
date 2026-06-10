"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  ShieldCheck,
  BellRing,
  CalendarClock,
  ArrowRight,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ExLibris,
  ReadingRoomScene,
  SpotLinkCard,
  SpotWatchDates,
  SpotAutoRenew,
} from "@/components/shared/illustrations";

const steps = [
  {
    spot: SpotLinkCard,
    title: "Link your card",
    body: "Add your Oulu Finna login once. It's encrypted with AES-256 the moment it leaves your hands.",
  },
  {
    spot: SpotWatchDates,
    title: "We watch the dates",
    body: "Your loans sync every day, so the shelf always knows exactly what's coming due and when.",
  },
  {
    spot: SpotAutoRenew,
    title: "Renewals run themselves",
    body: "Anything due within your window is renewed automatically each week. You just keep reading.",
  },
];

export function Landing() {
  const reduce = useReducedMotion();

  const reveal: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const inView = { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } } as const;

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Header */}
      <header className="sticky top-0 z-(--z-sticky) border-b border-hairline-soft bg-surface-soft/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="group flex items-center gap-2.5">
            <ExLibris className="h-9 w-9 transition-transform duration-300 ease-out-quart group-hover:-rotate-6 motion-reduce:group-hover:rotate-0" />
            <span className="font-display text-body-lg font-medium text-ink">
              Finna Renewer
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={reveal}
              className="mb-5 font-display text-body italic text-primary-deep"
            >
              A quiet companion for your library card
            </motion.p>
            <motion.h1
              variants={reveal}
              className="font-display text-[2.75rem] font-medium leading-[1.04] tracking-tight text-ink text-balance sm:text-[3.5rem] md:text-[4rem]"
            >
              Never pay a late fee on your library books again
            </motion.h1>
            <motion.p
              variants={reveal}
              className="mt-6 max-w-xl text-body-lg leading-relaxed text-slate text-pretty"
            >
              Connect your Oulu Finna library card and Finna Renewer renews your
              loans before they&apos;re due — automatically, every week. You&apos;ll
              hear from it by push or Discord only when it matters.
            </motion.p>
            <motion.div
              variants={reveal}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link href="/register">
                <Button size="lg">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Log in
                </Button>
              </Link>
            </motion.div>
            <motion.p
              variants={reveal}
              className="mt-5 text-caption text-steel"
            >
              Free · Open source · Your credentials never stored in plain text
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 rounded-2xl bg-primary-soft/50 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas p-6 shadow-lg paper-grain">
              <ReadingRoomScene className="w-full" />
            </div>
          </motion.div>
        </section>

        {/* How it works — a real ordered sequence */}
        <motion.section
          {...inView}
          variants={container}
          className="border-t border-hairline-soft py-16 md:py-20"
        >
          <motion.h2
            variants={reveal}
            className="font-display text-display font-medium text-ink text-balance"
          >
            Set it up once. Then forget about it.
          </motion.h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(({ spot: Spot, title, body }, i) => (
              <motion.li key={title} variants={reveal} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <Spot className="h-12 w-12" />
                  <span className="font-mono text-caption text-steel">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-heading-3 font-medium text-ink">
                  {title}
                </h3>
                <p className="mt-2 max-w-xs text-body-sm leading-relaxed text-slate">
                  {body}
                </p>
              </motion.li>
            ))}
          </ol>
        </motion.section>

        {/* Features — deliberately varied, not an identical card grid */}
        <motion.section
          {...inView}
          variants={container}
          className="grid gap-5 border-t border-hairline-soft py-16 md:grid-cols-3 md:py-20"
        >
          <motion.div
            variants={reveal}
            className="flex flex-col justify-between rounded-2xl bg-primary p-8 text-on-primary md:row-span-2"
          >
            <CalendarClock className="h-7 w-7 opacity-90" />
            <div className="mt-10">
              <h3 className="font-display text-heading-1 font-medium">
                Auto-renew, on a schedule
              </h3>
              <p className="mt-3 text-body-sm leading-relaxed text-on-primary/85">
                Loans due within your chosen window are renewed every week
                without you lifting a finger. Set the threshold from 1 to 14
                days and let it run.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={reveal}
            className="rounded-2xl border border-hairline bg-canvas p-7"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tint-sky text-info">
              <BellRing className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-heading-3 font-medium text-ink">
              Told only when it counts
            </h3>
            <p className="mt-2 text-body-sm leading-relaxed text-slate">
              Push or Discord alerts when a renewal happens — or when something
              needs your eyes. No noise.
            </p>
          </motion.div>

          <motion.div
            variants={reveal}
            className="rounded-2xl border border-hairline bg-canvas p-7"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-soft text-success-deep">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-heading-3 font-medium text-ink">
              Encrypted, end to end
            </h3>
            <p className="mt-2 text-body-sm leading-relaxed text-slate">
              Library credentials are sealed with AES-256-GCM. We never store a
              plain-text password — not even ours.
            </p>
          </motion.div>
        </motion.section>

        {/* Pull quote */}
        <motion.section
          {...inView}
          variants={reveal}
          className="border-t border-hairline-soft py-20 text-center"
        >
          <p className="mx-auto max-w-3xl font-display text-display font-medium leading-snug text-ink text-balance">
            “The best library assistant is the one you never have to think
            about.”
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg">
                Link your card
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <ExLibris className="h-7 w-7" />
            <p className="text-caption text-steel">
              Finna Renewer · Not affiliated with Finna or Oulu City Library
            </p>
          </div>
          <a
            href="https://github.com"
            className="inline-flex items-center gap-1.5 text-caption text-steel transition-colors hover:text-ink"
          >
            <Github className="h-4 w-4" />
            Open source
          </a>
        </div>
      </footer>
    </div>
  );
}
