import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult, NavigationState, NavigationDomain } from '../utils/types.js';
import { logger } from '../utils/logger.js';

// Global navigation state
let navigationState: NavigationState = {
  currentDomain: null,
  availableDomains: [
    'partners',
    'tenants',
    'assets',
    'detections',
    'cloud_security',
    'vulnerabilities',
    'threat_intel',
    'notifications',
  ],
};

export function getNavigationState(): NavigationState {
  return { ...navigationState };
}

export function setCurrentDomain(domain: NavigationDomain | null): void {
  navigationState.currentDomain = domain;
  logger.info('Navigation state changed', { currentDomain: domain });
}

function getTools(): Tool[] {
  const tools: Tool[] = [
    {
      name: 'blackpoint_navigate',
      description: 'Navigate to a specific CompassOne domain to access its tools',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            enum: navigationState.availableDomains,
            description: 'Domain to navigate to',
          },
        },
        required: ['domain'],
      },
    },
    {
      name: 'blackpoint_status',
      description: 'Show current navigation state and available domains',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  // Add back tool if we're in a domain
  if (navigationState.currentDomain) {
    tools.push({
      name: 'blackpoint_back',
      description: 'Return to the main navigation menu',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });
  }

  return tools;
}

async function handleCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  switch (toolName) {
    case 'blackpoint_navigate': {
      const domain = args.domain as NavigationDomain;
      if (!navigationState.availableDomains.includes(domain)) {
        return {
          content: [
            {
              type: 'text',
              text: `Invalid domain "${domain}". Available domains: ${navigationState.availableDomains.join(', ')}`,
            },
          ],
          isError: true,
        };
      }

      setCurrentDomain(domain);
      return {
        content: [
          {
            type: 'text',
            text: `Navigated to ${domain} domain. Use tools/list to see available operations, or blackpoint_back to return to navigation.`,
          },
        ],
      };
    }

    case 'blackpoint_status': {
      const domainDescriptions: Record<NavigationDomain, string> = {
        partners: 'Partner accounts and management',
        tenants: 'Customer tenants and configuration',
        assets: 'Endpoint and server inventory',
        alerts: 'Security alerts and alert groups (placeholder - API not yet available)',
        detections: 'Security detections and telemetry',
        tickets: 'Incident tickets and workflow (placeholder - API not yet available)',
        cloud_security: 'Cloud MDR (M365, Google, Cisco onboarding)',
        vulnerabilities: 'Vulnerability scans, dark web monitoring, external exposure',
        threat_intel: 'Threat intelligence and indicators',
        notifications: 'Contact groups and notification channels',
      };

      const statusText = [
        `Current domain: ${navigationState.currentDomain || 'Navigation menu'}`,
        '',
        'Available domains:',
        ...navigationState.availableDomains.map(domain =>
          `• ${domain}: ${domainDescriptions[domain as NavigationDomain] || 'Unknown domain'}`
        ),
        '',
        'Use blackpoint_navigate to enter a domain, or blackpoint_back to return to navigation.',
      ].join('\n');

      return {
        content: [
          {
            type: 'text',
            text: statusText,
          },
        ],
      };
    }

    case 'blackpoint_back': {
      setCurrentDomain(null);
      return {
        content: [
          {
            type: 'text',
            text: 'Returned to navigation menu. Use blackpoint_status to see available domains.',
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: 'text',
            text: `Unknown navigation tool: ${toolName}`,
          },
        ],
        isError: true,
      };
  }
}

export const navigationHandler: DomainHandler = { getTools, handleCall };