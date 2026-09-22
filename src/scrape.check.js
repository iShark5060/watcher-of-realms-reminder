import assert from 'node:assert/strict';

import { parsePromoPage } from './scrape.js';

const html = `
<section class="pph-promo-archive">
  <div class="pph-promo-filter-foot"><span><strong>2</strong> codes</span></div>
  <article class="pph-promo-card pph-promo-card--active">
    <div class="pph-promo-card__code"><strong>worddgd2</strong></div>
    <button data-pph-copy-code="worddgd2">Copy Code</button>
    <div class="pph-promo-card__meta">
      <span class="pph-promo-status">Active</span>
      <span>Sep 19, 2026 \u2013 Sep 24, 2026</span>
    </div>
    <div class="pph-promo-rewards">
      <span class="pph-promo-reward"><img src="https://example.test/crystal.webp" alt="Rare Summoning Crystal"><span>Rare Summoning Crystal<b>\u00d71</b></span></span>
      <span class="pph-promo-reward"><img src="https://example.test/potion.webp" alt="Huge Stamina Potion"><span>Huge Stamina Potion<b>\u00d71</b></span></span>
    </div>
  </article>
  <article class="pph-promo-card pph-promo-card--expired">
    <div class="pph-promo-card__code"><strong>oldcode</strong></div>
    <button data-pph-copy-code="oldcode">Copy Code</button>
    <div class="pph-promo-card__meta"><span class="pph-promo-status">Expired</span><span>Sep 1, 2026 \u2013 Sep 2, 2026</span></div>
  </article>
  <article class="pph-promo-card pph-promo-card--active">
    <div class="pph-promo-card__code"><strong>wor02lore</strong></div>
    <button data-pph-copy-code="wor02lore">Copy Code</button>
    <div class="pph-promo-card__meta">
      <span class="pph-promo-status">Active</span>
      <span>Sep 21, 2026 \u2013 Sep 26, 2026</span>
    </div>
    <span class="pph-promo-reward"><img src="https://example.test/diamonds.webp" alt="Diamonds"><span>Diamonds<b>\u00d7200</b></span></span>
  </article>
</section>
<nav class="pph-information-pagination"><a class="next page-numbers" href="https://prospector.gg/promo-codes/?promo_status=active&amp;promo_page=2">Next</a></nav>
`;

const page = parsePromoPage(html);

assert.deepEqual(
  page.codes.map((promo) => promo.code),
  ['worddgd2', 'wor02lore'],
);
assert.equal(page.listedCount, 2);
assert.equal(page.nextPage, 'https://prospector.gg/promo-codes/?promo_status=active&promo_page=2');
assert.equal(page.codes[0].windowLabel, 'Sep 19, 2026 \u2013 Sep 24, 2026');
assert.equal(new Date(page.codes[0].start * 1000).toISOString(), '2026-09-19T00:00:00.000Z');
assert.equal(new Date(page.codes[0].end * 1000).toISOString(), '2026-09-24T23:59:59.000Z');
assert.deepEqual(page.codes[0].rewards, [
  {
    name: 'Rare Summoning Crystal',
    qty: '1',
    image: 'https://example.test/crystal.webp',
  },
  {
    name: 'Huge Stamina Potion',
    qty: '1',
    image: 'https://example.test/potion.webp',
  },
]);
assert.deepEqual(page.codes[1].rewards, [
  { name: 'Diamonds', qty: '200', image: 'https://example.test/diamonds.webp' },
]);

const unrecognized = parsePromoPage('<html><body><p>nope</p></body></html>');
assert.deepEqual(unrecognized.codes, []);
assert.equal(unrecognized.listedCount, null);

console.log('scrape check ok');
