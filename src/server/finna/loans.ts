import * as cheerio from "cheerio";
import type { Loan, CheckoutPageData, FinnaSession } from "./types";
import { fetchWithRetry } from "./client";

const DUE_DATE_REGEX = /(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{2}\.\d{2})/;

export async function fetchLoans(session: FinnaSession): Promise<CheckoutPageData> {
  const checkedOutUrl = `${session.baseUrl}/MyResearch/CheckedOut`;
  const resp = await fetchWithRetry(checkedOutUrl, {
    cookies: session.cookies,
    headers: { Referer: session.baseUrl },
  });

  if (resp.url.includes("/MyResearch/Login") || resp.url.includes("/MyResearch/UserLogin")) {
    throw new Error("SESSION_EXPIRED");
  }

  if (resp.status !== 200) {
    throw new Error(`Unexpected HTTP ${resp.status} from CheckedOut`);
  }

  const html = await resp.text();
  return parseCheckoutPage(html);
}

export function parseCheckoutPage(html: string): CheckoutPageData {
  const $ = cheerio.load(html);

  const csrf = $('form#renewals input[name="csrf"]').first().attr("value");

  if (!csrf) {
    if ($('form[name="loginForm"]').length > 0) {
      throw new Error("SESSION_EXPIRED");
    }
    throw new Error("CSRF token not found in CheckedOut page");
  }

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

  return { loans, csrf };
}

export function parseDueDate(text: string): Date {
  const m = DUE_DATE_REGEX.exec(text);
  if (!m) return new Date(0);

  const [datePart, timePart] = [m[1], m[2]];
  const [day, month, year] = datePart.split(".").map(Number);
  const [hours, minutes] = timePart.split(".").map(Number);

  return new Date(year, month - 1, day, hours, minutes);
}
