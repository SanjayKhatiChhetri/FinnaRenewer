import * as cheerio from "cheerio";
import type { FinnaSession, FinnaInstance, FinnaInstanceId } from "./types";
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
  return setCookies.map((sc) => sc.split(";")[0]).join("; ");
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
  maxAttempts = 4,
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

  throw new Error(
    `Request failed after ${maxAttempts} attempts: ${lastError?.message}`,
  );
}

export async function finnaLogin(
  username: string,
  password: string,
  instanceId: FinnaInstanceId = DEFAULT_INSTANCE,
): Promise<FinnaSession> {
  const instance = getFinnaInstance(instanceId);
  const { baseUrl, authMethod } = instance;

  // Append ?auth_method= to pre-select the correct login tab — matches the
  // pattern from the working Go implementation and avoids multi-form ambiguity
  const loginPageUrl = `${baseUrl}/MyResearch/Login?auth_method=${authMethod}`;
  const loginPostUrl = `${baseUrl}/MyResearch/Home`;

  // Step 1: Load login page to get CSRF token and hidden fields
  const loginPageResp = await fetchWithRetry(loginPageUrl);
  const loginHtml = await loginPageResp.text();
  const pageCookies = extractCookiesFromHeaders(loginPageResp.headers);

  // Step 2: Find the form matching this instance's auth method. Some Finna pages
  // show multiple login tabs (Shibboleth, Database, MultiILS) as separate forms
  // all named "loginForm" — selecting by auth_method value is deterministic.
  const hiddenFields = extractFormFields(loginHtml, instance);

  if (!hiddenFields.csrf) {
    throw new Error("CSRF not found in login form");
  }

  // Step 3: POST credentials with redirect:"manual" to capture the session
  // cookie from the 302 response. Node.js fetch with redirect:"follow" loses
  // Set-Cookie headers from intermediate redirects.
  const formBody = new URLSearchParams({
    ...hiddenFields,
    username,
    password,
    remember_me: "on",
    auth_method: authMethod,
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

  // Finna login response varies by instance:
  //   - Some return 302 → /MyResearch/Home on success, 302 → /MyResearch/Login on failure
  //   - Some return 200 directly (home page rendered inline) on success
  // The reliable success signal is the loginToken cookie set on the POST response.
  if (loginResp.status >= 300 && loginResp.status < 400) {
    const location = loginResp.headers.get("Location") ?? "";
    if (isLoginRedirect(location)) {
      throw new Error("Login failed — check credentials");
    }
  } else if (loginResp.status === 200) {
    if (!postCookies.includes("loginToken")) {
      throw new Error("Login failed — check credentials");
    }
  } else {
    throw new Error("Login failed — check credentials");
  }

  return { cookies: sessionCookies, baseUrl };
}

function extractFormFields(
  html: string,
  instance: FinnaInstance,
): Record<string, string> {
  const $ = cheerio.load(html);

  // Find the specific form whose auth_method matches the instance config
  let targetForm = $('form[name="loginForm"]')
    .filter((_, form) => {
      return (
        $(form).find(
          `input[name="auth_method"][value="${instance.authMethod}"]`,
        ).length > 0
      );
    })
    .first();

  // Fall back to first loginForm (single-form pages)
  if (targetForm.length === 0) {
    targetForm = $('form[name="loginForm"]').first();
  }

  const fields: Record<string, string> = {};
  // Include submit buttons so processLogin is captured in the page's language
  targetForm
    .find('input[type="hidden"], input[type="submit"]')
    .each((_, el) => {
      const name = $(el).attr("name");
      const value = $(el).attr("value");
      if (name && value) fields[name] = value;
    });

  return fields;
}

function isLoginRedirect(location: string): boolean {
  return (
    location.includes("/MyResearch/Login") ||
    location.includes("/MyResearch/UserLogin")
  );
}
