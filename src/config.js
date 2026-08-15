function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, fallback) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export function loadConfig() {
  const pollIntervalMs = Number(optional('POLL_INTERVAL_MS', '420000'));
  if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 60_000) {
    throw new Error('POLL_INTERVAL_MS must be a number of at least 60000 (1 minute)');
  }

  return {
    token: required('DISCORD_TOKEN'),
    channelId: required('DISCORD_CHANNEL_ID'),
    userId: optional('DISCORD_USER_ID', ''),
    pollIntervalMs,
    databasePath: optional('DATABASE_PATH', './data/reminder.db'),
    promoCodesUrl: optional(
      'PROMO_CODES_URL',
      'https://prospector.gg/promo-codes/?ppcb_status=active',
    ),
  };
}
