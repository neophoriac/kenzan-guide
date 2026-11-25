// These URLs work before JavaScript runs, including copied and new-tab links.
function kenzanMapHref(data) {
  const parameters = new URLSearchParams();
  const fields = { mapQuest: 'quest', mapRevelation: 'activity', mapPlace: 'pin',
    mapCollectible: 'collectible', mapArea: 'area', mapStreet: 'street' };
  for (const [field, parameter] of Object.entries(fields)) {
    if (data[field] !== undefined && data[field] !== '') parameters.set(parameter, data[field]);
  }
  if (data.mapLockerKey) parameters.set('pin', 'locker:' + data.mapLockerKey);
  if (data.mapRevelation === 'shichigoro') parameters.set('pin', 'shichigoro');
  if (/^\d+$/.test(String(data.mapStep)) && (parameters.has('quest') || parameters.has('activity'))) {
    parameters.set('step', Number(data.mapStep) + 1);
  }
  return '#quest-map' + (parameters.size ? '?' + parameters : '');
}

if (typeof module !== 'undefined' && module.exports) {
  const entities = { amp: '&', apos: "'", quot: '"', lt: '<', gt: '>' };
  const decode = text => text.replace(/&(#x[\da-f]+|#\d+|amp|apos|quot|lt|gt);/gi, (entity, key) => {
    if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? entity;
    const number = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
  });
  function withGuideMapURLs(html) {
    return html.replace(/<a\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi, tag => {
      if (!/\bhref\s*=(["'])#quest-map\1/i.test(tag)) return tag;
      const data = {};
      for (const [, name, , value] of tag.matchAll(/\bdata-map-([\w-]+)\s*=(["'])(.*?)\2/gi)) {
        data['map-' + name.toLowerCase()] = decode(value);
      }
      const normalized = Object.fromEntries(Object.entries(data).map(([key, value]) =>
        [key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
      const href = kenzanMapHref(normalized).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
      return tag.replace(/\bhref\s*=(["'])#quest-map\1/i, `href="${href}"`);
    });
  }
  module.exports = { kenzanMapHref, withGuideMapURLs };
}
