import { AsyncLocalStorage } from 'node:async_hooks';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { NavigationDomain, NavigationState } from './types.js';

// Per-request mutable state for HTTP/gateway mode, scoped via
// AsyncLocalStorage so every request's handler chain runs inside its
// own `run()` block. Concurrent requests cannot see each other's store.
//
// Replaces four module-level singletons whose lifetimes outlived a
// single request:
//   - `_client` / `_credentials` in src/utils/client.ts
//   - `process.env.BLACKPOINT_API_TOKEN` mutation in src/http.ts
//   - `serverRef` in src/utils/server-ref.ts
//   - `navigationState` in src/domains/navigation.ts
//
// Stdio mode does not run inside `requestContext.run()` — module-level
// fallbacks remain valid there because stdio is single-tenant by design.

export interface RequestContext {
  apiToken: string;
  baseUrl?: string;
  server: Server | null;
  navigationState: NavigationState;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

const DEFAULT_AVAILABLE_DOMAINS: NavigationDomain[] = [
  'partners',
  'tenants',
  'assets',
  'detections',
  'cloud_security',
  'vulnerabilities',
  'threat_intel',
  'notifications',
];

export function freshNavigationState(): NavigationState {
  return {
    currentDomain: null,
    availableDomains: [...DEFAULT_AVAILABLE_DOMAINS],
  };
}
