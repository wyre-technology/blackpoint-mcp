import { AsyncLocalStorage } from 'node:async_hooks';
import { CompassOneClient, CompassOneConfig } from '@wyre-technology/node-blackpoint';

/**
 * Request-scoped credentials.
 *
 * In gateway mode the HTTP layer runs each request inside
 * runWithCredentials(...), so concurrent requests from different tenants never
 * share credential state. In stdio / single-tenant mode there is no scope and
 * getCredentials() falls back to the process environment.
 */
const credStore = new AsyncLocalStorage<CompassOneConfig>();

export function runWithCredentials<T>(creds: CompassOneConfig, fn: () => T): T {
  return credStore.run(creds, fn);
}

/** Resolve credentials from the request scope, falling back to env vars. */
function getCredentials(): CompassOneConfig | null {
  const scoped = credStore.getStore();
  if (scoped?.apiToken) return scoped;

  const apiToken = process.env.BLACKPOINT_API_TOKEN;
  if (!apiToken) return null;

  return {
    apiToken,
    baseUrl: process.env.BLACKPOINT_BASE_URL || undefined,
  };
}

/**
 * Build a CompassOne client from the credentials in scope.
 *
 * A fresh client is constructed on every call and never cached in a
 * module-level variable. A shared singleton keyed off mutable global state is
 * exactly how one tenant's request can end up using another tenant's token
 * under concurrency, so credentials stay request-scoped end to end.
 */
export async function getClient(): Promise<CompassOneClient> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error('No CompassOne API credentials configured. Set BLACKPOINT_API_TOKEN environment variable.');
  }
  return new CompassOneClient(creds);
}
