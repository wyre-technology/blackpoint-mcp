import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult, RequestHandlerExtra } from '../utils/types.js';
import { getClient } from '../utils/client.js';
import { logger } from '../utils/logger.js';
import { elicitSelection, elicitText } from '../utils/elicitation.js';

function getTools(): Tool[] {
  return [
    {
      name: 'blackpoint_assets_list',
      description: 'List assets by class (endpoint, server, network, cloud, mobile, iot). Returns paginated results.',
      inputSchema: {
        type: 'object',
        properties: {
          class: {
            type: 'string',
            enum: ['endpoint', 'server', 'network', 'cloud', 'mobile', 'iot'],
            description: 'Asset class to filter by (required)',
          },
          tenantId: {
            type: 'string',
            description: 'Filter by specific tenant ID',
          },
          search: {
            type: 'string',
            description: 'Search assets by name or description',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'decommissioned'],
            description: 'Filter by asset status',
          },
          page: {
            type: 'number',
            description: 'Page number (default: 1)',
            minimum: 1,
          },
          pageSize: {
            type: 'number',
            description: 'Items per page (default: 50)',
            minimum: 1,
            maximum: 100,
          },
        },
        required: ['class'],
      },
    },
    {
      name: 'blackpoint_assets_get',
      description: 'Get detailed information about a specific asset',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Asset ID',
          },
        },
        required: ['id'],
      },
    },
    {
      name: 'blackpoint_assets_relationships',
      description: 'List relationships for an asset (parent/child/sibling connections)',
      inputSchema: {
        type: 'object',
        properties: {
          assetId: {
            type: 'string',
            description: 'Source asset ID',
          },
          class: {
            type: 'string',
            enum: ['endpoint', 'server', 'network', 'cloud', 'mobile', 'iot'],
            description: 'Related asset class',
          },
          direction: {
            type: 'string',
            enum: ['parent', 'child', 'sibling'],
            description: 'Relationship direction',
          },
        },
        required: ['assetId', 'class', 'direction'],
      },
    },
    {
      name: 'blackpoint_assets_search',
      description: 'Search assets across all classes with flexible filtering',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (asset name, description, etc.)',
          },
          classes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['endpoint', 'server', 'network', 'cloud', 'mobile', 'iot'],
            },
            description: 'Asset classes to search within',
          },
          tenantIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tenant IDs to search within',
          },
        },
        required: ['query'],
      },
    },
  ];
}

async function handleCall(
  toolName: string,
  args: Record<string, unknown>,
  extra?: RequestHandlerExtra
): Promise<CallToolResult> {
  const client = await getClient();

  switch (toolName) {
    case 'blackpoint_assets_list': {
      const assetClass = args.class as string;
      const params = {
        class: assetClass,
        search: args.search as string | undefined,
        page: args.page as number | undefined,
        pageSize: args.pageSize as number | undefined,
        tenantId: args.tenantId as string | undefined,
      } as const;

      try {
        const response = await client.assets.list(params);

        // Handle both raw array and wrapped object responses
        const items = Array.isArray(response) ? response : (response?.data ?? []);
        const pagination = Array.isArray(response) ? null : response?.pagination;

        const summary = [
          `Found ${items.length} ${assetClass} assets`,
          pagination ? `(Page ${pagination.page || 1} of ${Math.ceil((pagination.totalCount || 0) / (pagination.pageSize || 50))})` : '',
        ].filter(Boolean).join(' ');

        const resultText = [
          summary,
          '',
          ...items.map((asset: any) =>
            `• ${asset.displayName || asset.name} (${asset.id})` +
            (asset.tenantId ? ` - Tenant: ${asset.tenantId}` : '') +
            (asset.status ? ` - Status: ${asset.status}` : '') +
            (asset.lastSeenOn ? ` - Last seen: ${asset.lastSeenOn}` : '')
          ),
        ].join('\n');

        return {
          content: [{ type: 'text', text: resultText }],
        };
      } catch (error) {
        logger.error('Failed to list assets', error);
        return {
          content: [{ type: 'text', text: `Failed to list assets: ${error}` }],
          isError: true,
        };
      }
    }

    case 'blackpoint_assets_get': {
      const id = args.id as string;

      try {
        const asset = await client.assets.get(id);

        const assetDetails = [
          `Asset: ${asset.displayName || asset.name} (${asset.id})`,
          `Class: ${asset.assetClass}`,
          `Status: ${asset.status}`,
          asset.tenantId ? `Tenant: ${asset.tenantId}` : null,
          asset.description ? `Description: ${asset.description}` : null,
          asset.lastSeenOn ? `Last seen: ${asset.lastSeenOn}` : null,
          asset.foundBy ? `Found by: ${asset.foundBy}` : null,
          asset.foundOn ? `Found on: ${asset.foundOn}` : null,
          asset.criticality ? `Criticality: ${asset.criticality}` : null,
          asset.classification ? `Classification: ${asset.classification}` : null,
        ].filter(Boolean).join('\n');

        return {
          content: [{ type: 'text', text: assetDetails }],
        };
      } catch (error) {
        logger.error('Failed to get asset', { id, error });
        return {
          content: [{ type: 'text', text: `Failed to get asset ${id}: ${error}` }],
          isError: true,
        };
      }
    }

    case 'blackpoint_assets_relationships': {
      const assetId = args.assetId as string;
      const assetClass = args.class as string;
      const direction = args.direction as string;

      try {
        const response = await client.assets.listRelationships(assetId, {
          class: assetClass,
          direction,
        } as any);

        const items = Array.isArray(response) ? response : (response?.data ?? []);

        const resultText = [
          `${direction.charAt(0).toUpperCase() + direction.slice(1)} relationships for asset ${assetId}:`,
          '',
          ...items.map((rel: any) =>
            `• ${rel.relationshipType}: ${rel.targetAssetId} (created ${rel.created || 'unknown'})`
          ),
        ].join('\n');

        return {
          content: [{ type: 'text', text: resultText }],
        };
      } catch (error) {
        logger.error('Failed to list asset relationships', { assetId, error });
        return {
          content: [{ type: 'text', text: `Failed to list relationships for asset ${assetId}: ${error}` }],
          isError: true,
        };
      }
    }

    case 'blackpoint_assets_search': {
      const query = args.query as string;
      const classes = args.classes as string[] | undefined;
      const tenantIds = args.tenantIds as string[] | undefined;

      // If no classes specified, search all classes
      const searchClasses = classes || ['endpoint', 'server', 'network', 'cloud', 'mobile', 'iot'];

      try {
        const allResults: any[] = [];

        // Search across each specified class
        for (const assetClass of searchClasses) {
          const response = await client.assets.list({
            class: assetClass,
            search: query,
            // Note: tenantId filtering would need to be done per tenant if supported
          } as any);

          const items = Array.isArray(response) ? response : (response?.data ?? []);
          allResults.push(...items);
        }

        // Filter by tenant IDs if specified
        const filteredResults = tenantIds
          ? allResults.filter(asset => tenantIds.includes(asset.tenantId))
          : allResults;

        const resultText = [
          `Search results for "${query}":`,
          `Found ${filteredResults.length} assets across ${searchClasses.join(', ')} classes`,
          '',
          ...filteredResults.map((asset: any) =>
            `• ${asset.displayName || asset.name} (${asset.assetClass}) - ${asset.id}` +
            (asset.tenantId ? ` - Tenant: ${asset.tenantId}` : '')
          ),
        ].join('\n');

        return {
          content: [{ type: 'text', text: resultText }],
        };
      } catch (error) {
        logger.error('Failed to search assets', { query, error });
        return {
          content: [{ type: 'text', text: `Failed to search assets: ${error}` }],
          isError: true,
        };
      }
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown assets tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const assetsHandler: DomainHandler = { getTools, handleCall };