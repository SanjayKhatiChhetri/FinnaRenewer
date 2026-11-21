// When FINNA_RELAY_URL is set (on Vercel), Finna requests go through the homelab relay,
// because Finna's Cloudflare blocks datacenter IPs (ADR-012). Unset means direct fetch.

export interface RelayRequest {
  url: string;
  method: string;
  headers: [string, string][];
  body?: string;
  redirect: RequestRedirect;
}

export interface RelayResponse {
  status: number;
  url: string;
  headers: [string, string][];
  setCookies: string[];
  body: string;
}

export async function finnaHttp(
  url: string,
  init: {
    method?: string;
    headers: Headers;
    body?: string;
    redirect: RequestRedirect;
  },
): Promise<Response> {
  const relayUrl = process.env.FINNA_RELAY_URL;
  if (!relayUrl) return fetch(url, init);

  const request: RelayRequest = {
    url,
    method: init.method ?? "GET",
    headers: [...init.headers],
    body: init.body,
    redirect: init.redirect,
  };

  const resp = await fetch(`${relayUrl}/fetch`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.FINNA_RELAY_SECRET}`,
    },
    body: JSON.stringify(request),
  });

  if (!resp.ok) {
    const { error } = (await resp.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(`Finna relay ${resp.status}: ${error ?? "unknown error"}`);
  }

  const relayed = (await resp.json()) as RelayResponse;
  const headers = new Headers(relayed.headers);
  for (const cookie of relayed.setCookies) headers.append("set-cookie", cookie);

  const response = new Response(relayed.body, {
    status: relayed.status,
    headers,
  });
  // Callers detect session expiry from the post-redirect URL, which a constructed Response lacks.
  Object.defineProperty(response, "url", { value: relayed.url });
  return response;
}
