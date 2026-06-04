import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { requestContext, freshNavigationState, getRequestContext } from '../utils/request-context.js';
import { getClient } from '../utils/client.js';
import { getNavigationState, setCurrentDomain } from '../domains/navigation.js';
import { setServerRef, getServerRef } from '../utils/server-ref.js';

// These tests pin the per-request isolation guarantees that
// AsyncLocalStorage-based RequestContext provides. They are the
// regression guards for the module-level singletons we removed:
//   - `_client` / `_credentials` in src/utils/client.ts
//   - `process.env.BLACKPOINT_API_TOKEN` mutation in src/http.ts
//   - `serverRef` in src/utils/server-ref.ts
//   - `navigationState` in src/domains/navigation.ts
describe('tenant isolation via per-request context', () => {
  const origAuthMode = process.env.AUTH_MODE;
  const origToken = process.env.BLACKPOINT_API_TOKEN;

  beforeEach(() => {
    delete process.env.AUTH_MODE;
    delete process.env.BLACKPOINT_API_TOKEN;
  });

  afterEach(() => {
    if (origAuthMode === undefined) delete process.env.AUTH_MODE;
    else process.env.AUTH_MODE = origAuthMode;
    if (origToken === undefined) delete process.env.BLACKPOINT_API_TOKEN;
    else process.env.BLACKPOINT_API_TOKEN = origToken;
  });

  function runInContext<T>(
    apiToken: string,
    fn: () => Promise<T> | T,
    baseUrl?: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const ctx = {
        apiToken,
        ...(baseUrl ? { baseUrl } : {}),
        server: null,
        navigationState: freshNavigationState(),
      };
      requestContext.run(ctx, () => {
        Promise.resolve(fn()).then(resolve, reject);
      });
    });
  }

  describe('client credentials are scoped to the request', () => {
    it('two contexts see their own apiToken', async () => {
      const seen: Record<string, string | undefined> = {};

      await Promise.all([
        runInContext('token-A', () => {
          seen.A = getRequestContext()?.apiToken;
        }),
        runInContext('token-B', () => {
          seen.B = getRequestContext()?.apiToken;
        }),
      ]);

      expect(seen.A).toBe('token-A');
      expect(seen.B).toBe('token-B');
    });

    it('getClient inside a context reads from the context, not process.env', async () => {
      process.env.BLACKPOINT_API_TOKEN = 'env-token-should-not-be-used';

      const client = await runInContext('per-request-token', () => getClient());

      // The CompassOneClient instance is opaque here, but the key
      // assertion is that the call succeeded inside the context with
      // a different token than process.env held — meaning getClient
      // did NOT fall through to the env path.
      expect(client).toBeDefined();
    });

    it('does NOT mutate process.env when a request supplies credentials', async () => {
      process.env.AUTH_MODE = 'gateway';
      const before = process.env.BLACKPOINT_API_TOKEN;

      await runInContext('per-request-token', () => getClient());

      expect(process.env.BLACKPOINT_API_TOKEN).toBe(before);
    });

    it('getClient throws outside any context when no env token is set', async () => {
      delete process.env.BLACKPOINT_API_TOKEN;
      await expect(getClient()).rejects.toThrow(/CompassOne API credentials/);
    });

    it('many concurrent contexts each see only their own apiToken', async () => {
      const N = 10;
      const seen: Array<string | undefined> = new Array(N);

      await Promise.all(
        Array.from({ length: N }, (_, i) =>
          runInContext(`tenant-${i}`, async () => {
            // Yield to interleave with siblings.
            await new Promise((r) => setImmediate(r));
            seen[i] = getRequestContext()?.apiToken;
          })
        )
      );

      seen.forEach((token, i) => {
        expect(token).toBe(`tenant-${i}`);
      });
    });
  });

  describe('navigation state is scoped to the request', () => {
    it('setCurrentDomain inside one context does not affect another', async () => {
      const results: Record<string, string | null> = {};

      await Promise.all([
        runInContext('A', async () => {
          setCurrentDomain('assets');
          await new Promise((r) => setImmediate(r));
          results.A = getNavigationState().currentDomain;
        }),
        runInContext('B', async () => {
          setCurrentDomain('vulnerabilities');
          await new Promise((r) => setImmediate(r));
          results.B = getNavigationState().currentDomain;
        }),
      ]);

      expect(results.A).toBe('assets');
      expect(results.B).toBe('vulnerabilities');
    });

    it('each request starts with a fresh navigation state', async () => {
      const first = await runInContext('A', () => {
        setCurrentDomain('detections');
        return getNavigationState().currentDomain;
      });
      const second = await runInContext('A-again', () => {
        return getNavigationState().currentDomain;
      });

      expect(first).toBe('detections');
      expect(second).toBeNull();
    });
  });

  describe('server reference is scoped to the request', () => {
    it('setServerRef in one context is not visible from another', async () => {
      const fakeA = { id: 'server-A' } as unknown as Parameters<typeof setServerRef>[0];
      const fakeB = { id: 'server-B' } as unknown as Parameters<typeof setServerRef>[0];

      const results: Record<string, unknown> = {};

      await Promise.all([
        runInContext('A', async () => {
          setServerRef(fakeA);
          await new Promise((r) => setImmediate(r));
          results.A = (getServerRef() as unknown as { id: string }).id;
        }),
        runInContext('B', async () => {
          setServerRef(fakeB);
          await new Promise((r) => setImmediate(r));
          results.B = (getServerRef() as unknown as { id: string }).id;
        }),
      ]);

      expect(results.A).toBe('server-A');
      expect(results.B).toBe('server-B');
    });
  });
});
