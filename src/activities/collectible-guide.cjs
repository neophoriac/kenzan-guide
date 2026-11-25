const { renderPhotoPreview } = require('../../atlas/render.cjs');
const { guideArtworkLabel } = require('../map/guide-artwork-names.cjs');

const areaNames = new Map(require('../../maps/data/areas.json').map(({ id, label }) => [id, label]));

const turtleRescueIntro = `<p>When you find an overturned turtle during the story, interact with it to turn it upright. Each of the four rescues unlocks a special turtle with higher potential for racing. You only have one chance to save each one.</p>
        <p>From 5-6, get the free <strong>Turtle Bucket</strong> from the turtle vendor in Rakugai and use it to raise turtles at Tatsuya. Rescued turtles show up there after turtles in your care die. Miyamoto appears after 1 death and can reach the maximum sand stat, Temple after 2 for water, Farm after 3 for mud, and Riverbed after 4 for speed. The pickup rows show where to collect them for the races in Gion.</p>
        <p><a href="https://www.khhsubs.com/kenzan/turtles/">KHHSubs’ turtle raising and racing guide</a></p>`;
const wildTurtleIntro = `<p>From Chapter 5, each spot sets the turtle’s species, starting tier and any Water, Sand or Mud head start. Seven spots use the <strong>higher starting tier</strong>: see <a href="#turtle-gathering">where to gather turtles</a>. Chinese and Japanese Pond Turtles use the same starting-stat rules; the spot’s tier and terrain boost determine the ranges.</p>
        <p><strong>Caps at pickup</strong> are the turtle’s initial maximums. Current stats start around half to full cap, and future growth ceilings are rolled separately. The ranges below describe what a fresh catch can start with, not a guaranteed race result.</p>
        <p>Spawn numbers are local to each area and match the interactive map. They run left to right on wide maps and top to bottom on tall maps. The game picks an active spot in each spawn group. Catches can move those spots, and cooldowns count down while you are away from the selected area. If a spot is empty, check the other marked spots.</p>`;

function renderCollectibles(places, layers, escape, objectives, saveSyncKeys) {
  return `<section class="supplement" id="collectibles" aria-labelledby="collectibles-title">
    <h2 id="collectibles-title">Collectibles</h2>
    <p>Use the <a href="#locker-keys">Locker Keys table</a> for all 51 key locations and 50 locker rewards. Open a group below for other collectibles. Select an item’s name to jump to its pin. Collected checkmarks sync with the interactive map. Wild turtle spawns are repeatable.</p>
    <p>Check story-stage pickups before leaving the area. Some are only available during that part of the story.</p>
    ${layers.filter(layer => layer.id !== 'locker-key').map(layer => {
      const entries = places.filter(place => place.type === layer.id)
        .flatMap(place => place.entries.map(entry => ({ place, entry })));
      entries.sort((a, b) => a.entry.name.localeCompare(b.entry.name, 'en', { numeric: true })
        || areaNames.get(a.place.area).localeCompare(areaNames.get(b.place.area)));
      const trackable = layer.id !== 'wild-turtle';
      const intro = { 'turtle-rescue': turtleRescueIntro, 'wild-turtle': wildTurtleIntro }[layer.id];
      return `<details class="collectible-group" id="collectibles-${layer.id}">
        <summary>${escape(layer.label)} <span>(${entries.length})</span></summary>
        ${intro ? `<div class="collectible-intro">${intro}</div>` : ''}
        <div class="table-wrap" tabindex="0" role="region" aria-label="${escape(layer.label)}">
        <table>
          <thead><tr><th scope="col">Item</th><th scope="col">Location and directions</th>${trackable ? '<th scope="col">Collected</th>' : ''}</tr></thead>
          <tbody>${entries.map(({ place, entry }) => {
            const key = `${place.id}:${entry.progressId}`;
            const saveStatus = layer.id === 'stage-supply' && (saveSyncKeys.has('kenzan-atlas:collected:' + entry.progressId)
              ? 'Syncs from save' : 'Mark manually');
            const meta = [entry.window && `Story window ${entry.window}`, objectives[entry.window],
              entry.approximate && 'Approximate pin', saveStatus].filter(Boolean).map(escape).join(' · ');
            const related = entry.questId ? [`quest-${entry.questId}`, `Quest #${entry.questId}`]
              : entry.revelationId ? [`revelation-${entry.revelationId}`, 'Related Revelation']
              : entry.lockerKeyId ? [`locker-key-${entry.lockerKeyId}`, `Locker Key ${entry.lockerKeyId}`] : undefined;
            const location = escape(guideArtworkLabel(place.area, place.location));
            return `<tr id="collectible-${escape(key)}" data-checklist-location="${location}">
              <th scope="row"><a href="#quest-map" data-map-collectible="${escape(key)}" aria-label="Show ${escape(entry.name)} on map">${escape(entry.name)}</a></th>
              <td><strong>${location}</strong>${meta ? ` · ${meta}` : ''}<br>${escape(entry.detail)}
              ${related ? `<br><a href="#${escape(related[0])}">${escape(related[1])}</a>` : ''}${place.photo ? renderPhotoPreview(place.photo, entry.name) : ''}</td>
              ${trackable ? `<td><label class="quest-check"><input type="checkbox" autocomplete="off" data-collectible-collected="${escape(entry.progressId)}" aria-label="Collected ${escape(entry.name)}"></label></td>` : ''}
            </tr>`;
          }).join('\n')}</tbody>
        </table></div>
      </details>`;
    }).join('\n')}
  </section>`;
}

module.exports = { renderCollectibles };
