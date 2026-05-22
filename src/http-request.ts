import type { IncomingMessage } from 'node:http';

type RequestInitWithDuplex = RequestInit & { duplex?: 'half' };

export function createWebRequest(req: IncomingMessage): Request {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const init: RequestInitWithDuplex = {
    method: req.method,
    headers: req.headers as HeadersInit,
  };

  if (hasBody) {
    init.body = req as unknown as BodyInit;
    init.duplex = 'half';
  }

  return new Request(url.toString(), init);
}
