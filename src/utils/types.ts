import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

// Re-export the SDK types domain handlers consume — `import type` alone keeps
// them module-local and forced every consumer to re-import from the SDK.
export type { CallToolResult, Tool };

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

export interface NavigationState {
  currentDomain: NavigationDomain | null;
  availableDomains: string[];
}