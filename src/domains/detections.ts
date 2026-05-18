import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DomainHandler, CallToolResult, RequestHandlerExtra } from '../utils/types.js';
import { getClient } from '../utils/client.js';
import { logger } from '../utils/logger.js';

function getTools(): Tool[] {
  return [
    {
      name: 'blackpoint_detections_list',
      description: 'List security detections with filtering options',
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'Filter by specific tenant ID',
          },
          assetId: {
            type: 'string',
            description: 'Filter by specific asset ID',
          },
          severity: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
            },
            description: 'Filter by severity levels',
          },
          status: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['new', 'investigating', 'resolved', 'false_positive'],
            },
            description: 'Filter by detection status',
          },
          fromDate: {
            type: 'string',
            description: 'Filter detections from this date (ISO 8601 format)',
          },
          toDate: {
            type: 'string',
            description: 'Filter detections to this date (ISO 8601 format)',
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
      },
    },
    {
      name: 'blackpoint_detections_get',
      description: 'Get detailed information about a specific detection',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Detection ID',
          },
        },
        required: ['id'],
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
    case 'blackpoint_detections_list': {
      const params = {
        tenantId: args.tenantId as string | undefined,
        assetId: args.assetId as string | undefined,
        severity: args.severity as string[] | undefined,
        status: args.status as string[] | undefined,
        fromDate: args.fromDate as string | undefined,
        toDate: args.toDate as string | undefined,
        page: args.page as number | undefined,
        pageSize: args.pageSize as number | undefined,
      };

      try {
        const response = await client.detections.list(params);

        const items = Array.isArray(response) ? response : (response?.data ?? []);
        const pagination = Array.isArray(response) ? null : response?.pagination;

        const summary = [
          `Found ${items.length} detections`,
          pagination ? `(Page ${pagination.page || 1} of ${Math.ceil((pagination.totalCount || 0) / (pagination.pageSize || 50))})` : '',
        ].filter(Boolean).join(' ');

        const resultText = [
          summary,
          '',
          ...items.map((detection: any) =>
            `• ${detection.ruleName || 'Unknown rule'} (${detection.id})` +
            (detection.severity ? ` - Severity: ${detection.severity}` : '') +
            (detection.status ? ` - Status: ${detection.status}` : '') +
            (detection.assetId ? ` - Asset: ${detection.assetId}` : '') +
            (detection.created ? ` - Detected: ${detection.created}` : '')
          ),
        ].join('\n');

        return {
          content: [{ type: 'text', text: resultText }],
        };
      } catch (error) {
        logger.error('Failed to list detections', error);
        return {
          content: [{ type: 'text', text: `Failed to list detections: ${error}` }],
          isError: true,
        };
      }
    }

    case 'blackpoint_detections_get': {
      const id = args.id as string;

      try {
        const detection = await client.detections.get(id);

        const detectionDetails = [
          `Detection: ${detection.ruleName || 'Unknown rule'} (${detection.id})`,
          `Severity: ${detection.severity}`,
          `Status: ${detection.status}`,
          detection.tenantId ? `Tenant: ${detection.tenantId}` : null,
          detection.assetId ? `Asset: ${detection.assetId}` : null,
          detection.description ? `Description: ${detection.description}` : null,
          detection.source ? `Source: ${detection.source}` : null,
          detection.timestamp ? `Timestamp: ${detection.timestamp}` : null,
          detection.mitreTactics?.length ? `MITRE Tactics: ${detection.mitreTactics.join(', ')}` : null,
          detection.mitreTechniques?.length ? `MITRE Techniques: ${detection.mitreTechniques.join(', ')}` : null,
          detection.created ? `Created: ${detection.created}` : null,
        ].filter(Boolean).join('\n');

        return {
          content: [{ type: 'text', text: detectionDetails }],
        };
      } catch (error) {
        logger.error('Failed to get detection', { id, error });
        return {
          content: [{ type: 'text', text: `Failed to get detection ${id}: ${error}` }],
          isError: true,
        };
      }
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown detections tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const detectionsHandler: DomainHandler = { getTools, handleCall };