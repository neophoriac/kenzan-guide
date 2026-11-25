const { root: projectRoot } = require("../paths.cjs");
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const placePhotos = {
  'st_gion:Tatsuya': 'gion-tatsuya',
  'st_gion:Storage Lockers': 'gion-storage-lockers',
  'st_gion:Gion Martial Arts Dojo': 'gion-martial-arts-dojo',
  'st_gion:Outdoor Shogi': 'gion-outdoor-shogi',
  'st_gion:Shichigoro': 'gion-shichigoro',
  'st_gion:Sake Nakanokura': 'gion-sake-nakanokura',
  'st_gion:Tsuruya': 'gion-tsuruya',
  'st_rakugaicho:Gion Main Gate palanquin': 'rakugai-gion-main-gate-palanquin',
  'st_rakugaicho:Theater palanquin': 'rakugai-theater-palanquin',
  'st_rakugaicho:Sake Ikkonya': 'rakugai-sake-ikkonya',
  'st_rakugaicho:Etchuya Drugs': 'rakugai-etchuya-drugs',
  'st_rakugaicho:Blacksmith': 'rakugai-blacksmith',
  'st_rakugaicho:Zanki Dojo': 'rakugai-zanki-dojo',
  'st_kaido_rindo:Horse Archery Grounds': 'forest-path-archery',
  'st_rakugaicho:Police Box and Wanted Board': 'rakugai-wanted-board',
  'st_rakugaicho:Turtle Seller': 'rakugai-turtle-seller',
  'st_rakugaicho:Northwest Rakugai Jizo': 'rakugai-jizo-northwest',
  'st_rakugaicho:Northeast Rakugai Jizo': 'rakugai-jizo-northeast',
  'st_rakugaicho:Southwest Rakugai Jizo': 'rakugai-jizo-southwest',
  'st_rakugaicho:Southeast Rakugai Jizo': 'rakugai-jizo-southeast',
  'st_rakugaicho:Outdoor Cee-Lo': 'rakugai-cee-lo',
  'st_rakugaicho:Outdoor Hanafuda': 'rakugai-hanafuda',
  'st_rakugaicho:Shogi Narikin': 'rakugai-shogi-narikin',
  'st_rakugaicho:Used Goods Buyer': 'rakugai-used-goods-buyer',
  'st_rakugaicho:Arigataya Market': 'rakugai-arigataya-market',
  'st_rakugaicho:Mahjong Parlor': 'rakugai-mahjong-parlor',
  'st_rakugaicho:Arms Dealer': 'rakugai-arms-dealer',
};

function loadLocationPhoto(folder, name) {
  const base = `assets/${folder}/${name}`;
  const source = base + '.webp';
  if (!fs.existsSync(path.join(projectRoot, source))) return undefined;
  const preview = base + '-thumb.webp';
  assert(fs.existsSync(path.join(projectRoot, preview)), `Missing preview for ${source}`);
  return { source, preview, width: 640, height: 360 };
}

function loadPlacePhoto(area, name) {
  const photo = placePhotos[`${area}:${name}`];
  if (!photo) return undefined;
  const files = loadLocationPhoto('place-photos', photo);
  assert(files, `Missing location photo for ${name}`);
  return files;
}

module.exports = { loadLocationPhoto, loadPlacePhoto };
