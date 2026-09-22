import { createSentinelAgent } from '@dark-avian-labs/sentinel-agent';

export function createAppSentinelAgent(options) {
  if (options.nodeEnv === 'test') return null;
  const token = process.env.SENTINEL_INGEST_TOKEN?.trim() ?? '';
  const ingestUrl = process.env.SENTINEL_INGEST_URL?.trim() ?? '';
  if (!token || !ingestUrl) return null;
  return createSentinelAgent({
    appId: options.appId,
    displayName: options.displayName,
    ingestUrl,
    token,
  });
}
