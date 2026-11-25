const fs = require('node:fs');
const path = require('node:path');
const { root: projectRoot } = require('../paths.cjs');

// Executable code belongs in cacheable external files. JSON islands remain data.
function writeExecutableAsset(url, source, directory = projectRoot) {
  if (!/^assets\/[\w/-]+\.js$/.test(url)) throw new Error('Unexpected script asset path: ' + url);
  const file = path.join(directory, url);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source.replace(/^\uFEFF/, '') + '\n');
  return url;
}

function scriptTag(url, { defer = true } = {}) {
  if (!/^assets\/[\w/-]+\.js$/.test(url)) throw new Error('Unexpected script asset path: ' + url);
  return `<script${defer ? ' defer' : ''} src="${url}"></script>`;
}

module.exports = { writeExecutableAsset, scriptTag };
