// Kenzan presentation aliases from docs/research/maps/artwork-name-audit.md.
// Current labels have one authority: the map's authored artwork catalogue.
// These aliases identify whole sheets, not arbitrary native prose or venues.
const areas = require('../../maps/data/areas.json');
const labels = new Map(areas.map(({ id, label }) => [id, label]));
const fold = text => String(text ?? '').normalize('NFKD').replace(/\p{M}/gu, '')
  .replace(/[‘’]/g, "'").toLowerCase();
const legacy = {
  st_kawa_jnt: ['Riverside Tea House'],
  st_yoshioka_jnt: ['Yoshioka Dojo'],
  st_kiyomizu_jnt: ['Kiyomizudera entrance'],
  st_kiyomizu: ['Kiyomizudera grounds (Chapter 10)'],
  st_sanjusangen_jnt: ['Sanjusangendo grounds'],
  st_sanjusangendo: ['Sanjusangendo temple'],
  st_hozoin: ['Hozoin Temple'],
  st_rendaino_jnt: ['Rendai Field'],
  st_dokutsu_soto: ['Shishido’s cave approach'],
  st_tatsuya: ['Tatsuya interior'],
  st_hatsumeika: ['Gyotensai’s house interior', 'Inventor’s House'],
  st_kajiya: ['Blacksmith interior'],
  st_udon: ['Whitesnake Udon interior'],
  st_sakaya_01: ['Ikkonya interior'],
  st_sakaya_02: ['Nakanokura interior'],
  st_shichiya: ['Ebisuya Pawn interior'],
  st_tsuruya_1f: ['Tsuruya entrance floor'],
  st_dokutsu_01: ['Shishido’s cave interior'],
  st_dokutsu_02: ['Shishido’s cave tunnels'],
  st_dokutsu_03_rasen: ['Shishido’s cave spiral passage'],
  st_dokutsu_03_rasen_a00: ['Shishido’s cave spiral ring'],
  st_dokutsu_03_rasen_a01: ['Shishido’s cave spiral ring with exit'],
  st_dokutsu_04_boss: ['Shishido’s cave inner chamber'],
  st_yagyu_sato: ['Yagyū Village'],
  st_yagyu_naka: ['Yagyū Village hall'],
  st_ganryu_hama: ['Ganryū Island beach'],
  st_ganryu_yosai_01: ['Ganryū Fortress mine and swamp'],
  st_ganryu_yosai_01b: ['Ganryū Fortress mine corridor'],
  st_ganryu_yosai_02: ['Ganryū Fortress wharf'],
  st_ganryu_yosai_02b: ['Ganryū Fortress wharf corridor'],
  st_ganryu_yosai_03: ['Ganryū Fortress courtyard'],
  st_ganryu_yosai_04: ['Ganryū Fortress cliff path'],
  st_rendaino_01: ['Rendai Field battlefield 1'],
  st_rendaino_02: ['Rendai Field battlefield 2'],
  st_rendaino_03: ['Rendai Field battlefield 3'],
  st_rendaino_04: ['Rendai Field battlefield 4'],
  st_rendaino_05: ['Rendai Field battlefield 5'],
  st_rendaino_06: ['Rendai Field battlefield 6'],
  st_rendaino_boss: ['Rendai Field final battlefield'],
  st_tsuruya_2f: ['Tsuruya second floor'],
  st_tsuruya_3f: ['Tsuruya third floor'],
  st_tsuruya_4f: ['Tsuruya fourth floor'],
  st_tsuruya_dance: ['Tsuruya reception room'],
  st_tsuruya_yoshino: ['Tsuruya guest quarters'],
  st_annai: ['Gion Information Booth interior'],
  st_jiujitsu: ['Gion Martial Arts Dojo interior'],
  st_kusuriya_02: ['Tenguya Drugs interior'],
  st_sushiya: ['Sushi Ginya interior'],
  st_toba: ['Gion Gambling Den interior'],
  st_yorozuya_01: ['Gion Arigataya Market interior'],
  st_bukiya: ['Rakugai Arms Dealer interior'],
  st_kusuriya_01: ['Etchuya Drugs interior'],
  st_mahjong: ['Rakugai Mahjong Parlor interior'],
  st_misemono: ['Rakugai Theatre interior'],
  st_rakugai_dojo: ['Zanki Dojo grounds'],
  st_shogi: ['Shogi Narikin interior'],
  st_yorozuya_02: ['Rakugai Arigataya Market interior'],
  st_minka_binbo: ['Old man’s house interior'],
  st_minka_default: ['Residence 1 interior'],
  st_minka_default02: ['Residence 2 interior'],
  st_minka_default03: ['Residence 3 interior'],
  st_minka_default04: ['Residence 4 interior'],
  st_minka_gaka: ['Ranzan’s studio'],
  st_minka_gaka02: ['Painter’s house second room'],
  st_hozoin_budo: ['Hozoin Coliseum'],
  st_koetsu_chika: ['Koetsu’s Mansion basement'],
  st_yoshioka_ienonaka: ['Yoshioka Dojo interior'],
  st_akimoto: ['Akimoto’s room'],
  st_akudaikan: ['Magistrate’s room'],
  st_inei: ['In’ei’s training grounds'],
  st_karyu: ['Downstream riverbed'],
  st_miya_dojo: ['Miyamoto Dojo grounds'],
  st_miya_dojo_hanare: ['Miyamoto Dojo annex'],
  st_miya_dojo_naka: ['Miyamoto Dojo interior'],
  st_noh: ['Noh stage'],
  st_sanmon: ['Temple gate'],
  st_toaru_tani: ['Mountain valley'],
  st_toaru_tera: ['Mountain Path old temple'],
  st_toaru_yashiki: ['Secluded mansion interior'],
  st_ufo: ['UFO encounter area'],
  st_ukiyo_ienonaka: ['Ukiyo’s house interior'],
  st_ukiyo_ienosoto: ['Ukiyo’s house grounds'],
  st_yashiro: ['Shrine interior'],
  st_yuuki_nakaniwa: ['Yūki Estate courtyard'],
  st_yuuki_shinshitsu: ['Yūki Estate residence'],
};

function guideArtworkAliases() {
  return Object.entries(legacy).flatMap(([area, names]) => names.map(name => ({ area, name, label: labels.get(area) })));
}

function guideArtworkLabel(area, value) {
  const label = labels.get(area);
  if (!label) return value;
  if (!value) return label;
  const text = String(value);
  // Public walkthroughs may already use the current label. It can begin with
  // a shorter legacy alias, so recognize it before rewriting that alias.
  const separators = [' · ', ', ', ' — ', ' - '];
  if (text === label || separators.some(separator => text.startsWith(label + separator))) return text;
  // Only a complete, reviewed heading or its explicit location prefix changes.
  // A finer spot such as "bench by the shrine" remains the finer spot.
  for (const name of legacy[area] ?? []) {
    if (fold(text) === fold(name)) return label;
    for (const separator of separators) {
      const prefix = text.slice(0, name.length);
      if (fold(prefix) === fold(name) && text.slice(name.length).startsWith(separator)) {
        return label + text.slice(name.length);
      }
    }
  }
  return text;
}

function guideMapLabel(target, value = target.label) {
  const data = target.mapData ?? target;
  const area = data.mapArea ?? data.mapPlace?.split(':')[0] ?? data.mapCollectible?.split(':')[0];
  return guideArtworkLabel(area, value);
}

module.exports = { guideArtworkLabel, guideArtworkAliases, guideMapLabel };
