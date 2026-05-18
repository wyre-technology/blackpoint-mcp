import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './server.js';
import { logger } from './utils/logger.js';
import { resetClient } from './utils/client.js';

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

  // Handle gateway mode credentials
  if (process.env.AUTH_MODE === 'gateway') {
    const apiToken = req.headers.get('x-blackpoint-api-token');
    if (apiToken) {
      resetClient();
      process.env.BLACKPOINT_API_TOKEN = apiToken;
    }
  }

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
}