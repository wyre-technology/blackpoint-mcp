import { CompassOneClient, CompassOneConfig } from '@wyre-technology/node-blackpoint';
import { logger } from './logger.js';

let _client: CompassOneClient | null = null;
let _credentials: CompassOneConfig | null = null;

function getCredentials(): CompassOneConfig | null {
  const apiToken = process.env.BLACKPOINT_API_TOKEN;
  const baseUrl = process.env.BLACKPOINT_BASE_URL;

  if (!apiToken) {
    return null;
  }

  return {
    apiToken,
    baseUrl: baseUrl || undefined,
  };
}

export async function getClient(): Promise<CompassOneClient> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error('No CompassOne API credentials configured. Set BLACKPOINT_API_TOKEN environment variable.');
  }

  // Invalidate cache if credentials changed (gateway injects per-request)
  if (_client && _credentials &&
      (creds.apiToken !== _credentials.apiToken || creds.baseUrl !== _credentials.baseUrl)) {
    logger.debug('Credentials changed, resetting client');
    _client = null;
  }

  if (!_client) {
    logger.debug('Creating new CompassOne client');
    _client = new CompassOneClient(creds);
    _credentials = creds;
  }

  return _client;
}

export function resetClient(): void {
  logger.debug('Resetting CompassOne client');
  _client = null;
  _credentials = null;
}