import './loadEnv.js';

import { createBot } from './bot.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';
import { log } from './log.js';
import { createPoller } from './poller.js';
import { createAppSentinelAgent } from './sentinelAgent.js';

const config = loadConfig();
const sentinelAgent = createAppSentinelAgent({
  appId: 'wor-code-reminder',
  displayName: 'WoR-Code-Reminder',
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
sentinelAgent?.start();

const database = openDatabase(config.databasePath);
const bot = createBot({
  token: config.token,
  channelId: config.channelId,
  userId: config.userId,
  database,
});

if (!config.userId) {
  log.warn('DISCORD_USER_ID is empty; any non-bot reaction will dismiss a code');
}

const poller = createPoller({ config, database, bot });
let stopPolling = () => {};

async function shutdown(exitCode = 0) {
  stopPolling();
  bot.destroy();
  database.close();
  if (exitCode === 0) sentinelAgent?.noteGracefulExit();
  else sentinelAgent?.noteCrash(new Error(`shutdown exit ${exitCode}`));
  sentinelAgent?.stop();
  process.exit(exitCode);
}

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));
process.on('unhandledRejection', (reason) => {
  sentinelAgent?.noteCrash(reason);
});
process.on('uncaughtException', (err) => {
  sentinelAgent?.noteCrash(err);
  void shutdown(1);
});

try {
  await bot.login();
  await bot.ready;
  await bot.resolveChannel();
  stopPolling = poller.start();
  log.info(`Polling every ${Math.round(config.pollIntervalMs / 1000)}s`);
} catch (error) {
  log.error('Startup failed:', error);
  await shutdown(1);
}
