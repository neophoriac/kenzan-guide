const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
// Public helpers may load the guarded renderer facade during their imports.
// Prepare its generated dependencies before loading any application module.
require('./atlas/build.cjs').prepareAtlasBuild();
const { encodeView, readView, viewPaths, decodeView } = require('./src/guide/view-assets.cjs');
const { fontStyles, publicFontAssets } = require('./src/guide/font-styles.cjs');
const { createGuideMapLinker } = require('./src/map/guide-map-links.cjs');
const { linkGuideItems } = require('./src/guide/guide-item-links.cjs');
const { loadQuestStepPhoto } = require('./src/map/quest-map.cjs');
const { renderPhotoPreview } = require('./atlas/render.cjs');
const { assetNames: atlasRendererAssetNames } = require('./atlas/renderer-assets.cjs');
const { createPublicScriptStager } = require('./src/guide/public-script-assets.cjs');
const { collectPublicSource } = require('./src/guide/public-source.cjs');
const { loadGuideContentSources } = require('./src/guide/lazy-details.cjs');
const { buildGuideSearchRecords } = require('./src/guide/search-data.cjs');
const { withGuideTargetRoutes } = require('./src/guide/navigation-targets.cjs');
const { collectSceneAssets, validatePublicationFiles, validatePublicationDirectory } = require('./atlas/publication.cjs');

const guideFile = 'Kenzan Side Content Guide.html';
const mapFile = 'Kenzan Interactive Map.html';
const questArticles = /<article class="quest" id="quest-(\d+)"[^>]*>[\s\S]*?<\/article>/g;
const localWalkthrough = /<details class="quest-full" data-lazy-details="(assets\/guide-content\/[1-9]\d*\.js)">\s*<summary>Full walkthrough<\/summary>\s*<\/details>/;
const publicWalkthrough = /<details class="quest-full">\s*<summary>Detailed walkthrough<\/summary>[\s\S]*?<\/details>/;
const inlineScripts = /<script>([\s\S]*?)<\/script>/g;
const contentSecurity = /<meta http-equiv="Content-Security-Policy"[^>]*>\s*/;
const assetReferences = /\b(?:src|data-detail-src|data-preview-src|data-medium-src|data-overview-\d+-src|data-lazy-details|data-checklist-content|data-planner-worker|data-guide-search-source)="((?:maps|assets)\/[^" ]+)"/g;
const cssAssetReferences = /\burl\("((?:maps|assets)\/[^" ]+)"\)/g;
const pyramidAsset = /^maps\/assets\/pyramids\/[\w-]+\/(?:whole(?:-\d+)?|\d+\/\d+\/\d+-\d+)\.webp$/;
const pyramidReferences = /"source":"(maps\/assets\/pyramids\/[^"]+\.webp)"/g;
const guideStyleImage = /^assets\/(?:yujo-portraits\/[a-z]+|(?:kenzan-classic-ui|turtle-portraits|turtle-track)\/[a-z-]+)\.webp$/;
const karutaCardReferences = /\bassets\/karuta-cards\/[a-z]+\.webp\b/g;
const mapPhotoReferences = /\bassets\/(?:locker-key-photos\/[A-J]-[1-5](?:-[a-z]+)*|quest-step-photos\/[1-9]\d*-(?:[A-Z]|board)(?:-thumb)?|place-photos\/[a-z0-9-]+)\.webp\b/g;
// Native item artwork appears in both markup and application/json payloads.
// Scan literal URLs too; some references are not HTML src attributes yet.
const weaponArtworkReferences = /\bassets\/(?:weapon-artwork|forging-material-artwork|turtle-foods|restaurant-artwork|inventory-reference)\/[a-z0-9_-]+\.webp\b/g;
const supportedAsset = /^(?:maps\/assets\/(?:(?:previews|medium)\/)?[\w.-]+\.(?:png|webp)|assets\/(?:kenzan-banner\.png|kenzan-(?:classic-dragon|sidebar-logo)\.webp))$/i;
const deferredAssets = /\b(data-lazy-details|data-checklist-content)="(assets\/guide-content\/[1-9]\d*\.js)"/g;
const raceWorkerAsset = /\bdata-planner-worker="(assets\/turtle-race-worker\.js)"/g;
const assetPrefix = 'assets/guide-content/';
const manifestFile = 'asset-manifest.json';

// Spatial assets now live in the authored scene, rather than duplicate visual
// HTML. Include every authored level, fallback and variant without guessing
// which one happens to be visible when the release is staged.
function mapSceneAssets(markup) {
  return new Set(mapSceneDeclarations(markup).filter(asset => asset.kind === 'local').map(asset => asset.url));
}
const publicationRoot = 'https://kenzan-pages.invalid/';
function mapSceneDeclarations(markup) {
  const sources = [...markup.matchAll(/<script type="application\/json" id="atlas-data">([^<]+)<\/script>/g)];
  assert(sources.length, 'Missing authored Atlas data while collecting public imagery');
  return sources.flatMap(([, source]) => collectSceneAssets(JSON.parse(source), { baseURL: publicationRoot + 'map.html' }));
}
const publicWalkthroughCorrections = {
  8: [[
    'After each interview, enter Arigataya Market and step back out. Speak to the author again to collect 1 ryō for a perfect set or 5,000 mon if you missed an answer.',
    'After each interview, walk away until the author reappears, then return to collect payment. Four correct answers earn 10,000 mon, two or three earn 5,000 mon, and zero or one earns 500 mon.',
  ]],
  17: [
    ['Refuse the demand for 3 ryō with the second response and win the fight. When his wife asks you to help find him, choose the first response.',
      'Choose “Don’t Pay” when he demands 3 ryō and win the fight. When his wife asks for help, choose “Look for Gonbei”.'],
  ],
  76: [['Raden Ore', 'Mother of Pearl'], ['Phantom Thief Netsuke', 'Thief’s Netsuke']],
  78: [['Star Steel', 'Celestial Steel']],
  83: [['buy the red hairpin', 'buy the Red Hairpiece'], ['Bring the hairpin back', 'Bring the Red Hairpiece back']],
  93: [
    ['agree to hear him play and use the second option to say it sounds terrible.',
      'choose “Listen”, then choose the fifth response, “It’s the worst thing I ever heard.”'],
  ],
  99: [
    ['In daylight at 11-2, approach the bandits', 'From 11-1, approach the bandits'],
    ['Return to Mountain Path in daylight.', 'Return to Mountain Path when story travel allows it.'],
    [/Return to (<a\b[^>]*>Mountain Path<\/a>) in daylight\./g, 'Return to $1 when story travel allows it.'],
  ],
};
// Keep the reviewed public walkthroughs rather than publishing the imported
// document wholesale. This replacement contains the separately verified native
// dialogue facts added after the previous public release.
const publicWalkthroughOverrides = {
  113: `<details class="quest-full"><summary>Detailed walkthrough</summary>
    <p>Either option advances each conversation. Your answers change the letters and replies; all 16 combinations reach the same completion and 1,500 EXP reward.</p>
    <ol class="quest-walkthrough-steps">
      <li>Read Tsubaki’s first letter in the Tatsuya mailbox after Yojimbo for Ebisuya. Visit Tsubaki inside Sake Nakanokura, then the customer sitting by the south steps of Gion Inari Shrine.</li>
      <li>For the first letter, choose “Say she lied to hide her embarrassment.” or “Admit that she really does like samurai.” The first explains away an earlier lie; the second admits her interest in samurai while reassuring the customer. With the customer, choose “Why don't you go see her and find out?” or “I think she's being truthful.” A suggested route is the first answer to Tsubaki and the second to the customer, but either works.</li>
      <li>Read the next letter at Tatsuya and revisit Tsubaki. “I see.” approves her letter about poor sales and a possible demotion; “Are you sure?” prompts a rewrite so it sounds less like a request for money. Either works. Visit the customer again; he has the same two replies, and either advances the commission. For the suggested route, choose “Are you sure?” and then “I think she's being truthful.”</li>
      <li>Read the third letter at Tatsuya, speak to Tsubaki at Sake Nakanokura, then speak to the customer at Gion Inari Shrine. There are no choices this time.</li>
      <li>Read the final letter at Tatsuya for the perfume sachet scene and 1,500 EXP.</li>
    </ol>
    <p class="quest-source">Dialogue and completion checked against the English-patched game’s letter events.</p>
  </details>`,
};
const fingerprintedAsset = /^assets\/(?:fonts\/)?[\w-]+\.[0-9a-f]{16}\.(?:js|css|woff2)$|^assets\/guide-content\/[1-9]\d*\.js$|^assets\/(?:yujo-portraits|karuta-cards|kenzan-classic-ui|turtle-portraits|turtle-track)\/[a-z-]+\.[0-9a-f]{16}\.webp$|^assets\/(?:weapon-artwork|forging-material-artwork|turtle-foods|restaurant-artwork|inventory-reference)\/[a-z0-9_-]+\.[0-9a-f]{16}\.webp$|^assets\/(?:locker-key-photos\/[A-J]-[1-5](?:-[a-z]+)*|quest-step-photos\/[1-9]\d*-(?:[A-Z]|board)(?:-thumb)?|place-photos\/[a-z0-9-]+)\.[0-9a-f]{16}\.webp$/;

function read(directory, file) {
  return fs.readFileSync(path.join(directory, file), 'utf8');
}

function replaceRequired(html, pattern, replacement, label) {
  assert.match(html, pattern, `Missing ${label}`);
  return html.replace(pattern, replacement);
}

function copyWalkthroughs(local, previous, linkGuideMapText) {
  const byQuest = new Map();
  const guidebookPhoto = loadQuestStepPhoto(8, 'A');
  for (const [article, id] of previous.matchAll(questArticles)) {
    let walkthrough = article.match(publicWalkthrough)?.[0];
    assert(walkthrough?.includes('class="quest-walkthrough-steps"'), `Missing public walkthrough for quest ${id}`);
    assert(!byQuest.has(id), `Duplicate public walkthrough for quest ${id}`);
    walkthrough = publicWalkthroughOverrides[id] ?? walkthrough;
    if (id === '8' && guidebookPhoto) {
      const photo = `<div class="quest-walkthrough-photo">${renderPhotoPreview(guidebookPhoto, 'Gion Guidebook · Talk to the author')}</div>`;
      walkthrough = replaceRequired(walkthrough.replace(/<div class="quest-walkthrough-photo">[\s\S]*?<\/div>/, ''),
        /(<ol class="quest-walkthrough-steps">\s*<li>[\s\S]*?)(<\/li>)/,
        (_, step, close) => step + photo + close, 'first Gion Guidebook walkthrough step');
    }
    for (const [previous, corrected] of publicWalkthroughCorrections[id] ?? []) {
      walkthrough = walkthrough.replace(previous, corrected);
    }
    if (id === '99') {
      const text = walkthrough.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
      assert(!text.includes('In daylight at 11-2') && !text.includes('Return to Mountain Path in daylight.'),
        'Public quest99 retains a superseded clock instruction');
    }
    if (id === '38' || id === '78') {
      const correction = id === '38'
        ? 'Reward correction for this English-patched game: the successful answers grant Quartz and 1,000 XP. The imported walkthrough’s Lapis Lazuli label differs from the native item grant; its alternative-outcome reward has not been verified here.'
        : 'Native reward choices for this English-patched game: invest 5,000 mon for 1 ryō and Excellent Steel, or 1 ryō for 2 ryō and Celestial Steel. Choose “Trust Him” on the first return; taking the half refund ends the quest without steel. Either final “remember me?” answer gives the same reward, with 1,000 XP.';
      const note = `<p class="quest-source" data-native-reward-correction="${id}">${correction}</p>`;
      const previousNote = new RegExp(`<p class="quest-source" data-native-reward-correction="${id}">[\\s\\S]*?<\\/p>`);
      walkthrough = replaceRequired(walkthrough.replace(previousNote, ''), /<ol class="quest-walkthrough-steps">/,
        match => note + match, `native reward correction for quest ${id}`);
    }
    byQuest.set(id, linkGuideMapText(linkGuideItems(walkthrough)));
  }
  assert.equal(byQuest.size, 140, 'The Pages baseline must contain 140 public walkthroughs');

  const omittedAssets = new Set();
  const html = local.replace(questArticles, (article, id) => {
    const walkthrough = byQuest.get(id);
    assert(walkthrough, `Unknown or duplicate local quest ${id}`);
    byQuest.delete(id);
    return replaceRequired(article, localWalkthrough, (_markup, asset) => {
      omittedAssets.add(asset);
      return walkthrough;
    }, `local walkthrough for quest ${id}`);
  });
  assert.equal(byQuest.size, 0, 'Some public walkthroughs were not used');
  assert.equal(omittedAssets.size, 140, 'Unexpected local walkthrough assets');
  return { html, omittedAssets };
}

function addPublicHead(html, previous) {
  // Normalize generated whitespace before hashing inline scripts.
  html = html.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
  const previousHead = previous.match(/<head>([\s\S]*?)<\/head>/i)?.[1];
  assert(previousHead, 'Missing public page head');
  const title = previousHead.match(/<title>[\s\S]*?<\/title>/i)?.[0];
  assert(title, 'Missing public page title');
  const seo = [...previousHead.matchAll(/<meta\s+(?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>|<link\s+rel="canonical"[^>]*>/gi)]
    .map(([tag]) => tag);
  assert(seo.some(tag => tag.includes('rel="canonical"')) && seo.some(tag => tag.includes('name="description"')),
    'Missing public canonical or description');
  const scripts = [...html.matchAll(inlineScripts)].map(([, script]) =>
    `'sha256-${createHash('sha256').update(script.replace(/\r\n?/g, '\n')).digest('base64')}'`);
  const policy = [
    "default-src 'none'", "connect-src 'self' blob:", "base-uri 'none'", "form-action 'none'", "object-src 'none'",
    "worker-src 'self' blob:",
    "img-src 'self' data:", "font-src 'self'", "style-src 'self' 'unsafe-inline'", `script-src 'self' ${scripts.join(' ')}`,
  ].join('; ');
  const replacement = [title, ...seo, `<meta http-equiv="Content-Security-Policy" content="${policy}">`];
  return replaceRequired(html.replace(contentSecurity, ''), /<title>[\s\S]*?<\/title>/i,
    () => replacement.join('\n  '), 'local page title');
}

function writeFingerprint(generated, file, contents) {
  const data = Buffer.from(contents);
  const digest = createHash('sha256').update(data).digest('hex').slice(0, 16);
  const extension = path.posix.extname(file);
  const url = file.startsWith(assetPrefix)
    ? `${assetPrefix}${BigInt('0x' + digest) + 1n}.js`
    : `${file.slice(0, -extension.length)}.${digest}${extension}`;
  const existing = generated.get(url);
  assert(!existing || existing.equals(data), `Asset fingerprint collision at ${url}`);
  generated.set(url, data);
  return url;
}

function stageGuideAssets(html, omittedAssets, generated, stageMapPhotos) {
  return html.replace(raceWorkerAsset, (_attribute, url) =>
    `data-planner-worker="${writeFingerprint(generated, url, fs.readFileSync(path.join(__dirname, url)))}"`)
    .replace(deferredAssets, (_attribute, name, url) => {
      assert(!omittedAssets.has(url), `An offline walkthrough asset was referenced: ${url}`);
      const contents = fs.readFileSync(path.join(__dirname, url), 'utf8')
        .replace(karutaCardReferences, card => writeFingerprint(generated, card, fs.readFileSync(path.join(__dirname, card))));
      return `${name}="${writeFingerprint(generated, url, stageMapPhotos(contents))}"`;
    });
}

function sharedShell(html, sidebarCss, stylesheet, scripts = []) {
  const embedded = fontStyles();
  assert(html.includes(embedded) && html.includes(sidebarCss), 'Regenerate the local guide and map before staging the shared shell');
  const assets = [`<link rel="stylesheet" href="${stylesheet}">`,
    ...scripts.map(file => `<script defer src="${file}"></script>`)];
  return html.replace(embedded, '').replace(fontStyles({ headingsOnly: true }), '')
    .replace(sidebarCss, '').replace('<style>', assets.join('\n  ') + '\n  <style>');
}

function stageEntryPoints(guide, map, views, sources, scripts) {
  const sidebarCss = read(sources, 'atlas/sidebar.css');
  const stylesheet = views.stylesheet;
  assert.equal([...guide.matchAll(inlineScripts)].length, 0, 'Guide executable scripts must be external');
  assert.equal([...map.matchAll(inlineScripts)].length, 0, 'Map executable scripts must be external');
  for (const file of ['assets/guide-config.js', 'assets/guide-shell.js']) assert(guide.includes(`src="${file}"`), 'Missing external guide entry: ' + file);
  for (const file of ['assets/atlas-runtime.js', 'assets/atlas-standalone.js']) assert(map.includes(`src="${file}"`), 'Missing external map entry: ' + file);
  scripts.stage('assets/guide-config.js', {
    contents: `const kenzanViewAssets = ${JSON.stringify({ guide: views.guide, map: views.map })};\n`, rewrite: false,
  });
  const publicURLs = value => value.replaceAll(encodeURI(guideFile), 'index.html').replaceAll(encodeURI(mapFile), 'map.html');
  scripts.stage('assets/guide-shell.js', { contents: publicURLs(read(sources, 'assets/guide-shell.js')) });
  scripts.stage('assets/atlas-standalone.js', { contents: publicURLs(read(sources, 'assets/atlas-standalone.js')) });
  guide = scripts.rewriteTags(publicURLs(guide));
  map = scripts.rewriteTags(publicURLs(map));
  return {
    guide: sharedShell(guide, sidebarCss, stylesheet),
    map: sharedShell(map, sidebarCss, stylesheet),
  };
}

function within(child, directory) {
  const relative = path.relative(directory, child);
  return !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`);
}

function previousRelease(baseline, previousGuide) {
  if (fs.existsSync(path.join(baseline, manifestFile))) {
    const manifest = JSON.parse(read(baseline, manifestFile));
    assert(Array.isArray(manifest.assets) && manifest.assets.every(file => fingerprintedAsset.test(file)),
      'Invalid fingerprints in previous asset manifest');
    assert(/^assets\/guide-view\.[0-9a-f]{16}\.js$/.test(manifest.guideView)
      && manifest.assets.includes(manifest.guideView), 'Invalid guide view in previous asset manifest');
    return { walkthroughs: readView('guide', baseline, manifest.guideView).markup, retained: manifest.assets };
  }
  const exists = file => fs.existsSync(path.join(baseline, file));
  const walkthroughs = exists(viewPaths.guide) ? readView('guide', baseline).markup : previousGuide;
  const legacyFiles = [...Object.values(viewPaths), ...publicFontAssets.filter(file => file.endsWith('.woff2')),
    ...[...walkthroughs.matchAll(deferredAssets)].map(([, , asset]) => asset)];
  return { walkthroughs, retained: legacyFiles.filter(exists) };
}

function buildPages(stagingDirectory, baselineDirectory) {
  const baseline = fs.realpathSync(baselineDirectory);
  const source = fs.realpathSync(__dirname);
  const requestedStage = path.resolve(stagingDirectory);
  const stage = path.join(fs.realpathSync(path.dirname(requestedStage)), path.basename(requestedStage));
  const output = fs.existsSync(stage) ? fs.realpathSync(stage) : stage;
  assert(!within(output, baseline) && !within(output, source), 'Choose a separate staging directory');
  assert(!fs.existsSync(output) || fs.readdirSync(output).length === 0, 'Use an empty staging directory');

  const previousGuide = read(baseline, 'index.html');
  const publicSource = collectPublicSource(source);
  const previousMap = read(baseline, 'map.html');
  const localGuide = read(source, guideFile);
  const localMap = read(source, mapFile);
  assert.match(localGuide, contentSecurity, 'Run node build_guide.cjs to generate the current hardened guide');
  const guideView = readView('guide');
  assert(!/data-(?:preview|experimental)-themes/.test(guideView.markup), 'Build the guide without --all-tracker-themes for GitHub Pages');
  const atlasView = readView('map');
  const { walkthroughs, retained } = previousRelease(baseline, previousGuide);
  const { html: publicMarkup, omittedAssets } = copyWalkthroughs(guideView.markup, walkthroughs, createGuideMapLinker(atlasView.markup));
  const html = withGuideTargetRoutes(publicMarkup, loadGuideContentSources(publicMarkup, source));
  const generated = new Map();
  const scripts = createPublicScriptStager({ directory: source, generated, writeFingerprint });
  scripts.stage('assets/guide-search-worker.js');
  scripts.stage('assets/save-ps3-input.js');
  scripts.stage('assets/save-ps3-crypto.js');
  const guideSaveRuntime = scripts.stage('assets/guide-save-runtime.js');
  const atlasRuntime = scripts.stage('assets/atlas-runtime.js');
  const searchRecords = buildGuideSearchRecords(html, loadGuideContentSources(html, source), {
    weapons: require('./data/weapons/weapon-upgrades.json').weapons,
    recipes: require('./data/weapons/weapon-upgrades.json').recipes,
    stats: require('./data/weapons/weapon-stats.json').weapons,
    inventory: require('./data/inventory/inventory-reference.json').items,
  });
  const publicSearch = scripts.stage('assets/guide-search-data.js', { contents:
    'document.currentScript.receiveGuideSearch(' + JSON.stringify(searchRecords).replaceAll('<', '\\u003c') + ');\n' });
  const stageImage = file => writeFingerprint(generated, file, fs.readFileSync(path.join(source, file)));
  const stageMapPhotos = markup => markup.replace(mapPhotoReferences, stageImage)
    .replace(weaponArtworkReferences, stageImage);
  assert.match(html, /id="save-folder-choose"/, 'Expected folder sync controls in the guide');
  assert.match(guideView.script, /window\.mountKenzanSaveSync\(viewSignal, viewState, mountTurtleRacePlanner, \(snapshot, connection\) => \{ guideView\.updateWeaponSave\?\.\(snapshot\); guideView\.updateCraftingSave\?\.\(snapshot\); guideView\.updateTurtleFoodSave\?\.\(snapshot\); guideView\.updateQuestMilestones\?\.\(snapshot, connection\); \}\)/,
    'Expected validated folder sync in the guide');
  assert(guideView.script.includes('guideView.updateQuestMilestones = mountQuestMilestones(viewSignal, viewState);'),
    'Expected the shared quest milestone view');
  assert.match(html, /id="quest-milestones-data"/, 'Expected quest milestone definitions in the guide');
  const guideMarkup = stageMapPhotos(stageGuideAssets(html, omittedAssets, generated, stageMapPhotos))
    .replaceAll('assets/guide-search-data.js', publicSearch)
    .replaceAll(encodeURI(guideFile), 'index.html')
    .replace('<p class="overview-links">', '<p class="overview-links"><a href="map.html">Standalone Kenzan map</a>');
  const stagedAtlasMarkup = stageMapPhotos(atlasView.markup);
  const fonts = new Map(publicFontAssets.filter(file => file.endsWith('.woff2')).map(file =>
    [file, writeFingerprint(generated, file, fs.readFileSync(path.join(source, file)))]));
  const fontAssets = publicFontAssets.filter(file => !fonts.has(file));
  const guideHeadingFonts = fontStyles({ headingsOnly: true });
  assert(guideView.css.includes(guideHeadingFonts), 'Regenerate the local guide before staging heading fonts');
  const guideCss = guideView.css
    .replace(guideHeadingFonts, fontStyles({ headingsOnly: true, fontUrl: file => fonts.get(file) }))
    .replace(cssAssetReferences, (reference, file) => guideStyleImage.test(file)
      ? `url("${writeFingerprint(generated, file, fs.readFileSync(path.join(source, file)))}")`
      : reference);
  const views = {
    stylesheet: writeFingerprint(generated, 'assets/site.css',
      fontStyles({ fontUrl: file => path.posix.relative('assets', fonts.get(file)) }) + '\n'
      + fontStyles({ headingsOnly: true, fontUrl: file => path.posix.relative('assets', fonts.get(file)) })
      + '\n' + read(source, 'atlas/sidebar.css')),
    guide: { script: writeFingerprint(generated, viewPaths.guide,
      encodeView('guide', guideMarkup, guideCss, scripts.replaceURLs(guideView.script))), runtime: guideSaveRuntime },
    map: {
      script: writeFingerprint(generated, viewPaths.map,
        encodeView('map', stagedAtlasMarkup, atlasView.css,
          atlasView.script.replaceAll(encodeURI(guideFile), 'index.html'))),
      runtime: atlasRuntime,
    },
  };
  const { map, guide } = stageEntryPoints(localGuide, stageMapPhotos(localMap), views, source, scripts);
  assert(map.includes('href="index.html"'), 'Run node build_atlas.cjs to generate the current standalone map');
  const pages = new Map([
    ['index.html', addPublicHead(guide, previousGuide)],
    ['map.html', addPublicHead(map, previousMap)],
  ]);

  const baselineFiles = ['.nojekyll', 'sitemap.xml', 'assets/kenzan-readme-hero.png'];
  const verification = fs.readdirSync(baseline).filter(file => /^google[\da-f]+\.html$/.test(file));
  assert(verification.length, 'Missing public Google verification file');
  baselineFiles.push(...verification);
  const markupAssets = [...pages.values(), guideMarkup, atlasView.markup]
    .flatMap(page => [...page.matchAll(assetReferences)].map(([, asset]) => asset));
  const cssAssets = [guideCss, atlasView.css]
    .flatMap(css => [...css.matchAll(cssAssetReferences)].map(([, asset]) => asset));
  const pyramidAssets = [map, atlasView.markup].flatMap(markup => [...markup.matchAll(pyramidReferences)].map(([, asset]) => asset));
  // The ESM library resolves its worker relative to its own URL. Keep this
  // pinned set together with their canonical sibling filenames.
  const rendererAssets = new Set(atlasRendererAssetNames.map(name => 'assets/atlas-lib/' + name));
  const assets = new Set([...markupAssets, ...cssAssets, ...fontAssets, ...pyramidAssets,
    ...mapSceneAssets(map), ...mapSceneAssets(stagedAtlasMarkup), ...rendererAssets]);
  for (const asset of assets) {
    if (generated.has(asset)) continue;
    assert(supportedAsset.test(asset) || pyramidAsset.test(asset) || fontAssets.includes(asset) || rendererAssets.has(asset), `Unexpected public runtime asset: ${asset}`);
    assert(fs.statSync(path.join(source, asset)).isFile(), `Missing local asset: ${asset}`);
  }
  for (const file of baselineFiles) assert(fs.statSync(path.join(baseline, file)).isFile(), `Missing baseline file: ${file}`);

  // Validate final rewritten scene URLs against the actual generated graph and
  // real source-copy files, before any staging write. The view's image base is
  // its published document, not its fingerprinted JavaScript URL.
  const finalAtlasView = decodeView('map', generated.get(views.map.script).toString('utf8')).markup;
  const options = { rootURL: publicationRoot, baseURL: publicationRoot + 'map.html' };
  const manifest = { version: 1, assets: [...mapSceneDeclarations(map), ...mapSceneDeclarations(finalAtlasView),
    ...[...rendererAssets].map(url => ({ url, kind: 'local' }))] };
  const sourceManifest = { version: 1, assets: manifest.assets.filter(asset => asset.kind === 'local' && !generated.has(asset.url)) };
  validatePublicationDirectory(sourceManifest, source, options);
  const available = new Map(generated);
  for (const asset of sourceManifest.assets) available.set(asset.url, undefined);
  validatePublicationFiles(manifest, available, options);

  const write = (file, contents) => {
    const destination = path.join(output, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, contents);
  };
  write('README.md', read(source, 'content/README.public.md').replaceAll('{{VERSION}}', publicSource.version));
  for (const [file, body] of publicSource.files) write(file, body);
  for (const file of baselineFiles) write(file, fs.readFileSync(path.join(baseline, file)));
  for (const [file, page] of pages) write(file, page);
  const sitemapUrls = [...pages.values()].map(page => {
    const canonical = page.match(/<link rel="canonical" href="([^"]+)">/);
    assert(canonical, 'Missing canonical URL for text sitemap');
    return canonical[1];
  });
  write('sitemap.txt', sitemapUrls.join('\n') + '\n');
  for (const asset of assets) {
    if (!generated.has(asset)) write(asset, fs.readFileSync(path.join(source, asset)));
  }
  for (const [asset, data] of generated) write(asset, data);
  // Keep one release's files for documents already cached when a new release is staged.
  for (const asset of new Set(retained)) {
    if (!generated.has(asset)) write(asset, fs.readFileSync(path.join(baseline, asset)));
  }
  write(manifestFile, JSON.stringify({ guideView: views.guide.script, assets: [...generated.keys()].sort() }, null, 2) + '\n');
  console.log(`Staged GitHub Pages guide and map with ${generated.size} fingerprinted assets in ${output}`);
}

const [stagingDirectory, baselineDirectory, ...extra] = process.argv.slice(2);
assert(stagingDirectory && baselineDirectory && !extra.length,
  'Usage: node build_pages.cjs <empty-staging-directory> <previous-pages-checkout>');
buildPages(stagingDirectory, baselineDirectory);
