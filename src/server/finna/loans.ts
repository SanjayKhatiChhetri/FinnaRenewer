import * as cheerio from "cheerio";
import type { Loan, CheckoutPageData, FinnaSession } from "./types";
import { fetchWithRetry } from "./client";

// Matches due date in all three Finna UI languages:
//   English: "Due date: 1.6.2026"   Finnish: "Eräpäivä: 1.6.2026"   Swedish: "Förfallodag: 1.6.2026"
// Optional time component (some instances include "15.00" after the date).
const DUE_DATE_LABELED =
  /(?:Due date|Eräpäivä|Förfallodag):\s*(\d{1,2}\.\d{1,2}\.\d{4})(?:\s+(\d{2}\.\d{2}))?/i;
// Fallback for pages that embed just a raw date+time in status text
const DUE_DATE_WITH_TIME = /(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{2}\.\d{2})/;

// Matches checked-out date: "Lainattu: 8.10.2021" or "Checked out: 8.10.2021"
const CHECKED_OUT_DATE =
  /(?:Lainattu|Checked out|Utlånad):\s*(\d{1,2}\.\d{1,2}\.\d{4})/i;

// Matches labeled metadata: "Julkaisuvuosi: 2020" or "Year of Publication: 2020"
const YEAR_LABELED = /(?:Julkaisuvuosi|Year of Publication|Utgivningsår):\s*\[?(\d{4})\]?/i;
const BARCODE_LABELED = /(?:Viivakoodi|Barcode|Streckkod):\s*(\d+)/i;

export async function fetchLoans(
  session: FinnaSession,
): Promise<CheckoutPageData> {
  const checkedOutUrl = `${session.baseUrl}/MyResearch/CheckedOut`;
  const resp = await fetchWithRetry(checkedOutUrl, {
    cookies: session.cookies,
    headers: { Referer: session.baseUrl },
  });

  if (
    resp.url.includes("/MyResearch/Login") ||
    resp.url.includes("/MyResearch/UserLogin")
  ) {
    throw new Error("SESSION_EXPIRED");
  }
  if (resp.status !== 200) {
    throw new Error(`Unexpected HTTP ${resp.status} from CheckedOut`);
  }

  const html = await resp.text();
  const $ = cheerio.load(html);

  if ($('form[name="loginForm"]').length > 0) {
    throw new Error("SESSION_EXPIRED");
  }

  const loans = extractLoans($, session.baseUrl);
  const csrf = $('form#renewals input[name="csrf"]').first().attr("value");

  if (!csrf) {
    if (loans.length === 0) {
      return { loans: [], csrf: "", renewalUrl: checkedOutUrl };
    }
    throw new Error("Could not find renewal form — session may have expired");
  }

  return { loans, csrf, renewalUrl: checkedOutUrl };
}

export function parseCheckoutPage(
  html: string,
  renewalUrl = "",
): CheckoutPageData {
  const $ = cheerio.load(html);

  if ($('form[name="loginForm"]').length > 0) {
    throw new Error("SESSION_EXPIRED");
  }

  const loans = extractLoans($, renewalUrl ? new URL(renewalUrl).origin : "");
  const csrf = $('form#renewals input[name="csrf"]').first().attr("value");

  if (!csrf) {
    if (loans.length === 0) {
      return { loans: [], csrf: "", renewalUrl };
    }
    throw new Error("CSRF token not found in CheckedOut page");
  }

  return { loans, csrf, renewalUrl };
}

function extractLoans($: ReturnType<typeof cheerio.load>, baseUrl: string): Loan[] {
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
    const metadataText = $row.find(".record-core-metadata").text();
    const dueDate = parseDueDate(statusText);

    // Cover image — Finna returns relative paths like /Cover/Show?...
    const rawCover = $row.find("img.recordcover").attr("src") || undefined;
    const coverUrl =
      rawCover && !rawCover.startsWith("http") ? `${baseUrl}${rawCover}` : rawCover;

    // Author name from the inline-linked-field label
    const author =
      $row.find(".record-core-metadata .field-label").first().text().trim() ||
      undefined;

    // Item type (e.g., "Kirja" = Book, "DVD", etc.)
    const itemType =
      $row.find(".record-core-metadata .iconlabel").first().text().trim() ||
      undefined;

    // Year of publication and barcode from metadata text
    const yearMatch = YEAR_LABELED.exec(metadataText);
    const year = yearMatch?.[1] || undefined;

    const barcodeMatch = BARCODE_LABELED.exec(metadataText);
    const barcode = barcodeMatch?.[1] || undefined;

    // Branch (first <strong> in status column, e.g., "Tiedekirjasto Pegasus")
    const branch =
      $row.find(".status-column strong").first().text().trim() || undefined;

    // Checked-out date
    const checkedOutMatch = CHECKED_OUT_DATE.exec(statusText);
    let checkedOutDate: Date | undefined;
    if (checkedOutMatch) {
      const [day, month, yr] = checkedOutMatch[1].split(".").map(Number);
      checkedOutDate = new Date(yr, month - 1, day);
    }

    loans.push({
      id,
      title,
      dueDate,
      coverUrl,
      author,
      year,
      barcode,
      checkedOutDate,
      branch,
      itemType,
    });
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
