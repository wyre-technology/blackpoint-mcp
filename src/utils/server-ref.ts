import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

let serverRef: Server | null = null;

export function setServerRef(server: Server): void {
  serverRef = server;
}

export function getServerRef(): Server | null {
  return serverRef;
}