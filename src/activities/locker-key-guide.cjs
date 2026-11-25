const assert = require('node:assert/strict');
const { renderPhotoPreview } = require('../../atlas/render.cjs');
const { loadLocationPhoto } = require('../map/location-photos.cjs');

function loadLockerKeys() {
  const rewards = require('../../data/activities/locker-key-rewards.json');
  const directions = require('../../data/activities/locker-key-directions.json');
  const points = require('../../maps/data/atlas-locker-keys.json');
  const labels = new Map(require('../../maps/data/areas.json').map(({ id, label }) => [id, label]));
  const ids = new Set();
  const keys = points.map(({ code: nativeCode, area, x, y, roof, lookUp, indoor, variant, approximate }) => {
    const hint = directions[variant === 'kyoto-tour' ? 'A-1-kyoto' : nativeCode];
    const reward = variant === 'kyoto-tour' ? 'Ancient Shichishito' : rewards[nativeCode];
    // The English pickup messages letter the locker columns in reverse native order.
    const code = String.fromCharCode('J'.charCodeAt(0) - (nativeCode.charCodeAt(0) - 'A'.charCodeAt(0))) + nativeCode.slice(1);
    const suffix = { story: '-story', 'kyoto-tour': '-tour' }[variant] ?? '';
    const id = code + suffix;
    assert(!ids.has(id) && labels.has(area) && reward && hint?.steps.length, `Incomplete locker key ${id}`);
    ids.add(id);
    const mode = { story: 'Main story', 'kyoto-tour': 'Kyoto Adventure' }[variant];
    return { id, code, area, x, y, type: 'locker-key', name: `Locker Key ${code}${mode ? ` · ${mode}` : ''}`,
      location: labels.get(area), reward, roof: Boolean(roof || hint.surface === 'Roof'),
      steps: hint.steps, surface: hint.surface, lookUp: Boolean(lookUp || hint.lookUp), photo: loadLocationPhoto('locker-key-photos', id),
      indoor: Boolean(indoor || hint.interior), note: hint.note, mode, approximate };
  });
  assert.deepEqual([...new Set(keys.map(({ code }) => code))].sort(), Object.keys(rewards).sort(), 'Locker key coverage');
  return keys.sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
}

function renderLockerKeys(keys, escape) {
  return `<section data-side-checklist class="supplement" id="locker-keys" aria-labelledby="locker-keys-title">
    <h2 id="locker-keys-title">Storage Lockers</h2>
    <p>Finish <a href="#quest-104">#104 Storage Locker Instructions</a> in Chapter 5 to unlock regular key pickups. Take the keys to the <a href="#quest-map" data-map-locker-key="lockers">Storage Lockers</a> near Tatsuya in Gion. Open all 50 lockers, then check your mail at Tatsuya for the Lucky Beads.</p>
    <p>Mark <strong>Key collected</strong> to enable <strong>Locker opened</strong> for that row. The Completion List counts the 50 opened lockers. J-1 has a pickup location for each game mode and one shared locker. Save sync checks the pickup for your saved mode.</p>
    <p>Look for a glint and check containers and furniture inside buildings. For keys marked <strong>Roof</strong>, stand near the pin and look up until the interaction prompt appears.</p>
    <p class="quest-meta side-content-filters" data-side-progress data-side-progress-unit="opened" role="status" tabindex="-1"></p>
    <details class="collectible-group" id="locker-key-table">
    <summary>Key locations and locker rewards</summary>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Locker key locations"><table>
      <thead><tr><th scope="col">Key</th><th scope="col">Pickup</th><th scope="col">Locker reward</th><th scope="col" id="locker-key-pickups" data-completion-section="locker-key-pickups">Key collected</th><th scope="col" data-completion-section="locker-keys">Locker opened</th></tr></thead>
      <tbody>${keys.map(({ id, code, name, location, roof, surface, steps, note, reward, mode, approximate, indoor, lookUp, photo }) => `<tr id="locker-key-${escape(id)}" data-checklist-location="${escape(location)}">
        <th scope="row"><a href="#quest-map" data-map-locker-key="${escape(id)}" aria-label="Show locker key ${escape(code)}${mode ? `, ${escape(mode)}` : ''} on map">${escape(code)}</a></th>
        <td><strong>${escape(location)}</strong>${mode ? ` · ${escape(mode)}` : ''}${indoor ? ' · Indoors' : ''}${roof ? ' · <strong>Roof</strong>' : surface && surface !== 'Interior' ? ` · ${escape(surface)}` : ''}${lookUp ? ' · Look up' : ''}${approximate ? ' · Approximate pin' : ''}<br>${steps.map(escape).join(' ')}${note ? ` ${escape(note)}` : ''}${photo ? renderPhotoPreview(photo, name) : ''}</td>
        <td>${escape(reward)}</td>
        <td data-completion-section="locker-key-pickups"><label class="quest-check"><input type="checkbox" autocomplete="off" data-collectible-collected="locker-key:${escape(id)}" aria-label="Collected Locker Key ${escape(code)}${mode ? `, ${escape(mode)}` : ''}"></label></td>
        <td data-completion-section="locker-keys"><label class="quest-check"><input type="checkbox" autocomplete="off" data-side-done="locker-opened-${escape(code)}" aria-label="Opened locker ${escape(code)}${mode ? `, ${escape(mode)}` : ''}"></label></td>
      </tr>`).join('\n')}</tbody>
    </table></div></details>
    <p>Pickup locations and surfaces cross-checked with <a href="https://www.khhsubs.com/kenzan/lockerkeys/">KHHSubs’ locker key guide</a>. The codes above match the English patch.</p>
  </section>`;
}

module.exports = { loadLockerKeys, renderLockerKeys };
