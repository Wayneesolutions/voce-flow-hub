import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Forward /api/* and /uploads/* to the Express backend.
// vite.server.proxy only covers Vite's asset/HMR layer — the Nitro server
// that handles real requests needs its own proxy logic.
const API_TARGET =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ??
  (typeof process !== "undefined" ? process.env?.VITE_API_BASE_URL : undefined) ??
  "http://localhost:3001";

async function proxyToBackend(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = API_TARGET.replace(/\/$/, "");
  const targetUrl = `${target}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const init: RequestInit = { method: request.method, headers, redirect: "follow" };

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Read body into a buffer so it can be forwarded without stream-duplex issues
    init.body = await request.arrayBuffer();
  }

  try {
    return await fetch(targetUrl, init);
  } catch (err) {
    console.error("[api proxy]", err);
    return new Response(JSON.stringify({ error: "Backend unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const { pathname } = new URL(request.url);

    // Proxy backend paths before TanStack Start handles them
    if (pathname.startsWith("/api/") || pathname.startsWith("/uploads/")) {
      return proxyToBackend(request);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
