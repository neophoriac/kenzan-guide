const assert = require('node:assert/strict');
const { formatNativeText } = require('../guide/native-text.cjs');
const data = require('../../data/inventory/restaurant-items.json');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

// Enrich the existing checklist, retaining its native item keys and access rules.
function withRestaurantItems(html) {
  const items = new Map(data.items.map(item => [item.itemId, item]));
  assert.equal(items.size, 60, 'Restaurant reference must cover all 60 distinct orders');
  let tables = 0;
  let rows = 0;
  const used = new Set();
  const section = /(<section\b[^>]*\bid="restaurant-completion"[^>]*>)([\s\S]*?)(<\/section>)/;
  assert(section.test(html), 'Missing Food & Drink checklist');
  const result = html.replace(section, (_section, open, content, close) => {
    const menus = content.replace(/(<details\b[^>]*\bid="restaurant-menu-(\d+)"[^>]*>)([\s\S]*?)(<\/details>)/g,
      (_menu, start, shop, menu, end) => {
        tables++;
        assert(menu.includes('<table>') && menu.includes('<th scope="col">Order</th>'), `Unexpected restaurant ${shop} structure`);
        menu = menu.replace('<table>', '<table class="restaurant-orders">')
          .replace('<th scope="col">Order</th>', '<th scope="col">Order</th><th scope="col">In-game description</th>');
        menu = menu.replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g, (row, attributes, cells) => {
          const match = cells.match(/\bdata-side-done="restaurant-item-(\d+)"/);
          if (!match) return row;
          const itemId = Number(match[1]);
          const item = items.get(itemId);
          assert(item?.image && Array.isArray(item.offers), `Missing native restaurant item ${itemId}`);
          const offer = item.offers.find(offer => Number(offer.shopId) === Number(shop));
          assert(offer && typeof offer.description === 'string' && offer.description.trim(), `Missing menu description for ${shop}/${itemId}`);
          assert(/^assets\/restaurant-artwork\/[a-z0-9_]+\.webp$/.test(item.image.src), 'Unexpected restaurant artwork path');
          assert(item.image.width > 0 && item.image.height > 0, 'Invalid restaurant artwork size');
          assert(/^\s*<th scope="row">/.test(cells), 'Restaurant name must remain its row header');
          cells = cells.replace(/<th scope="row">([\s\S]*?)<\/th>/, (_header, label) =>
            `<th scope="row"><div class="restaurant-order-identity"><img src="${escape(item.image.src)}" width="${item.image.width}" height="${item.image.height}" alt="" loading="lazy" decoding="async"><span class="restaurant-order-name">${label}</span></div></th>`
            + `<td><p class="restaurant-order-description" data-native-restaurant-description="${itemId}">${formatNativeText(offer.description)}</p></td>`);
          rows++;
          used.add(itemId);
          return `<tr${attributes}>${cells}</tr>`;
        });
        return start + menu + end;
      });
    return open + menus.replace('<details class="collectible-group" id="restaurant-menu-10">',
      '<p class="quest-meta restaurant-reference-note">Artwork and descriptions come from the English-patched game.</p>\n  <details class="collectible-group" id="restaurant-menu-10">') + close;
  });
  assert.equal(tables, 8, 'Restaurant table coverage changed');
  assert.equal(rows, 71, 'Restaurant menu entry coverage changed');
  assert.equal(used.size, 60, 'Restaurant item coverage changed');
  return result;
}

module.exports = { withRestaurantItems };
