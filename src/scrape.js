import './loadEnv.js';

import { pathToFileURL } from 'node:url';

import * as cheerio from 'cheerio';

import { log } from './log.js';

const USER_AGENT =
  'WoR-Code-Reminder/1.0 (personal Discord reminder; +https://prospector.gg/promo-codes/)';

// ponytail: 10 pages is 240 codes at the current page size. Raise the cap if a next link still remains.
const MAX_PAGES = 10;
const MONTHS = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export async function scrapePromoCodes(url) {
  const codes = [];
  const seen = new Set();
  let pageUrl = url;
  let listedCount = null;

  for (let page = 1; page <= MAX_PAGES && pageUrl; page += 1) {
    const html = await fetchPromoPage(pageUrl);
    const parsed = parsePromoPage(html);
    if (listedCount == null) listedCount = parsed.listedCount;

    for (const promo of parsed.codes) {
      const key = promo.code.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      codes.push(promo);
    }

    if (!parsed.nextPage || parsed.nextPage === pageUrl) break;
    if (page === MAX_PAGES) {
      log.warn(`Stopped after ${MAX_PAGES} promo pages; later pages were not read.`);
      break;
    }
    pageUrl = parsed.nextPage;
  }

  if (listedCount != null && listedCount !== codes.length) {
    log.warn(
      `Parsed ${codes.length} active code(s) but the page listed ${listedCount}. Pagination or markup may have changed.`,
    );
  }

  return codes;
}

async function fetchPromoPage(url) {
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

  return response.text();
}

export function parsePromoPage(html) {
  const $ = cheerio.load(html);
  const codes = [];

  $('article.pph-promo-card').each((_, el) => {
    const $card = $(el);
    const status = $card.find('.pph-promo-status').first().text().trim().toLowerCase();
    const active = $card.hasClass('pph-promo-card--active') || status === 'active';
    if (!active) return;

    const code =
      $card.find('[data-pph-copy-code]').attr('data-pph-copy-code')?.trim() ||
      $card.find('.pph-promo-card__code strong').first().text().trim();
    if (!code) return;

    const windowLabel = $card
      .find('.pph-promo-card__meta > span')
      .eq(1)
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    const { start, end } = parseWindow(windowLabel);
    const rewards = $card
      .find('.pph-promo-reward')
      .map((__, rewardEl) => {
        const $reward = $(rewardEl);
        const $label = $reward.find('span').first().clone();
        $label.find('b').remove();
        return {
          name: $label.text().trim() || $reward.find('img').attr('alt')?.trim() || '',
          qty: $reward
            .find('b')
            .first()
            .text()
            .trim()
            .replace(/^×\s*/, ''),
          image: $reward.find('img').attr('src') || '',
        };
      })
      .get()
      .filter((reward) => reward.name);

    codes.push({ code, start, end, windowLabel, rewards });
  });

  if (codes.length === 0 && $('.pph-promo-archive').length === 0) {
    log.warn('Promo page has no recognizable code cards. Markup may have changed.');
  }

  const listedText = $('.pph-promo-filter-foot strong').first().text().trim();
  const listedCount = listedText ? Number(listedText) : null;
  const nextPage = $('nav.pph-information-pagination a.next').attr('href') || null;

  return {
    codes,
    listedCount: Number.isFinite(listedCount) ? listedCount : null,
    nextPage,
  };
}

export function parsePromoCodes(html) {
  return parsePromoPage(html).codes;
}

// ponytail: the page prints calendar dates with no time or timezone. Start is UTC midnight and end is 23:59:59 UTC. Prefer data-start/data-end if those attributes come back.
function parseWindow(label) {
  const match = label.match(
    /([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\s*[-\u2013\u2014]\s*([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})/,
  );
  if (!match) return { start: null, end: null };
  return {
    start: dayStamp(match[1], match[2], match[3], false),
    end: dayStamp(match[4], match[5], match[6], true),
  };
}

function dayStamp(monthName, day, year, endOfDay) {
  const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
  if (month == null) return null;
  const stamp = endOfDay
    ? Date.UTC(Number(year), month, Number(day), 23, 59, 59)
    : Date.UTC(Number(year), month, Number(day));
  return Number.isFinite(stamp) ? Math.floor(stamp / 1000) : null;
}

const isDirectRun =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const url =
    process.env.PROMO_CODES_URL || 'https://prospector.gg/promo-codes/?promo_status=active';
  scrapePromoCodes(url)
    .then((codes) => {
      console.log(JSON.stringify(codes, null, 2));
    })
    .catch((error) => {
      log.error('Scrape failed:', error);
      process.exitCode = 1;
    });
}
