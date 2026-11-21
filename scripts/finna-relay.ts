// Runs on the homelab. Vercel forwards Finna requests here because Finna's Cloudflare
// blocks datacenter IPs (ADR-012). Only https://*.finna.fi targets are allowed.
import { createServer, type IncomingMessage } from "node:http";
import { timingSafeEqual } from "node:crypto";
import type { RelayRequest, RelayResponse } from "@/server/finna/relay";

const PORT = Number(process.env.PORT ?? 8787);
const MAX_REQUEST_BYTES = 1_000_000;
const DROPPED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "set-cookie",
]);

const secret = process.env.FINNA_RELAY_SECRET;
if (!secret || secret.length < 32) {
  console.error("FINNA_RELAY_SECRET must be set (32+ chars)");
  process.exit(1);
}
const expectedAuth = Buffer.from(`Bearer ${secret}`);

function isAuthorized(req: IncomingMessage) {
  const given = Buffer.from(req.headers.authorization ?? "");
  return (
    given.length === expectedAuth.length && timingSafeEqual(given, expectedAuth)
  );
}

function isAllowedTarget(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname.endsWith(".finna.fi");
  } catch {
    return false;
  }
}

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_REQUEST_BYTES) throw new Error("Request too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function relay(request: RelayRequest): Promise<RelayResponse> {
  const resp = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: request.redirect,
  });

  return {
    status: resp.status,
    url: resp.url,
    headers: [...resp.headers].filter(
      ([name]) => !DROPPED_RESPONSE_HEADERS.has(name),
    ),
    setCookies: resp.headers.getSetCookie(),
    body: await resp.text(),
  };
}

const server = createServer(async (req, res) => {
  const reply = (status: number, payload: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  if (req.method === "GET" && req.url === "/health")
    return reply(200, { ok: true });
  if (req.method !== "POST" || req.url !== "/fetch")
    return reply(404, { error: "Not found" });
  if (!isAuthorized(req)) return reply(401, { error: "Unauthorized" });

  try {
    const request = JSON.parse(await readBody(req)) as RelayRequest;
    if (!isAllowedTarget(request.url))
      return reply(400, { error: "Target not allowed" });
    reply(200, await relay(request));
  } catch (err) {
    reply(502, { error: err instanceof Error ? err.message : "Relay failed" });
  }
});

server.listen(PORT, () => console.log(`finna-relay listening on :${PORT}`));
