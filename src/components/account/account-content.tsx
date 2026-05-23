"use client";

import { useEffect, useState } from "react";
import { fetchUserHolds } from "@/server/actions/holds";
import { fetchUserFines } from "@/server/actions/fines";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookmarkCheck,
  Clock,
  MapPin,
  AlertTriangle,
  Loader2,
  XCircle,
  RefreshCw,
  CreditCard,
  ExternalLink,
  Banknote,
  Calendar,
} from "lucide-react";
import type { Hold, Fine } from "@/server/finna/types";

export function AccountContent() {
  const [holds, setHolds] = useState<Hold[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [holdsError, setHoldsError] = useState("");
  const [finesError, setFinesError] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setHoldsError("");
    setFinesError("");

    const [holdsResult, finesResult] = await Promise.all([
      fetchUserHolds(),
      fetchUserFines(),
    ]);

    if (holdsResult.error) {
      setHoldsError(holdsResult.error);
    } else if (holdsResult.holds) {
      setHolds(
        holdsResult.holds.map((h) => ({
          ...h,
          expirationDate: h.expirationDate
            ? new Date(h.expirationDate)
            : undefined,
          createdDate: h.createdDate ? new Date(h.createdDate) : undefined,
        })),
      );
    }

    if (finesResult.error) {
      setFinesError(finesResult.error);
    } else if (finesResult.fines) {
      setFines(
        finesResult.fines.map((f) => ({
          ...f,
          date: f.date ? new Date(f.date) : undefined,
        })),
      );
    }

    setLoading(false);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-display font-medium text-ink">
            Account
          </h1>
          <p className="text-body text-slate mt-1">
            Holds, fines, and library account status.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadAll}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-body-sm text-slate">
            Loading account data from Finna…
          </p>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-tint-lavender rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate mb-1">
                <BookmarkCheck className="h-4 w-4" />
                <span className="text-micro font-medium uppercase tracking-wider">
                  Holds
                </span>
              </div>
              <p className="font-display text-heading-1 font-medium text-ink">
                {holds.length}
              </p>
            </div>
            <div className={`rounded-lg p-4 ${fines.length > 0 ? "bg-tint-rose" : "bg-tint-mint"}`}>
              <div className="flex items-center gap-2 text-slate mb-1">
                <Banknote className="h-4 w-4" />
                <span className="text-micro font-medium uppercase tracking-wider">
                  Fines
                </span>
              </div>
              <p className="font-display text-heading-1 font-medium text-ink">
                {fines.length}
              </p>
            </div>
          </div>

          <HoldsSection holds={holds} error={holdsError} />
          <FinesSection fines={fines} error={finesError} />
        </div>
      )}
    </div>
  );
}

function HoldsSection({ holds, error }: { holds: Hold[]; error: string }) {
  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-lavender">
            <BookmarkCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-heading-3">Holds</CardTitle>
            <CardDescription>
              {holds.length === 0
                ? "No active holds"
                : `${holds.length} active hold${holds.length > 1 ? "s" : ""}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-tint-rose px-4 py-3">
            <XCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <p className="text-body-sm text-charcoal">{error}</p>
          </div>
        )}

        {!error && holds.length === 0 && (
          <div className="text-center py-8">
            <BookmarkCheck className="h-10 w-10 text-stone mx-auto mb-3" />
            <p className="text-body text-slate">No holds</p>
            <p className="text-micro text-steel mt-1">
              You don&apos;t have any active holds or recalls.
            </p>
          </div>
        )}

        {holds.length > 0 && (
          <div className="space-y-3">
            {holds.map((hold, i) => (
              <HoldCard key={`${hold.credentialId}-${hold.title}-${i}`} hold={hold} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HoldCard({ hold }: { hold: Hold }) {
  const statusBadge = getHoldStatusBadge(hold.status);

  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="text-body-sm font-medium text-ink leading-snug line-clamp-2">
            {hold.title}
          </p>
          {statusBadge && (
            <Badge variant={statusBadge.variant} className="shrink-0 ml-1">
              {statusBadge.label}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-micro text-steel">
          {hold.cardLabel && (
            <span className="inline-flex items-center gap-1 text-primary font-medium">
              <CreditCard className="h-3 w-3" />
              {hold.cardLabel}
            </span>
          )}
          {hold.pickupLocation && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {hold.pickupLocation}
            </span>
          )}
          {hold.position !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Position {hold.position} in queue
            </span>
          )}
          {hold.expirationDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expires {formatShortDate(hold.expirationDate)}
            </span>
          )}
        </div>
      </div>

      {hold.recordUrl && (
        <a
          href={hold.recordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-md text-steel hover:text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function FinesSection({ fines, error }: { fines: Fine[]; error: string }) {
  const totalBalance = fines.reduce((sum, f) => {
    const amount = parseFloat(f.balance.replace(",", ".").replace(/[^\d.]/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${fines.length > 0 ? "bg-tint-rose" : "bg-tint-mint"}`}>
              <Banknote className={`h-5 w-5 ${fines.length > 0 ? "text-error" : "text-success"}`} />
            </div>
            <div>
              <CardTitle className="text-heading-3">Fines</CardTitle>
              <CardDescription>
                {fines.length === 0
                  ? "No outstanding fines"
                  : `${fines.length} fine${fines.length > 1 ? "s" : ""} outstanding`}
              </CardDescription>
            </div>
          </div>
          {fines.length > 0 && (
            <Badge variant="error">
              {totalBalance.toFixed(2).replace(".", ",")} €
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-tint-rose px-4 py-3">
            <XCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
            <p className="text-body-sm text-charcoal">{error}</p>
          </div>
        )}

        {!error && fines.length === 0 && (
          <div className="text-center py-8">
            <Banknote className="h-10 w-10 text-stone mx-auto mb-3" />
            <p className="text-body text-slate">No fines</p>
            <p className="text-micro text-steel mt-1">
              Your library account has no outstanding fines.
            </p>
          </div>
        )}

        {fines.length > 0 && (
          <div className="space-y-3">
            {fines.map((fine, i) => (
              <FineCard key={`${fine.credentialId}-${fine.title}-${i}`} fine={fine} />
            ))}

            {/* Total row */}
            <div className="flex items-center justify-between border-t border-hairline-soft pt-3 mt-3">
              <span className="text-body-sm font-medium text-charcoal">Total balance</span>
              <span className="text-body font-medium text-error">
                {totalBalance.toFixed(2).replace(".", ",")} €
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FineCard({ fine }: { fine: Fine }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md bg-surface px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-medium text-ink leading-snug line-clamp-2">
          {fine.title}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-micro text-steel">
          {fine.cardLabel && (
            <span className="inline-flex items-center gap-1 text-primary font-medium">
              <CreditCard className="h-3 w-3" />
              {fine.cardLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {fine.type}
          </span>
          {fine.date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatShortDate(fine.date)}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right flex items-center gap-2">
        <span className="text-body-sm font-medium text-error">{fine.balance}</span>
        {fine.recordUrl && (
          <a
            href={fine.recordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-steel hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function getHoldStatusBadge(
  status?: string,
): { variant: "success" | "warning" | "default"; label: string } | null {
  if (!status) return null;
  switch (status) {
    case "available":
      return { variant: "success", label: "Ready for pickup" };
    case "in_transit":
      return { variant: "warning", label: "In transit" };
    case "waiting":
      return { variant: "default", label: "In queue" };
    default:
      return { variant: "default", label: status };
  }
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
