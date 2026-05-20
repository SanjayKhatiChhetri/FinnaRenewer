import * as cheerio from "cheerio";
import type { Loan, CheckoutPageData, FinnaSession } from "./types";
import { fetchWithRetry } from "./client";

// Matches "Due date: 1.6.2026" or "Due date: 1.6.2026 15.00"
// OUTI (VuFind 9.x) omits the time; OULA includes it.
const DUE_DATE_LABELED = /Due date:\s*(\d{1,2}\.\d{1,2}\.\d{4})(?:\s+(\d{2}\.\d{2}))?/i;
// Fallback for older Finna instances that embed just a raw date+time in status text
const DUE_DATE_WITH_TIME = /(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{2}\.\d{2})/;

export async function fetchLoans(session: FinnaSession): Promise<CheckoutPageData> {
  // VuFind 9.x instances (e.g. OUTI) render /MyResearch/CheckedOut client-side —
  // the CSRF token and loan rows are absent from the initial HTTP response.
  // The same loan table is available server-side on /MyResearch/Home.
  // Try CheckedOut first (works for older instances like OULA); fall back to Home.
  for (const path of ["/MyResearch/CheckedOut", "/MyResearch/Home"] as const) {
    const url = `${session.baseUrl}${path}`;
    const resp = await fetchWithRetry(url, {
      cookies: session.cookies,
      headers: { Referer: session.baseUrl },
    });

    if (resp.url.includes("/MyResearch/Login") || resp.url.includes("/MyResearch/UserLogin")) {
      throw new Error("SESSION_EXPIRED");
    }
    if (resp.status !== 200) {
      throw new Error(`Unexpected HTTP ${resp.status} from ${path}`);
    }

    const html = await resp.text();
    const $ = cheerio.load(html);

    if ($('form[name="loginForm"]').length > 0) {
      throw new Error("SESSION_EXPIRED");
    }

    const csrf = $('form#renewals input[name="csrf"]').first().attr("value");
    if (!csrf) continue; // renewal form absent on this page — try next URL

    return { loans: extractLoans($), csrf, renewalUrl: url };
  }

  throw new Error("Could not find renewal form — session may have expired");
}

export function parseCheckoutPage(html: string, renewalUrl = ""): CheckoutPageData {
  const $ = cheerio.load(html);

  const csrf = $('form#renewals input[name="csrf"]').first().attr("value");
  if (!csrf) {
    if ($('form[name="loginForm"]').length > 0) {
      throw new Error("SESSION_EXPIRED");
    }
    throw new Error("CSRF token not found in CheckedOut page");
  }

  return { loans: extractLoans($), csrf, renewalUrl };
}

function extractLoans($: ReturnType<typeof cheerio.load>): Loan[] {
  const loans: Loan[] = [];

  $("tr.myresearch-row").each((_, row) => {
    const $row = $(row);

    const id = $row
      .find('input[name="renewSelectedIDS[]"]')
      .first()
      .attr("value");
    if (!id) return;

    const title = $row.find("h3.record-title").text().trim();
    const statusText = $row.find(".status-column").text();
    const dueDate = parseDueDate(statusText);

    loans.push({ id, title, dueDate });
  });

  return loans;
}

export function parseDueDate(text: string): Date {
  // Try the labeled format first: "Due date: 1.6.2026" or "Due date: 1.6.2026 15.00"
  const labeled = DUE_DATE_LABELED.exec(text);
  if (labeled) {
    const [day, month, year] = labeled[1].split(".").map(Number);
    const [hours, minutes] = labeled[2]?.split(".").map(Number) ?? [0, 0];
    return new Date(year, month - 1, day, hours, minutes);
  }

  // Fall back to bare date+time in status text (older Finna instances)
  const timed = DUE_DATE_WITH_TIME.exec(text);
  if (timed) {
    const [day, month, year] = timed[1].split(".").map(Number);
    const [hours, minutes] = timed[2].split(".").map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }

  return new Date(0);
}
