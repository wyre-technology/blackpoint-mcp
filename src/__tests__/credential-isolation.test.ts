/**
 * Per-request credential isolation.
 *
 * Blackpoint is a multi-tenant gateway target: each request carries a
 * different tenant's API token as a header. Credentials must therefore be
 * request-scoped. These tests pin two invariants:
 *
 *   1. The HTTP layer never writes the per-request token into process.env — a
 *      shared global that concurrent requests would overwrite, letting one
 *      tenant's request run under another tenant's token.
 *   2. Concurrent request scopes each build a client with their own token and
 *      base URL, with no cross-contamination.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Capture every CompassOneClient construction so a test can assert which token
// a client was built with. vi.hoisted keeps the array reachable from the
// hoisted vi.mock factory.
const { constructions } = vi.hoisted(() => ({
  constructions: [] as Array<{ apiToken: string; baseUrl?: string }>,
}));

vi.mock('@wyre-technology/node-blackpoint', () => ({
  CompassOneClient: class {
    apiToken: string;
    baseUrl?: string;
    constructor(config: { apiToken: string; baseUrl?: string }) {
      this.apiToken = config.apiToken;
      this.baseUrl = config.baseUrl;
      constructions.push({ apiToken: config.apiToken, baseUrl: config.baseUrl });
    }
  },
}));

import { getClient, runWithCredentials } from '../utils/client.js';
import { handleHttpRequest } from '../http.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('per-request credential isolation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    constructions.length = 0;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not write the tenant token into process.env in gateway mode', async () => {
    delete process.env.BLACKPOINT_API_TOKEN;
    process.env.AUTH_MODE = 'gateway';

    const req = new Request('http://localhost:8080/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'x-blackpoint-api-token': 'tenant-A-secret',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    });

    await handleHttpRequest(req);

    // Pre-fix, http.ts did `process.env.BLACKPOINT_API_TOKEN = apiToken`, which
    // is the cross-tenant leak. The token must never touch the global env.
    expect(process.env.BLACKPOINT_API_TOKEN).not.toBe('tenant-A-secret');
  });

  it('never lets one tenant see another tenant token under concurrency', async () => {
    const seen: Record<string, string | undefined> = {};

    await Promise.all([
      runWithCredentials({ apiToken: 'tenant-A-token', baseUrl: 'https://a.example/v1' }, async () => {
        await tick();
        seen.a1 = (await getClient() as unknown as { apiToken: string }).apiToken;
        await tick();
        seen.a2 = (await getClient() as unknown as { apiToken: string }).apiToken;
      }),
      runWithCredentials({ apiToken: 'tenant-B-token', baseUrl: 'https://b.example/v1' }, async () => {
        await tick();
        seen.b1 = (await getClient() as unknown as { apiToken: string }).apiToken;
      }),
    ]);

    expect(seen.a1).toBe('tenant-A-token');
    expect(seen.a2).toBe('tenant-A-token');
    expect(seen.b1).toBe('tenant-B-token');
  });

  it('threads the per-request base URL into the client', async () => {
    const client = (await runWithCredentials(
      { apiToken: 't', baseUrl: 'https://mail.example.com/spamtitan/v1' },
      () => getClient()
    )) as unknown as { baseUrl?: string };

    expect(client.baseUrl).toBe('https://mail.example.com/spamtitan/v1');
  });

  it('builds a distinct client per call rather than reusing a singleton', async () => {
    const a = await runWithCredentials({ apiToken: 'a' }, () => getClient());
    const b = await runWithCredentials({ apiToken: 'b' }, () => getClient());
    expect(a).not.toBe(b);
  });

  it('falls back to env credentials outside any request scope (stdio mode)', async () => {
    process.env.BLACKPOINT_API_TOKEN = 'env-token';
    process.env.BLACKPOINT_BASE_URL = 'https://env.example/v1';

    const client = (await getClient()) as unknown as { apiToken: string; baseUrl?: string };

    expect(client.apiToken).toBe('env-token');
    expect(client.baseUrl).toBe('https://env.example/v1');
  });

  it('throws when no credentials are in scope or env', async () => {
    delete process.env.BLACKPOINT_API_TOKEN;
    await expect(getClient()).rejects.toThrow(/No CompassOne API credentials/);
  });
});
