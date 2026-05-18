import type { FinnaSession } from "./types";

const FINNA_BASE_URL = "https://oula.finna.fi";
const LOGIN_PAGE_URL = `${FINNA_BASE_URL}/MyResearch/Login?auth_method=Database`;
const LOGIN_POST_URL = `${FINNA_BASE_URL}/MyResearch/Home`;

export { FINNA_BASE_URL };

const BASE_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: FINNA_BASE_URL,
};

const BACKOFF_MS = [500, 1000, 2000, 4000];

function extractCookiesFromHeaders(headers: Headers): string {
  const setCookies = headers.getSetCookie?.() ?? [];
  return setCookies
    .map((sc) => sc.split(";")[0])
    .join("; ");
}

function mergeCookies(existing: string, fresh: string): string {
  const map = new Map<string, string>();

  for (const raw of [existing, fresh]) {
    for (const pair of raw.split(";")) {
      const trimmed = pair.trim();
      if (!trimmed) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      map.set(trimmed.slice(0, eqIdx).trim(), trimmed.slice(eqIdx + 1).trim());
    }
  }

  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit & { cookies?: string } = {},
  maxAttempts = 4
): Promise<Response> {
  const headers = new Headers(BASE_HEADERS);
  if (init.cookies) {
    headers.set("Cookie", init.cookies);
  }
  if (init.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((v, k) => headers.set(k, v));
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const resp = await fetch(url, {
        ...init,
        headers,
        redirect: "follow",
      });

      if (resp.status === 403 || resp.status === 503 || resp.status >= 500) {
        lastError = new Error(`HTTP ${resp.status}`);
        await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt] ?? 4000));
        continue;
      }

      return resp;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt] ?? 4000));
    }
  }

  throw new Error(`Request failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

export async function finnaLogin(
  username: string,
  password: string,
  existingCookie?: string
): Promise<FinnaSession> {
  const seedCookies = existingCookie ?? "";

  const loginPageResp = await fetchWithRetry(LOGIN_PAGE_URL, {
    cookies: seedCookies,
  });

  const loginHtml = await loginPageResp.text();
  const pageCookies = extractCookiesFromHeaders(loginPageResp.headers);
  const allCookies = mergeCookies(seedCookies, pageCookies);

  const csrfMatch = loginHtml.match(
    /name="loginForm"[\s\S]*?name="csrf"\s+value="([^"]+)"/
  );
  if (!csrfMatch) {
    throw new Error("CSRF not found in login form");
  }

  const formBody = new URLSearchParams({
    username,
    password,
    remember_me: "on",
    auth_method: "Database",
    csrf: csrfMatch[1],
    processLogin: "Log in",
  });

  const loginResp = await fetchWithRetry(LOGIN_POST_URL, {
    method: "POST",
    cookies: allCookies,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: LOGIN_PAGE_URL,
    },
    body: formBody.toString(),
  });

  const postCookies = extractCookiesFromHeaders(loginResp.headers);
  const sessionCookies = mergeCookies(allCookies, postCookies);

  const finalUrl = loginResp.url;
  if (finalUrl.includes("/MyResearch/Login")) {
    throw new Error("Login failed — check credentials");
  }

  await loginResp.text();

  return { cookies: sessionCookies };
}
