import './loadEnv.js';

import { pathToFileURL } from 'node:url';

import * as cheerio from 'cheerio';

import { log } from './log.js';

const USER_AGENT =
  'WoR-Code-Reminder/1.0 (personal Discord reminder; +https://prospector.gg/promo-codes/)';

export async function scrapePromoCodes(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': USER_AGENT,
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Promo page returned HTTP ${response.status}`);
  }

  const html = await response.text();
  return parsePromoCodes(html);
}

export function parsePromoCodes(html) {
  const $ = cheerio.load(html);
  const codes = [];

  $('[data-ppcb2-card].ppcb2-status-active').each((_, el) => {
    const $card = $(el);
    const code = $card.attr('data-code')?.trim();
    if (!code) return;

    const start = Number($card.attr('data-start'));
    const end = Number($card.attr('data-end'));
    const windowLabel = $card.find('.ppcb2-card-meta span').first().text().trim();
    const rewards = $card
      .find('.ppcb2-reward')
      .map((__, rewardEl) => {
        const $reward = $(rewardEl);
        return {
          name: $reward.find('.ppcb2-reward-text span').first().text().trim(),
          qty: $reward.find('.ppcb2-reward-text strong').first().text().trim(),
          image: $reward.find('.ppcb2-reward-image').attr('src') || '',
        };
      })
      .get()
      .filter((reward) => reward.name);

    codes.push({
      code,
      start: Number.isFinite(start) ? start : null,
      end: Number.isFinite(end) ? end : null,
      windowLabel,
      rewards,
    });
  });

  const listedCount = Number($('.ppcb2-filter-actions strong').first().text().trim());
  if (Number.isFinite(listedCount) && listedCount !== codes.length) {
    log.warn(
      `Parsed ${codes.length} active code(s) but the page listed ${listedCount}. Pagination or markup may have changed.`,
    );
  }

  return codes;
}

const isDirectRun =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const url =
    process.env.PROMO_CODES_URL || 'https://prospector.gg/promo-codes/?ppcb_status=active';
  scrapePromoCodes(url)
    .then((codes) => {
      console.log(JSON.stringify(codes, null, 2));
    })
    .catch((error) => {
      log.error('Scrape failed:', error);
      process.exitCode = 1;
    });
}
