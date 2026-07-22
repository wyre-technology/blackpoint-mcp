import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './server.js';
import { logger } from './utils/logger.js';
import { runWithCredentials } from './utils/client.js';

export async function handleHttpRequest(req: Request): Promise<Response> {
  // Unauthenticated shallow health check for the Azure liveness probe.
  const { pathname } = new URL(req.url);
  if (pathname === '/health' || pathname === '/healthz') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // CRITICAL: Per-request server and transport for gateway mode
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // STATELESS
    enableJsonResponse: true,
  });

  const handle = async (): Promise<Response> => {
    try {
      await server.connect(transport);
      return await transport.handleRequest(req);
    } catch (error) {
      logger.error('MCP HTTP transport error', error);

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } finally {
      transport.close();
      server.close();
    }
  };

  // Gateway mode: credentials arrive per-request as headers and are scoped to
  // this request via AsyncLocalStorage. They are never written to process.env —
  // a shared global would let concurrent tenants overwrite each other's token.
  if (process.env.AUTH_MODE === 'gateway') {
    const apiToken = req.headers.get('x-blackpoint-api-token');
    if (apiToken) {
      const baseUrl = req.headers.get('x-blackpoint-base-url') ?? undefined;
      return runWithCredentials({ apiToken, baseUrl }, handle);
    }
  }

  return handle();
}
