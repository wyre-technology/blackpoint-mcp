import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

export interface RequestHandlerExtra {
  requestId?: string;
  meta?: Record<string, unknown>;
}

export interface DomainHandler {
  getTools(): Tool[];
  handleCall(
    toolName: string,
    args: Record<string, unknown>,
    extra?: RequestHandlerExtra
  ): Promise<CallToolResult>;
}

export interface NavigationState {
  currentDomain: string | null;
  availableDomains: string[];
}

export type NavigationDomain =
  | 'partners'
  | 'tenants'
  | 'assets'
  | 'alerts'
  | 'detections'
  | 'tickets'
  | 'cloud_security'
  | 'vulnerabilities'
  | 'threat_intel'
  | 'notifications';