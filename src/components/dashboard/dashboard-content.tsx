"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchUserLoans, renewUserLoans } from "@/server/actions/loans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { daysUntilDue, formatFinnishDate, truncate } from "@/lib/utils";
import {
  RefreshCw,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import type { Loan } from "@/server/finna/types";

export function DashboardContent({
  userName,
  finnaUsername,
}: {
  userName: string;
  finnaUsername: string;
}) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renewalStatus, setRenewalStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadLoans();
  }, []);

  async function loadLoans() {
    setLoading(true);
    setError("");
    const result = await fetchUserLoans();
    if (result.error) {
      setError(result.error);
    } else if (result.loans) {
      setLoans(
        result.loans.map((l) => ({
          ...l,
          dueDate: new Date(l.dueDate),
        }))
      );
    }
    setLoading(false);
  }

  function handleRenew() {
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
        loadLoans();
      }
    });
  }

  const overdue = loans.filter((l) => daysUntilDue(l.dueDate) < 0);
  const dueSoon = loans.filter(
    (l) => daysUntilDue(l.dueDate) >= 0 && daysUntilDue(l.dueDate) <= 7
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
            Logged in as{" "}
            <span className="font-mono text-body-sm text-charcoal bg-surface rounded px-1.5 py-0.5">
              {finnaUsername}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={loadLoans} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRenew} disabled={isPending || loading}>
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
          className={`rounded-lg px-4 py-3 mb-6 flex items-start gap-3 ${
            renewalStatus.status === "success"
              ? "bg-tint-mint"
              : renewalStatus.status === "error" || renewalStatus.status === "failed"
                ? "bg-tint-rose"
                : "bg-tint-yellow"
          }`}
        >
          {renewalStatus.status === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
          )}
          <div>
            <p className="text-body-sm font-medium text-ink">
              {renewalStatus.status === "success"
                ? "All loans renewed!"
                : renewalStatus.status === "nothing"
                  ? "Nothing to renew"
                  : "Renewal result"}
            </p>
            <p className="text-body-sm text-charcoal">{renewalStatus.message}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card variant="rose" padding="md" className="mb-6">
          <CardContent className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm font-medium text-ink">Failed to load loans</p>
              <p className="text-body-sm text-charcoal">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-body-sm text-slate">Loading your loans from Finna…</p>
        </div>
      )}

      {/* Stats */}
      {!loading && !error && (
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
          <div className="space-y-3">
            {overdue.length > 0 && (
              <LoanSection title="Overdue" loans={overdue} variant="error" />
            )}
            {dueSoon.length > 0 && (
              <LoanSection title="Due soon" loans={dueSoon} variant="warning" />
            )}
            {safe.length > 0 && (
              <LoanSection title="Safe" loans={safe} variant="success" />
            )}
            {loans.length === 0 && (
              <Card variant="flat" padding="lg">
                <CardContent className="text-center py-8">
                  <BookOpen className="h-10 w-10 text-stone mx-auto mb-3" />
                  <p className="text-body text-slate">No loans found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
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
    <div className={`${tint} rounded-lg p-4`}>
      <div className="flex items-center gap-2 text-slate mb-1">
        {icon}
        <span className="text-micro font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-display text-heading-1 font-medium text-ink">
        {value}
      </p>
    </div>
  );
}

function LoanSection({
  title,
  loans,
  variant,
}: {
  title: string;
  loans: Loan[];
  variant: "error" | "warning" | "success";
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={variant}>{title}</Badge>
        <span className="text-micro text-steel">{loans.length} items</span>
      </div>
      <div className="space-y-2">
        {loans.map((loan) => (
          <LoanCard key={loan.id} loan={loan} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function LoanCard({
  loan,
  variant,
}: {
  loan: Loan;
  variant: "error" | "warning" | "success";
}) {
  const days = daysUntilDue(loan.dueDate);

  const borderColor =
    variant === "error"
      ? "border-l-error"
      : variant === "warning"
        ? "border-l-warning"
        : "border-l-success";

  return (
    <Card variant="base" padding="sm" className={`border-l-[3px] ${borderColor}`}>
      <CardContent className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-medium text-ink truncate">
            {truncate(loan.title, 60)}
          </p>
          <p className="text-micro text-steel mt-0.5">
            Due {formatFinnishDate(loan.dueDate)}
          </p>
        </div>
        <Badge
          variant={variant}
          className="shrink-0"
        >
          {days < 0
            ? `${Math.abs(days)}d overdue`
            : days === 0
              ? "Due today"
              : `${days}d left`}
        </Badge>
      </CardContent>
    </Card>
  );
}
