import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import type { IncomingMessage } from 'http';
import { toWebRequest } from '../http-request.js';

function makeIncoming(opts: {
  method: string;
  url?: string;
  host?: string;
  body?: Readable;
  headers?: Record<string, string>;
}): IncomingMessage {
  const stream = opts.body ?? Readable.from([]);
  const req = stream as unknown as IncomingMessage;
  req.method = opts.method;
  req.url = opts.url ?? '/mcp';
  req.headers = {
    host: opts.host ?? 'localhost:8080',
    'content-type': 'application/json',
    ...(opts.headers ?? {}),
  };
  return req;
}

describe('toWebRequest', () => {
  it('builds a Web Request from a POST with a streamed JSON body without throwing', async () => {
    const body = Readable.from(['{"foo":1}']);
    const incoming = makeIncoming({ method: 'POST', body });

    // Without duplex: 'half' Node throws:
    //   TypeError: RequestInit: duplex option is required when sending a body.
    const request = toWebRequest(incoming);

    expect(request.method).toBe('POST');
    expect(request.url).toBe('http://localhost:8080/mcp');

    const text = await request.text();
    expect(JSON.parse(text)).toEqual({ foo: 1 });
  });

  it('does not attach a body for GET requests', () => {
    const incoming = makeIncoming({ method: 'GET' });
    const request = toWebRequest(incoming);
    expect(request.method).toBe('GET');
    expect(request.body).toBeNull();
  });

  it('does not attach a body for HEAD requests', () => {
    const incoming = makeIncoming({ method: 'HEAD' });
    const request = toWebRequest(incoming);
    expect(request.method).toBe('HEAD');
    expect(request.body).toBeNull();
  });

  it('preserves headers from the IncomingMessage', () => {
    const incoming = makeIncoming({
      method: 'POST',
      body: Readable.from(['{}']),
      headers: { authorization: 'Bearer abc' },
    });
    const request = toWebRequest(incoming);
    expect(request.headers.get('authorization')).toBe('Bearer abc');
    expect(request.headers.get('content-type')).toBe('application/json');
  });
});
