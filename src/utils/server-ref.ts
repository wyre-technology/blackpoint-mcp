import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { getRequestContext } from './request-context.js';

// Per-request MCP `Server` handle for elicitation callbacks.
//
// In HTTP/gateway mode the server is attached to the request's
// AsyncLocalStorage context (set inside `requestContext.run()` before
// `server.connect(transport)`), so concurrent requests can never read
// each other's server. In stdio mode there is no per-request context,
// so we fall back to a module-level reference (single-tenant by design).
let stdioServerRef: Server | null = null;

export function setServerRef(server: Server): void {
  const ctx = getRequestContext();
  if (ctx) {
    ctx.server = server;
    return;
  }
  stdioServerRef = server;
}

export function getServerRef(): Server | null {
  const ctx = getRequestContext();
  if (ctx) {
    return ctx.server;
  }
  return stdioServerRef;
}
