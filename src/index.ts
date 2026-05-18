#!/usr/bin/env node

import { logger } from './utils/logger.js';
import { runStdioServer } from './server.js';
import { handleHttpRequest } from './http.js';

const transport = process.env.MCP_TRANSPORT || 'stdio';
const port = parseInt(process.env.MCP_HTTP_PORT || '8080', 10);

async function main(): Promise<void> {
  try {
    if (transport === 'http') {
      const { createServer } = await import('http');

      logger.info('Starting HTTP server', { port });

      const server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url || '/', `http://${req.headers.host}`);
          const request = new Request(url.toString(), {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
          });

          const response = await handleHttpRequest(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });

          const body = await response.text();
          res.end(body);
        } catch (error) {
          logger.error('HTTP request handler error', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });

      server.listen(port, () => {
        logger.info('Blackpoint MCP server listening on HTTP', { port, url: `http://localhost:${port}` });
      });

      // Keep the server running
      await new Promise(() => {});
    } else {
      // Default to stdio transport
      await runStdioServer();
    }
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

main().catch((error) => {
  logger.error('Unhandled error in main', error);
  process.exit(1);
});