import { Readable } from 'node:stream';
import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { createWebRequest } from '../http-request.js';

function makeIncomingMessage(method: string): IncomingMessage {
  const req = Readable.from(['{"jsonrpc":"2.0","id":1,"method":"tools/list"}']) as IncomingMessage;
  req.method = method;
  req.url = '/mcp';
  req.headers = {
    'content-type': 'application/json',
    host: 'blackpoint-mcp',
  };

  return req;
}

describe('createWebRequest', () => {
  it('sets duplex for streamed POST bodies', async () => {
    const request = createWebRequest(makeIncomingMessage('POST'));

    expect(request.method).toBe('POST');
    expect(request.url).toBe('http://blackpoint-mcp/mcp');
    await expect(request.text()).resolves.toContain('tools/list');
  });

  it('does not attach a body for health-check GET requests', async () => {
    const request = createWebRequest(makeIncomingMessage('GET'));

    expect(request.method).toBe('GET');
    expect(request.body).toBeNull();
  });
});
