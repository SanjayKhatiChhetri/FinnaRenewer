"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { BookshelfIllustration } from "@/components/shared/illustrations";

interface RenewalLog {
  id: string;
  triggeredBy: string;
  status: string;
  totalLoans: number;
  renewedCount: number;
  failedCount: number;
  details: unknown;
  errorMessage: string | null;
  createdAt: Date;
}

export function HistoryContent({ logs }: { logs: RenewalLog[] }) {
  return (
    <div>
      <h1 className="font-display text-display font-medium text-ink mb-2">
        Renewal History
      </h1>
      <p className="text-body text-slate mb-8">
        A log of all past renewal attempts.
      </p>

      {logs.length === 0 ? (
        <Card variant="flat" padding="lg" className="animate-fade-up">
          <CardContent className="text-center py-12">
            <BookshelfIllustration className="w-44 mx-auto mb-4 animate-float" />
            <p className="text-body-lg font-medium text-ink">
              The shelf is quiet — for now
            </p>
            <p className="text-body-sm text-slate mt-1 max-w-sm mx-auto">
              Every renewal we run for you lands here, with the full
              book-by-book result. The first one arrives with Monday&apos;s
              check.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => (
            <HistoryItem key={log.id} log={log} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryItem({ log, index }: { log: RenewalLog; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    log.status === "success" ? (
      <CheckCircle2 className="h-5 w-5 text-success" />
    ) : log.status === "partial" ? (
      <AlertTriangle className="h-5 w-5 text-warning" />
    ) : (
      <XCircle className="h-5 w-5 text-error" />
    );

  const statusVariant =
    log.status === "success"
      ? "success"
      : log.status === "partial"
        ? "warning"
        : "error";

  const details = log.details as
    | { title: string; success: boolean; errorMessage?: string }[]
    | null;

  return (
    <Card
      variant="base"
      padding="none"
      style={{ "--i": index } as React.CSSProperties}
      className="animate-fade-up stagger overflow-hidden"
    >
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer transition-colors duration-150 hover:bg-surface-soft"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          {statusIcon}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusVariant as "success" | "warning" | "error"}>
                {log.status}
              </Badge>
              <Badge variant="default">
                <Zap className="h-3 w-3 mr-1" />
                {log.triggeredBy}
              </Badge>
            </div>
            <p className="text-micro text-steel mt-1">
              {new Date(log.createdAt).toLocaleString()} &middot;{" "}
              {log.renewedCount} renewed, {log.failedCount} failed of{" "}
              {log.totalLoans}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-steel shrink-0 transition-transform duration-200 ease-out-quart ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Grid-rows trick animates expansion without animating height directly */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out-quart ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-hairline-soft px-5 py-4">
            {log.errorMessage && (
              <p className="text-body-sm text-error bg-error-soft rounded-md px-3 py-2 mb-3 font-mono">
                {log.errorMessage}
              </p>
            )}

            {details && details.length > 0 ? (
              <div className="space-y-2">
                {details.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-body-sm">
                    {item.success ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-error shrink-0" />
                    )}
                    <span className="text-charcoal truncate">{item.title}</span>
                    {item.errorMessage && (
                      <span className="text-micro text-error ml-auto shrink-0">
                        {item.errorMessage}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-steel">No details available</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
