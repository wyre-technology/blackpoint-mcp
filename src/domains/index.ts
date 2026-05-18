import type { DomainHandler, NavigationDomain } from '../utils/types.js';
import { navigationHandler, getNavigationState } from './navigation.js';
import { assetsHandler } from './assets.js';
import { tenantsHandler } from './tenants.js';
import { detectionsHandler } from './detections.js';
import { vulnerabilitiesHandler } from './vulnerabilities.js';

// Domain registry with lazy loading
const domainHandlers: Record<NavigationDomain, () => DomainHandler> = {
  partners: () => ({
    getTools: () => [
      {
        name: 'blackpoint_partners_placeholder',
        description: 'Partner management - Not yet implemented (Accounts resource available in SDK)',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
    handleCall: async () => ({
      content: [{ type: 'text', text: 'Partner management not yet implemented in MCP server' }],
      isError: true,
    }),
  }),

  tenants: () => tenantsHandler,

  assets: () => assetsHandler,

  alerts: () => ({
    getTools: () => [
      {
        name: 'blackpoint_alerts_placeholder',
        description: 'Security alerts management - Not yet implemented (Alert models exist but no API handlers)',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
    handleCall: async () => ({
      content: [{ type: 'text', text: 'Alert management not yet implemented - API handlers not available in CompassOne Rust wrapper' }],
      isError: true,
    }),
  }),

  detections: () => detectionsHandler,

  tickets: () => ({
    getTools: () => [
      {
        name: 'blackpoint_tickets_placeholder',
        description: 'Incident tickets management - Not yet implemented (Ticket models exist but no API handlers)',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
    handleCall: async () => ({
      content: [{ type: 'text', text: 'Ticket management not yet implemented - API handlers not available in CompassOne Rust wrapper' }],
      isError: true,
    }),
  }),

  cloud_security: () => ({
    getTools: () => [
      {
        name: 'blackpoint_cloud_security_placeholder',
        description: 'Cloud security (M365/Google/Cisco) - Implemented in SDK but not yet exposed in MCP server',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
    handleCall: async () => ({
      content: [{ type: 'text', text: 'Cloud security domain available in SDK but not yet implemented in MCP server' }],
      isError: true,
    }),
  }),

  vulnerabilities: () => vulnerabilitiesHandler,

  threat_intel: () => ({
    getTools: () => [
      {
        name: 'blackpoint_threat_intel_placeholder',
        description: 'Threat intelligence - Available as part of vulnerabilities (dark web monitoring)',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
    handleCall: async () => ({
      content: [{ type: 'text', text: 'Threat intelligence is available via blackpoint_vulnerabilities_darkweb_list in the vulnerabilities domain' }],
    }),
  }),

  notifications: () => ({
    getTools: () => [
      {
        name: 'blackpoint_notifications_placeholder',
        description: 'Notification channels and contact groups - Implemented in SDK but not yet exposed in MCP server',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
    handleCall: async () => ({
      content: [{ type: 'text', text: 'Notifications domain available in SDK but not yet implemented in MCP server' }],
    }),
  }),
};

export function getDomainHandler(domain: NavigationDomain | null): DomainHandler | null {
  if (!domain) return null;
  return domainHandlers[domain]?.() || null;
}

export function getCurrentDomainHandler(): DomainHandler {
  const state = getNavigationState();
  if (!state.currentDomain) {
    return navigationHandler;
  }

  const domainHandler = getDomainHandler(state.currentDomain);
  return domainHandler || navigationHandler;
}