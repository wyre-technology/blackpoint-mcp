import type { IncomingMessage } from 'http';

/**
 * Convert a Node `IncomingMessage` into a Web `Request`.
 *
 * Node's Web `Request` constructor throws when a streamed body is provided
 * without `duplex: 'half'`:
 *
 *   TypeError: RequestInit: duplex option is required when sending a body.
 *
 * We pass the `IncomingMessage` directly as the body for methods that may
 * carry one (anything other than GET/HEAD), and set `duplex: 'half'` so the
 * Web `Request` constructor accepts the readable stream.
 */
export function toWebRequest(req: IncomingMessage): Request {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers: req.headers as Record<string, string>,
  };

  if (hasBody) {
    init.body = req as unknown as RequestInit['body'];
    init.duplex = 'half';
  }

  return new Request(url.toString(), init);
}
