import * as cheerio from "cheerio";
import type { Loan, RenewalResult, FinnaSession } from "./types";
import { fetchWithRetry } from "./client";
import { parseDueDate } from "./loans";

export async function renewSelected(
  session: FinnaSession,
  csrf: string,
  loanIds: string[],
  allLoans: Loan[],
  renewalUrl: string,
): Promise<RenewalResult[]> {
  const selected = allLoans.filter((l) => loanIds.includes(l.id));
  if (selected.length === 0) return [];

  const params = new URLSearchParams();
  params.set("csrf", csrf);
  for (const loan of selected) {
    params.append("renewSelectedIDS[]", loan.id);
  }
  // Include all IDs in selectAllIDS/renewAllIDS (Finna expects them)
  for (const loan of allLoans) {
    params.append("selectAllIDS[]", loan.id);
    params.append("renewAllIDS[]", loan.id);
  }

  return postRenewal(session, params.toString(), selected, renewalUrl);
}

export async function renewAll(
  session: FinnaSession,
  csrf: string,
  loans: Loan[],
  renewalUrl: string,
): Promise<RenewalResult[]> {
  const body = buildRenewalForm(csrf, loans);
  return postRenewal(session, body, loans, renewalUrl);
}

async function postRenewal(
  session: FinnaSession,
  body: string,
  loans: Loan[],
  renewalUrl: string,
): Promise<RenewalResult[]> {
  const resp = await fetchWithRetry(renewalUrl, {
    method: "POST",
    cookies: session.cookies,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: renewalUrl,
    },
    body,
  });

  if (
    resp.url.includes("/MyResearch/Login") ||
    resp.url.includes("/MyResearch/UserLogin")
  ) {
    throw new Error("SESSION_EXPIRED");
  }

  if (resp.status !== 200) {
    throw new Error(`Renewal POST returned HTTP ${resp.status}`);
  }

  const html = await resp.text();
  return parseRenewalResponse(html, loans);
}

function buildRenewalForm(csrf: string, loans: Loan[]): string {
  const params = new URLSearchParams();
  params.set("csrf", csrf);
  params.set("renewAll", "1");
  params.set("selectAll", "on");

  for (const loan of loans) {
    params.append("renewSelectedIDS[]", loan.id);
    params.append("selectAllIDS[]", loan.id);
    params.append("renewAllIDS[]", loan.id);
  }

  return params.toString();
}

function parseRenewalResponse(html: string, loans: Loan[]): RenewalResult[] {
  const $ = cheerio.load(html);

  const loanById = new Map(loans.map((l) => [l.id, l]));
  const results: RenewalResult[] = [];

  $("tr.myresearch-row").each((_, row) => {
    const $row = $(row);
    const id = $row
      .find('input[name="renewSelectedIDS[]"]')
      .first()
      .attr("value");
    if (!id) return;

    const loan = loanById.get(id);
    if (!loan) return;

    const $statusCol = $row.find(".status-column");
    const statusText = $statusCol.text();

    if ($statusCol.find(".alert-success").length > 0) {
      let newDue = parseDueDate(statusText);
      if (newDue.getTime() === 0) newDue = loan.dueDate;

      results.push({ loan, success: true, newDueDate: newDue });
      return;
    }

    if ($statusCol.find(".alert-danger").length > 0) {
      const errMsg = $statusCol.find(".alert-danger").text().trim();
      results.push({ loan, success: false, errorMessage: errMsg });
      return;
    }

    results.push({
      loan,
      success: false,
      errorMessage: "No renewal status in response",
    });
  });

  return results;
}
