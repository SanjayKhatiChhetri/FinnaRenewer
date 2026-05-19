import * as cheerio from "cheerio";
import type { FinnaSession, FinnaInstanceId } from "./types";
import { getFinnaInstance, DEFAULT_INSTANCE } from "./instances";

const BASE_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
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
        redirect: init.redirect ?? "follow",
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
  instanceId: FinnaInstanceId = DEFAULT_INSTANCE,
): Promise<FinnaSession> {
  const { baseUrl } = getFinnaInstance(instanceId);
  const loginPageUrl = `${baseUrl}/MyResearch/Login`;
  const loginPostUrl = `${baseUrl}/MyResearch/Home`;

  // Step 1: Load login page to get CSRF token, auth_method, and other hidden fields
  const loginPageResp = await fetchWithRetry(loginPageUrl);
  const loginHtml = await loginPageResp.text();
  const pageCookies = extractCookiesFromHeaders(loginPageResp.headers);

  // Step 2: Parse the login form dynamically — different Finna instances use
  // different auth methods (Database, MultiILS) and hidden fields (target, etc.)
  const $ = cheerio.load(loginHtml);
  const hiddenFields: Record<string, string> = {};
  $('form[name="loginForm"] input[type="hidden"]').each((_, el) => {
    const name = $(el).attr("name");
    const value = $(el).attr("value");
    if (name && value) hiddenFields[name] = value;
  });

  if (!hiddenFields.csrf) {
    throw new Error("CSRF not found in login form");
  }

  // Step 3: POST credentials with redirect:"manual" to capture the session
  // cookie from the 302 response. Node.js fetch with redirect:"follow" loses
  // Set-Cookie headers from intermediate redirects — unlike Go's http.Client
  // with a cookie jar, which preserves them automatically.
  const formBody = new URLSearchParams({
    ...hiddenFields,
    username,
    password,
    remember_me: "on",
    processLogin: "Log in",
  });

  const loginResp = await fetchWithRetry(loginPostUrl, {
    method: "POST",
    cookies: pageCookies,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: loginPageUrl,
      Origin: baseUrl,
    },
    body: formBody.toString(),
    redirect: "manual",
  });

  const postCookies = extractCookiesFromHeaders(loginResp.headers);
  const sessionCookies = mergeCookies(pageCookies, postCookies);

  // With redirect:"manual", check the Location header for login failure
  // (Finna redirects back to login page on bad credentials)
  const location = loginResp.headers.get("Location") ?? "";
  if (loginResp.status >= 300 && loginResp.status < 400) {
    if (location.includes("/MyResearch/Login")) {
      throw new Error("Login failed — check credentials");
    }
  } else {
    // Non-redirect (200) means Finna re-rendered the login form (failure)
    throw new Error("Login failed — check credentials");
  }

  return { cookies: sessionCookies, baseUrl };
}
