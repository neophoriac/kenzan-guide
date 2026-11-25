'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const directories = [
  { name: 'src', extensions: new Set(['.js', '.cjs', '.css']) },
  { name: 'simulation/turtle-racing', extensions: new Set(['.cjs', '.json', '.md']) },
];
const documents = ['VERSION', 'SOURCE.md', 'build_guide.cjs', 'build_atlas.cjs', 'build_pages.cjs',
  'content/README.public.md', 'docs/research/save-import-ps3.md'];
const privateText = /(?:[A-Za-z]:[\\/]Users[\\/]|[A-Za-z]:[\\/]Emulators[\\/]|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{30,})/;

/** Prepare the readable source release. The builder owns writes; this owner
 * returns exact source bytes and their manifest without changing originals.
 * Runtime assets and private authoring/research inputs have separate scopes. */
function collectPublicSource(directory) {
  const root = fs.realpathSync(directory);
  const files = new Map();
  function include(name) {
    const file = path.join(root, name);
    assert(fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink(), 'Unexpected source file: ' + name);
    const relative = path.relative(root, fs.realpathSync(file));
    assert(!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), 'Source file escaped root: ' + name);
    const body = fs.readFileSync(file);
    assert(body.length < 2 * 1024 * 1024 && !body.includes(0), 'Unexpected binary/oversized source: ' + name);
    assert(!privateText.test(body.toString('utf8')), 'Private material in source: ' + name);
    assert(!files.has(name), 'Duplicate public source: ' + name);
    files.set(name, body);
  }
  function walk(name, extensions) {
    const folder = path.join(root, name);
    assert(!fs.lstatSync(folder).isSymbolicLink(), 'Source directory link: ' + name);
    for (const entry of fs.readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = name + '/' + entry.name;
      assert(!entry.name.startsWith('.') && !entry.isSymbolicLink(), 'Unexpected hidden/link source: ' + child);
      if (entry.isDirectory()) walk(child, extensions);
      else {
        assert(extensions.has(path.extname(entry.name)), 'Unexpected source extension: ' + child);
        include(child);
      }
    }
  }
  directories.forEach(({ name, extensions }) => walk(name, extensions));
  documents.forEach(include);
  const version = files.get('VERSION').toString('utf8').trim();
  assert(/^\d+\.\d+\.\d+$/.test(version), 'Expected a three-part guide version');
  const records = [...files].map(([file, body]) => ({ file, bytes: body.length,
    sha256: createHash('sha256').update(body).digest('hex') })).sort((a, b) => a.file.localeCompare(b.file));
  files.set('public-source-manifest.json', Buffer.from(JSON.stringify({ version, scope: 'readable-guide-source', files: records }, null, 2) + '\n'));
  return { version, files };
}

module.exports = { collectPublicSource };
