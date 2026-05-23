import * as cheerio from "cheerio";
import type { Hold, FinnaSession } from "./types";
import { fetchWithRetry } from "./client";

// Finnish: "Varaukset (3)" — extract the count
const HOLDS_COUNT = /Varaukset\s*\((\d+)\)/;

// Hold status labels (Finnish → normalized)
const STATUS_MAP: Record<string, string> = {
  "Noudettavissa": "available",
  "Kuljetuksessa": "in_transit",
  "Jonossa": "waiting",
  "Odottaa": "waiting",
};

// Date pattern: "23.5.2024"
const FINNISH_DATE = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;

function parseFinnishDate(text: string): Date | undefined {
  const m = FINNISH_DATE.exec(text);
  if (!m) return undefined;
  const [, day, month, year] = m.map(Number);
  return new Date(year, month - 1, day);
}

export async function fetchHolds(
  session: FinnaSession,
): Promise<Hold[]> {
  const holdsUrl = `${session.baseUrl}/MyResearch/Holds`;
  const resp = await fetchWithRetry(holdsUrl, {
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
  return extractHolds(html, session.baseUrl);
}

export function extractHolds(html: string, baseUrl: string): Hold[] {
  const $ = cheerio.load(html);

  // Quick check: if heading says "Varaukset (0)", return early
  const heading = $("h2").text();
  const countMatch = HOLDS_COUNT.exec(heading);
  if (countMatch && countMatch[1] === "0") return [];

  const holds: Hold[] = [];

  // Finna holds use tr.myresearch-row (same as CheckedOut)
  $("tr.myresearch-row").each((_, row) => {
    const $row = $(row);
    const title = $row.find("h3.record-title").text().trim();
    if (!title) return;

    const statusText = $row.find(".status-column").text();

    // Pickup location — typically in a strong tag or labeled field
    const pickupLocation =
      $row.find(".status-column strong").first().text().trim() || undefined;

    // Status — look for known Finnish status labels
    let status: string | undefined;
    for (const [fi, en] of Object.entries(STATUS_MAP)) {
      if (statusText.includes(fi)) {
        status = en;
        break;
      }
    }

    // Queue position — "Varauksesi on sijalla 2" or similar
    const posMatch = /sijalla\s+(\d+)/i.exec(statusText);
    const position = posMatch ? Number(posMatch[1]) : undefined;

    // Expiration date — "Viimeinen noutopäivä: 1.6.2025"
    const expMatch = /(?:Viimeinen noutopäivä|Noutoaika päättyy|Voimassa).*?(\d{1,2}\.\d{1,2}\.\d{4})/i.exec(statusText);
    const expirationDate = expMatch ? parseFinnishDate(expMatch[0]) : undefined;

    // Created date — "Varauspvm: 1.5.2025"
    const createdMatch = /(?:Varauspvm|Varattu).*?(\d{1,2}\.\d{1,2}\.\d{4})/i.exec(statusText);
    const createdDate = createdMatch ? parseFinnishDate(createdMatch[0]) : undefined;

    // Record URL from the title link
    const titleHref = $row.find("h3.record-title a").attr("href");
    const recordUrl = titleHref
      ? titleHref.startsWith("http") ? titleHref : `${baseUrl}${titleHref}`
      : undefined;

    holds.push({
      title,
      pickupLocation,
      status,
      position,
      expirationDate,
      createdDate,
      recordUrl,
    });
  });

  return holds;
}
