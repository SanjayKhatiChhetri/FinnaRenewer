import * as cheerio from "cheerio";
import type { Fine, FinnaSession } from "./types";
import { fetchWithRetry } from "./client";

// Finnish: "Maksut (2)" — extract the count
const FINES_COUNT = /Maksut\s*\((\d+)\)/;

// Date pattern: "23.5.2024"
const FINNISH_DATE = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;

function parseFinnishDate(text: string): Date | undefined {
  const m = FINNISH_DATE.exec(text);
  if (!m) return undefined;
  const [, day, month, year] = m.map(Number);
  return new Date(year, month - 1, day);
}

export async function fetchFines(
  session: FinnaSession,
): Promise<Fine[]> {
  const finesUrl = `${session.baseUrl}/MyResearch/Fines`;
  const resp = await fetchWithRetry(finesUrl, {
    cookies: session.cookies,
    headers: { Referer: session.baseUrl },
  });

  if (
    resp.url.includes("/MyResearch/Login") ||
    resp.url.includes("/MyResearch/UserLogin")
  ) {
    throw new Error("SESSION_EXPIRED");
  }

  const html = await resp.text();
  return extractFines(html, session.baseUrl);
}

export function extractFines(html: string, baseUrl: string): Fine[] {
  const $ = cheerio.load(html);

  // Quick check: if heading says "Maksut (0)", return early
  const heading = $("h2").text();
  const countMatch = FINES_COUNT.exec(heading);
  if (countMatch && countMatch[1] === "0") return [];

  const fines: Fine[] = [];

  // Finna fines use a table with class "fines-table"
  // Columns: Otsikko (Title) | Tyyppi (Type) | Kirjauspvm (Date) | Maksu (Fee) | Maksettavaa (Balance)
  $("table.fines-table tbody tr, table.fines-table tr").each((_, row) => {
    const $row = $(row);

    // Skip header rows
    if ($row.find("th").length > 0 && $row.closest("thead").length > 0) return;

    // Title — in a <th> or <td> with data-label="Otsikko"
    const $title =
      $row.find('[data-label="Otsikko"]').first();
    const title = $title.text().trim();
    if (!title) return;

    // Record URL from the title link
    const titleHref = $title.find("a").attr("href");
    const recordUrl = titleHref
      ? titleHref.startsWith("http") ? titleHref : `${baseUrl}${titleHref}`
      : undefined;

    // Type — "Noutamaton varaus", "Myöhästymismaksu", etc.
    const type =
      $row.find('[data-label="Tyyppi"]').text().trim() || "Unknown";

    // Date
    const dateText = $row.find('[data-label="Kirjauspvm"]').text().trim();
    const date = parseFinnishDate(dateText);

    // Fee amount — "1,00 €"
    const amount =
      $row.find('[data-label="Maksu"]').text().trim() || "0,00 €";

    // Remaining balance — "1,00 €"
    const balance =
      $row.find('[data-label="Maksettavaa"]').text().trim() || amount;

    fines.push({ title, type, date, amount, balance, recordUrl });
  });

  return fines;
}
