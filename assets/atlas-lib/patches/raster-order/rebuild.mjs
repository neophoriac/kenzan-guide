// Source-only, reproducible patch recipe. Deployment remains a separate action.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const usage = 'node rebuild.mjs --prepared-root <SDK/dependency directory> --output-dir <separate build directory>';
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log(usage);
  process.exit(0);
}
const options = new Map();
for (let index = 0; index < args.length; index += 2) {
  const key = args[index];
  assert(['--prepared-root', '--output-dir'].includes(key) && args[index + 1] && !options.has(key), usage);
  options.set(key, args[index + 1]);
}
assert.equal(options.size, 2, usage);
const prepared = fs.realpathSync(path.resolve(options.get('--prepared-root')));
const upstream = fs.realpathSync(path.join(prepared, 'upstream'));
// Resolve existing ancestors too, so an output symlink cannot point into inputs.
function resolvedDestination(value) {
  let current = path.resolve(value);
  const suffix = [];
  while (!fs.existsSync(current)) {
    suffix.unshift(path.basename(current));
    const parent = path.dirname(current);
    assert.notEqual(parent, current, 'No existing output ancestor');
    current = parent;
  }
  return path.join(fs.realpathSync(current), ...suffix);
}
function within(value, directory) {
  const relative = path.relative(directory, value);
  return !relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
const output = resolvedDestination(options.get('--output-dir'));
assert(!within(output, prepared) && !within(output, here),
  'Use a dedicated output directory outside the prepared inputs and patch package');
const metadataBytes = fs.readFileSync(path.join(here, 'provenance.json'));
const metadata = JSON.parse(metadataBytes);
assert.equal(metadata.schemaVersion, 1);
assert.equal(metadata.upstream.version, '6.19.0');
assert.equal(metadata.sources.length, 2, 'Only the reviewed two-file overlay is supported');
assert.equal(metadata.build.rebuildScript.file, 'rebuild.mjs');
assert.equal(sha(fs.readFileSync(path.join(here, 'rebuild.mjs'))), metadata.build.rebuildScript.sha256,
  'Portable rebuild script differs from its reviewed metadata');
const officialHash = name => {
  const record = metadata.expectedOfficialArtifacts.find(file => file.file === name);
  assert(record, 'Missing immutable official artifact metadata: ' + name);
  return record.sha256;
};
assert.equal(sha(fs.readFileSync(path.join(prepared, 'package-lock.json'))), metadata.build.dependencyLockSha256);
assert.equal(sha(fs.readFileSync(path.join(upstream, 'tsconfig.json'))), metadata.build.tsconfigSha256);
assert.equal(sha(fs.readFileSync(path.join(upstream, 'package.json'))), officialHash('package.json'));
assert.equal(JSON.parse(fs.readFileSync(path.join(upstream, 'package.json'), 'utf8')).version, metadata.upstream.version);
assert.equal(sha(fs.readFileSync(path.join(upstream, 'LICENSE.txt'))), officialHash('LICENSE.txt'));
assert.equal(sha(fs.readFileSync(path.join(here, 'LICENSE.txt'))), officialHash('LICENSE.txt'));
assert.equal(sha(fs.readFileSync(path.join(here, metadata.patch.file))), metadata.patch.sha256);
const permitted = new Set(['src/style/style.ts', 'src/style/pauseable_placement.ts']);
const overlays = new Map(metadata.sources.map(record => {
  assert(permitted.delete(record.source), 'Unexpected or repeated source overlay');
  const original = path.join(upstream, record.source);
  assert.equal(sha(fs.readFileSync(original)), record.officialSha256);
  const overlay = path.resolve(here, record.overlay);
  assert(within(overlay, here), 'Overlay outside patch package');
  const source = fs.readFileSync(overlay, 'utf8');
  assert.equal(sha(source), record.patchedSha256);
  return [path.normalize(original), source];
}));
assert.equal(permitted.size, 0);
const requirePrepared = createRequire(path.join(prepared, 'package.json'));
const compiler = requirePrepared.resolve('rolldown');
assert(within(compiler, path.join(prepared, 'node_modules')), 'Compiler must come from the explicit prepared dependencies');
const compilerMetadata = JSON.parse(fs.readFileSync(path.join(prepared, 'node_modules/rolldown/package.json'), 'utf8'));
assert.equal(compilerMetadata.version, metadata.build.rolldownVersion);
const {rolldown} = await import(pathToFileURL(compiler).href);
const report = {
  patchId: metadata.patchId,
  created: new Date().toISOString(),
  nodeVersion: process.version,
  preparedRoot: prepared,
  outputDirectory: output,
  metadataSha256: sha(metadataBytes),
  dependencyLockSha256: metadata.build.dependencyLockSha256,
  rolldownVersion: compilerMetadata.version,
  modes: [],
};
const banner = '/**\n * MapLibre GL JS\n * @license 3-Clause BSD. Full text of license: https://github.com/maplibre/maplibre-gl-js/blob/v6.19.0/LICENSE.txt\n */';
for (const mode of ['original', 'patched', 'confirm']) {
  const directory = path.join(output, mode);
  fs.mkdirSync(directory, {recursive: true});
  const used = new Set();
  const entries = mode === 'confirm'
    ? [['maplibre-gl', 'src/index.ts']]
    : [['maplibre-gl', 'src/index.ts'], ['maplibre-gl-worker', 'src/source/worker.ts']];
  for (const [name, entry] of entries) {
    const bundle = await rolldown({
      input: {[name]: path.join(upstream, entry)},
      platform: 'browser',
      treeshake: true,
      tsconfig: path.join(upstream, 'tsconfig.json'),
      plugins: mode === 'original' ? [] : [{
        name: 'atlas-reviewed-raster-order-patch',
        load(id) {
          const key = path.normalize(id);
          if (!overlays.has(key)) return null;
          used.add(key);
          return {code: overlays.get(key)};
        },
      }],
    });
    try {
      await bundle.write({dir: directory, format: 'es', sourcemap: true, banner,
        minify: true, entryFileNames: '[name].mjs'});
    } finally {
      await bundle.close();
    }
    const expected = mode === 'original' ? officialHash(name + '.mjs')
      : name === 'maplibre-gl' ? metadata.patch.expectedMainSha256 : metadata.patch.expectedWorkerSha256;
    assert.equal(sha(fs.readFileSync(path.join(directory, name + '.mjs'))), expected,
      'Rebuilt artifact differs from immutable metadata: ' + mode + '/' + name);
  }
  if (mode !== 'original') {
    assert.equal(used.size, 2, 'Both reviewed overlays must be consumed');
    const map = JSON.parse(fs.readFileSync(path.join(directory, 'maplibre-gl.mjs.map'), 'utf8'));
    for (const record of metadata.sources) {
      const index = map.sources.findIndex(source => source.replaceAll('\\', '/').endsWith(record.source));
      assert(index >= 0, 'Missing patched source-map entry: ' + record.source);
      assert.equal(sha(map.sourcesContent[index]), record.patchedSha256);
    }
  }
  fs.copyFileSync(path.join(here, 'LICENSE.txt'), path.join(directory, 'LICENSE.txt'));
  assert.equal(sha(fs.readFileSync(path.join(directory, 'LICENSE.txt'))), officialHash('LICENSE.txt'));
  report.modes.push({mode, files: fs.readdirSync(directory).map(name => {
    const bytes = fs.readFileSync(path.join(directory, name));
    return {name, bytes: bytes.length, sha256: sha(bytes)};
  })});
}
assert.equal(metadata.patch.expectedWorkerSha256, officialHash('maplibre-gl-worker.mjs'));
for (const record of metadata.sources) {
  assert.equal(sha(fs.readFileSync(path.join(upstream, record.source))), record.officialSha256);
}
Object.assign(report, {officialBaselineReproduced: true, patchedMainReproduced: true,
  workerUnchanged: true, upstreamSourcesPreserved: true});
fs.writeFileSync(path.join(output, 'rebuild-receipt.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({outputDirectory: output, officialBaselineReproduced: true,
  patchedMainReproduced: true, workerUnchanged: true, mainSha256: metadata.patch.expectedMainSha256}));
