import { log } from './log.js';
import { scrapePromoCodes } from './scrape.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createPoller({ config, database, bot }) {
  let running = false;

  async function tick() {
    if (running) {
      log.warn('Skipping poll; previous run is still in progress');
      return;
    }

    running = true;
    try {
      await pollOnce();
    } catch (error) {
      log.error('Poll failed:', error);
    } finally {
      running = false;
    }
  }

  async function pollOnce() {
    const active = await scrapePromoCodes(config.promoCodesUrl);
    if (active.length === 0) {
      log.info('Scrape returned no active codes; leaving existing messages untouched');
      return;
    }

    log.info(`Found ${active.length} active code(s)`);
    const activeKeys = new Set(active.map((promo) => promo.code.toLowerCase()));

    for (const posted of database.listPosted()) {
      if (!activeKeys.has(posted.code.toLowerCase())) {
        log.info(`${posted.code} is no longer active; removing message`);
        await bot.deletePosted(posted);
      }
    }

    for (const promo of active) {
      if (database.isRedeemed(promo.code)) {
        continue;
      }

      const posted = database.getPosted(promo.code);
      if (posted) {
        const stillThere = await bot.messageExists(posted);
        if (stillThere) continue;
        log.warn(`Message for ${promo.code} is gone; posting again`);
        database.removePosted(promo.code);
      }

      await bot.postCode(promo);
      await sleep(500);
    }
  }

  function start() {
    const timer = setInterval(tick, config.pollIntervalMs);
    void tick();
    return () => clearInterval(timer);
  }

  return { start, tick };
}
