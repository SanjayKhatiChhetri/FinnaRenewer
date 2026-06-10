"use client";

import { useState, useEffect, useTransition } from "react";
import { renewUserLoans, renewSingleLoan } from "@/server/actions/loans";
import { triggerSync } from "@/server/actions/sync";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  AllCaughtUpIllustration,
  SuccessSeal,
} from "@/components/shared/illustrations";
import { daysUntilDue, truncate } from "@/lib/utils";
import {
  RefreshCw,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  MapPin,
  BookType,
  CreditCard,
} from "lucide-react";
import type { Loan, LinkedCard } from "@/server/finna/types";

function normalizeLoans(loans: Loan[]): Loan[] {
  return loans.map((l) => ({
    ...l,
    dueDate: new Date(l.dueDate),
    checkedOutDate: l.checkedOutDate ? new Date(l.checkedOutDate) : undefined,
  }));
}

export function DashboardContent({
  userName,
  cards,
  initialLoans,
  initialError,
  syncedAt: initialSyncedAt,
  hasCachedData,
}: {
  userName: string;
  cards: LinkedCard[];
  initialLoans: Loan[];
  initialError?: string;
  syncedAt: string | null;
  hasCachedData: boolean;
}) {
  const multiCard = cards.length > 1;
  const [loans, setLoans] = useState<Loan[]>(normalizeLoans(initialLoans));
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [syncedAt, setSyncedAt] = useState(initialSyncedAt);
  const [renewalStatus, setRenewalStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-sync on first visit when no cache exists
  useEffect(() => {
    if (!hasCachedData) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSync() {
    setSyncing(true);
    setError("");
    const result = await triggerSync();
    if (result.error) {
      setError(result.error);
    }
    setLoans(normalizeLoans(result.loans));
    setSyncedAt(result.syncedAt);
    setSyncing(false);
  }

  function handleRenewAll() {
    startTransition(async () => {
      setRenewalStatus(null);
      const result = await renewUserLoans();
      if ("error" in result) {
        setRenewalStatus({ status: "error", message: result.error });
      } else {
        setRenewalStatus({
          status: result.status,
          message: result.message,
        });
        // Re-sync after renewal to update cache with new due dates
        handleSync();
      }
    });
  }

  const overdue = loans.filter((l) => daysUntilDue(l.dueDate) < 0);
  const dueSoon = loans.filter(
    (l) => daysUntilDue(l.dueDate) >= 0 && daysUntilDue(l.dueDate) <= 7,
  );
  const safe = loans.filter((l) => daysUntilDue(l.dueDate) > 7);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-display font-medium text-ink">
            Hi, {userName}
          </h1>
          <p className="text-body text-slate mt-1">
            {multiCard ? (
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                {cards.length} library cards linked
              </span>
            ) : (
              <>
                Logged in as{" "}
                <span className="font-mono text-body-sm text-charcoal bg-surface rounded px-1.5 py-0.5">
                  {cards[0].finnaUsername}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncedAtLabel syncedAt={syncedAt} />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleRenewAll}
            disabled={isPending || syncing || loans.length === 0}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Renew all
          </Button>
        </div>
      </div>

      {/* Renewal status */}
      {renewalStatus && (
        <div
          className={`rounded-lg px-4 py-3 mb-6 flex items-start gap-3 animate-fade-up ${
            renewalStatus.status === "success"
              ? "bg-tint-mint"
              : renewalStatus.status === "error" ||
                  renewalStatus.status === "failed"
                ? "bg-tint-rose"
                : "bg-tint-yellow"
          }`}
        >
          {renewalStatus.status === "success" ? (
            <SuccessSeal className="h-8 w-8 -mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning-deep mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-body-sm font-medium text-ink">
              {renewalStatus.status === "success"
                ? "All loans renewed!"
                : renewalStatus.status === "nothing"
                  ? "Nothing to renew"
                  : "Renewal result"}
            </p>
            <p className="text-body-sm text-charcoal">
              {renewalStatus.message}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !syncing && (
        <Card variant="rose" padding="md" className="mb-6">
          <CardContent className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-error-deep shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm font-medium text-ink">
                {error.includes("Rate limited") ? "Sync cooldown" : "Sync error"}
              </p>
              <p className="text-body-sm text-charcoal">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Syncing overlay */}
      {syncing && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary-deep animate-spin mb-4" />
          <p className="text-body-sm text-slate">
            Syncing with Finna…
          </p>
        </div>
      )}

      {/* Stats + Loans */}
      {!syncing && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard
              label="Total loans"
              value={loans.length}
              icon={<BookOpen className="h-4 w-4" />}
              tint="bg-tint-sky"
            />
            <StatCard
              label="Due soon"
              value={dueSoon.length}
              icon={<Clock className="h-4 w-4" />}
              tint="bg-tint-yellow"
            />
            <StatCard
              label="Overdue"
              value={overdue.length}
              icon={<AlertTriangle className="h-4 w-4" />}
              tint="bg-tint-rose"
            />
          </div>

          {/* Loan list */}
          <div className="space-y-6">
            {overdue.length > 0 && (
              <LoanSection
                title="Overdue"
                loans={overdue}
                variant="error"
                onRenewed={handleSync}
                showCardLabel={multiCard}
              />
            )}
            {dueSoon.length > 0 && (
              <LoanSection
                title="Due soon"
                loans={dueSoon}
                variant="warning"
                onRenewed={handleSync}
                showCardLabel={multiCard}
              />
            )}
            {safe.length > 0 && (
              <LoanSection
                title="Safe"
                loans={safe}
                variant="success"
                onRenewed={handleSync}
                showCardLabel={multiCard}
              />
            )}
            {loans.length === 0 && (
              <Card variant="flat" padding="lg" className="animate-fade-up">
                <CardContent className="text-center py-10">
                  <AllCaughtUpIllustration className="mx-auto mb-5 w-44 animate-float" />
                  <p className="font-display text-heading-2 font-medium text-ink">
                    You&apos;re all caught up
                  </p>
                  <p className="text-body-sm text-slate mt-1 max-w-sm mx-auto">
                    No items checked out right now. When you borrow from Finna,
                    your loans appear here and renew automatically before they&apos;re due.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                    className="mt-5"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    Check again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SyncedAtLabel({ syncedAt }: { syncedAt: string | null }) {
  if (!syncedAt) return null;

  const date = new Date(syncedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);

  let relative: string;
  if (diffMin < 1) relative = "just now";
  else if (diffMin < 60) relative = `${diffMin}m ago`;
  else if (diffHrs < 24) relative = `${diffHrs}h ago`;
  else relative = `${Math.floor(diffHrs / 24)}d ago`;

  return (
    <span
      className="text-micro text-steel hidden sm:inline"
      title={`Synced ${date.toLocaleString()}`}
      suppressHydrationWarning
    >
      Synced {relative}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <div
      className={`${tint} rounded-lg p-4 transition-transform duration-200 ease-out-quart hover:-translate-y-0.5 motion-reduce:hover:translate-y-0`}
    >
      <div className="flex items-center gap-2 text-slate mb-1">
        {icon}
        <span className="text-micro font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-heading-1 font-medium text-ink tabular-nums">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}

function LoanSection({
  title,
  loans,
  variant,
  onRenewed,
  showCardLabel,
}: {
  title: string;
  loans: Loan[];
  variant: "error" | "warning" | "success";
  onRenewed: () => void;
  showCardLabel: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Badge variant={variant}>{title}</Badge>
        <span className="text-micro text-steel">{loans.length} items</span>
      </div>
      <div className="space-y-3">
        {loans.map((loan, i) => (
          <LoanCard
            key={`${loan.credentialId}-${loan.id}`}
            loan={loan}
            index={i}
            variant={variant}
            onRenewed={onRenewed}
            showCardLabel={showCardLabel}
          />
        ))}
      </div>
    </div>
  );
}

function LoanCard({
  loan,
  index,
  variant,
  onRenewed,
  showCardLabel,
}: {
  loan: Loan;
  index: number;
  variant: "error" | "warning" | "success";
  onRenewed: () => void;
  showCardLabel: boolean;
}) {
  const [renewing, setRenewing] = useState(false);
  const [renewResult, setRenewResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const days = daysUntilDue(loan.dueDate);

  const dotColor =
    variant === "error"
      ? "bg-error"
      : variant === "warning"
        ? "bg-warning"
        : "bg-success";

  async function handleRenew() {
    setRenewing(true);
    setRenewResult(null);
    const result = await renewSingleLoan(loan.id, loan.credentialId);
    if (result.error) {
      setRenewResult({ success: false, message: result.error });
    } else {
      setRenewResult({
        success: result.success ?? false,
        message: result.message ?? "Done",
      });
      if (result.success) onRenewed();
    }
    setRenewing(false);
  }

  const coverSrc = loan.coverUrl || undefined;

  return (
    <Card
      variant="base"
      padding="none"
      style={{ "--i": index } as React.CSSProperties}
      className="overflow-hidden animate-fade-up stagger hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
    >
      <CardContent className="flex gap-4 p-4">
        {/* Cover image or placeholder */}
        <div className="shrink-0 w-16 h-22 sm:w-20 sm:h-28 rounded-md bg-surface flex items-center justify-center overflow-hidden">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <BookType className="h-8 w-8 text-stone" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`}
                  aria-hidden
                />
                <p className="text-body-sm font-medium text-ink leading-snug line-clamp-2">
                  {loan.title}
                </p>
              </div>
              {loan.author && (
                <p className="text-micro text-charcoal mt-0.5">
                  {loan.author}
                </p>
              )}
            </div>
            <Badge variant={variant} className="shrink-0 ml-2">
              {days < 0
                ? `${Math.abs(days)}d overdue`
                : days === 0
                  ? "Due today"
                  : `${days}d left`}
            </Badge>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-micro text-steel">
            {showCardLabel && loan.cardLabel && (
              <span className="inline-flex items-center gap-1 text-primary-deep font-medium">
                <CreditCard className="h-3 w-3" />
                {loan.cardLabel}
              </span>
            )}
            {loan.itemType && (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {loan.itemType}
              </span>
            )}
            {loan.year && <span>{loan.year}</span>}
            {loan.branch && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {truncate(loan.branch, 30)}
              </span>
            )}
            {loan.barcode && (
              <span className="font-mono text-stone">{loan.barcode}</span>
            )}
          </div>

          {/* Dates + renew row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-micro text-steel">
              {loan.checkedOutDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Borrowed {formatShortDate(loan.checkedOutDate)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due {formatShortDate(loan.dueDate)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRenew}
              disabled={renewing}
              className="shrink-0 ml-2"
            >
              {renewing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Renew
            </Button>
          </div>

          {/* Renewal feedback */}
          {renewResult && (
            <div
              className={`mt-2 text-micro flex items-center gap-1 animate-scale-in ${renewResult.success ? "text-success" : "text-error"}`}
            >
              {renewResult.success ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {renewResult.message}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
