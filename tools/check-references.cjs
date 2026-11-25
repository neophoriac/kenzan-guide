#!/usr/bin/env node
'use strict';

// Public-package reference gate. No authoring-workspace modules are loaded.
// Markdown links use the document's directory. Inline path mentions may also
// use repository-root paths, as SOURCE.md and the import notes do. URL fragments
// are not heading-checked: this gate verifies the referenced file's existence.
// Code scanning covers literal imports, not computed imports or arbitrary fs IO.
const fs = require('node:fs');
const path = require('node:path');

const EXTERNAL_HOSTS = new Set([
  'src/activities/collectible-guide.cjs',
  'src/activities/locker-key-guide.cjs',
  'src/activities/training-guide.cjs',
  'src/weapons/weapon-tree.cjs',
]);
const PATCH_README = 'assets/atlas-lib/patches/raster-order/README.md';
const PATCH_EXTERNAL_INPUTS = new Set([
  'src/style/style.ts', 'src/style/pauseable_placement.ts',
  'upstream/', 'package.json', 'package-lock.json', 'node_modules/',
]);
const SOURCE_EXTENSIONS = new Set(['.js', '.cjs']);
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules']);
const FILE_EXTENSION = /\.(?:md|cjs|js|mjs|json|html|css|png|webp|jpe?g|svg|txt|ts|map|pfd|bin|elf|par|zip)$/i;
const asPosix = value => value.split(path.sep).join('/');
const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;
const isExternalURL = value => !/^[a-z]:[\\/]/i.test(value) && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
const isInside = (root, target) => {
  const relative = path.relative(root, target);
  return !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep);
};

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue; // The source exporter rejects links.
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory() && !SKIP_DIRECTORIES.has(entry.name)) files.push(...walk(filename));
    else if (entry.isFile()) files.push(filename);
  }
  return files.sort();
}

function maskFences(text) {
  let fence = null;
  return text.split(/(?<=\n)/).map(line => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    const masked = line.replace(/[^\r\n]/g, ' ');
    if (fence) {
      if (match && match[1][0] === fence.character && match[1].length >= fence.length &&
          /^\s*$/.test(line.slice(match[0].length))) fence = null;
      return masked;
    }
    if (!match) return line;
    fence = { character: match[1][0], length: match[1].length };
    return masked;
  }).join('');
}

function inlineCode(text) {
  const spans = [];
  const markers = /`+/g;
  let match;
  while ((match = markers.exec(text))) {
    const marker = match[0];
    const contentStart = markers.lastIndex;
    let closing;
    while ((closing = markers.exec(text)) && closing[0] !== marker) { /* Match the same delimiter length. */ }
    if (!closing) break;
    spans.push({ start: match.index, end: markers.lastIndex, value: text.slice(contentStart, closing.index) });
  }
  return spans;
}

function markdownLinks(text) {
  const links = [];
  // Reference-style definitions resolve exactly like ordinary inline links.
  const definitions = /^ {0,3}\[[^\]\n]+\]:[ \t]*(<[^>\n]*>|\S+)/gm;
  let match;
  while ((match = definitions.exec(text))) links.push({ offset: match.index, target: match[1] });
  for (let index = 0; index < text.length - 1; index += 1) {
    if (text[index] !== ']' || text[index + 1] !== '(' || text[index - 1] === '\\') continue;
    let cursor = index + 2;
    while (/\s/.test(text[cursor] || '') && cursor < text.length) cursor += 1;
    const start = cursor;
    if (text[cursor] === '<') {
      const end = text.indexOf('>', cursor + 1);
      if (end !== -1) links.push({ offset: index, target: text.slice(cursor, end + 1) });
      continue;
    }
    let depth = 0;
    while (cursor < text.length) {
      const character = text[cursor];
      if (character === '\\' && cursor + 1 < text.length) { cursor += 2; continue; }
      if (character === '(') depth += 1;
      if (character === ')') { if (!depth) break; depth -= 1; }
      if (/\s/.test(character) && depth === 0) break;
      cursor += 1;
    }
    if (cursor > start) links.push({ offset: index, target: text.slice(start, cursor) });
  }
  return links;
}

function cleanTarget(value) {
  let target = value.trim().replace(/^<|>$/g, '').replace(/\\([ ()\[\]#])/g, '$1')
    .replace(/&amp;/g, '&');
  target = target.split(/[?#]/, 1)[0];
  try { return decodeURIComponent(target); } catch { return target; }
}

function pathMention(value) {
  const target = value.replace(/\s*\n\s*/g, ' ').trim();
  if (!target || isExternalURL(target)) return [];
  // A real script path in an inline command is still checked. Shell flags,
  // package names and illustrative command syntax are not repository paths.
  if (/^(?:node|python3?|npm|npx|git)\s/.test(target)) {
    return (target.match(/"[^"]+"|'[^']+'|\S+/g) || []).slice(1)
      .map(token => token.replace(/^["']|["']$/g, ''))
      .filter(token => !token.startsWith('-') && (token.includes('/') || FILE_EXTENSION.test(token)));
  }
  if (target === 'VERSION' || FILE_EXTENSION.test(target) || target.endsWith('/') ||
      /^(?:\.\.?\/|src\/|data\/|maps\/|assets\/|simulation\/|tools\/|docs\/|atlas\/)/.test(target)) return [target];
  return [];
}

function inlineException(document, target) {
  // Exact user-input filenames and the documented save-slot naming pattern are
  // supplied by players, not promised source-package files.
  if (['USERDATA', 'PARAM.PFD', 'USERDATA/PARAM.PFD', 'savedata'].includes(target) ||
      /^BLJM60064-(?:LIST-<slot>|FIXED-)$/.test(target)) return 'player-supplied save input';
  // These identify original game resources; do not publish game binaries to
  // satisfy a provenance mention. Arbitrary .bin paths are not exempted.
  if (/^(?:bin|scenario|wdr_par)\//.test(target) ||
      ['kenzan_english.elf', 'wtfl_setting.bin'].includes(target)) return 'game-relative resource provenance';
  if (/[*?]/.test(target) || /(?:<hash>|\[hash\]|\{hash\}|\$\{[^}]+\})/.test(target)) {
    return 'explicit glob or generated-path placeholder';
  }
  if (document === 'SOURCE.md' && target === 'atlas/render.cjs') return 'documented external Atlas authoring helper';
  if (document === PATCH_README && PATCH_EXTERNAL_INPUTS.has(target)) return 'documented external SDK/dependency input';
  return null;
}

function decodeEscape(text, index) {
  const character = text[index];
  const simple = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0' };
  if (character === '\r' || character === '\n') return { value: '', end: index + (text[index + 1] === '\n' ? 2 : 1) };
  const unicode = text.slice(index).match(/^u\{([\da-f]+)\}|^u([\da-f]{4})|^x([\da-f]{2})/i);
  if (unicode) {
    const codepoint = parseInt(unicode[1] || unicode[2] || unicode[3], 16);
    return { value: codepoint <= 0x10ffff ? String.fromCodePoint(codepoint) : '', end: index + unicode[0].length };
  }
  return { value: simple[character] ?? character ?? '', end: index + 1 };
}

// A small lexer avoids treating imports quoted inside prose, comments, regular
// expressions or generated HTML as executable dependencies. Template expressions
// are scanned recursively; static template literals are literal import targets.
function javascriptTokens(text) {
  let cursor = 0;
  function scan(stopAtBrace = false) {
    const tokens = [];
    let braces = 0;
    const push = (type, value, offset) => tokens.push({ type, value, offset });
    while (cursor < text.length) {
      const character = text[cursor];
      const start = cursor;
      if (/\s/.test(character)) { cursor += 1; continue; }
      if (character === '/' && text[cursor + 1] === '/') {
        cursor = text.indexOf('\n', cursor + 2);
        if (cursor === -1) cursor = text.length;
        continue;
      }
      if (character === '/' && text[cursor + 1] === '*') {
        const end = text.indexOf('*/', cursor + 2);
        cursor = end === -1 ? text.length : end + 2;
        continue;
      }
      if (character === "'" || character === '"' || character === '`') {
        const quote = character;
        let value = '';
        let dynamic = false;
        cursor += 1;
        while (cursor < text.length && text[cursor] !== quote) {
          if (text[cursor] === '\\') {
            const escape = decodeEscape(text, cursor + 1);
            value += escape.value; cursor = escape.end;
          } else if (quote === '`' && text[cursor] === '$' && text[cursor + 1] === '{') {
            dynamic = true; cursor += 2; tokens.push(...scan(true));
          } else value += text[cursor++];
        }
        cursor += 1;
        if (!dynamic) push('string', value, start);
        continue;
      }
      const previous = tokens[tokens.length - 1];
      if (character === '/' && (!previous ||
          ['=', '(', '[', '{', ',', ':', ';', '!', '?', '&', '|', 'return', 'case', '=>'].includes(previous.value))) {
        // A regex character class may contain slashes, quotes and parentheses.
        let inClass = false;
        cursor += 1;
        while (cursor < text.length) {
          if (text[cursor] === '\\') { cursor += 2; continue; }
          if (text[cursor] === '[') inClass = true;
          if (text[cursor] === ']') inClass = false;
          if (text[cursor] === '/' && !inClass) { cursor += 1; break; }
          if (text[cursor] === '\n') break;
          cursor += 1;
        }
        while (/[a-z]/i.test(text[cursor] || '') && cursor < text.length) cursor += 1;
        push('regex', '', start);
        continue;
      }
      if (/[a-z_$]/i.test(character)) {
        cursor += 1;
        while (/[\w$]/.test(text[cursor] || '') && cursor < text.length) cursor += 1;
        push('identifier', text.slice(start, cursor), start);
        continue;
      }
      if (character === '}' && stopAtBrace && braces === 0) { cursor += 1; return tokens; }
      if (character === '{') braces += 1;
      if (character === '}') braces -= 1;
      if (character === '=' && text[cursor + 1] === '>') { push('punctuation', '=>', start); cursor += 2; }
      else { push('punctuation', character, start); cursor += 1; }
    }
    return tokens;
  }
  return scan();
}

function literalImports(text) {
  const tokens = javascriptTokens(text);
  const imports = [];
  const add = token => { if (token?.type === 'string' && /^\.\.?\//.test(token.value)) imports.push(token); };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'identifier' || tokens[index - 1]?.value === '.') continue;
    if (token.value === 'require' || token.value === 'import') {
      if (tokens[index + 1]?.value === '(') { add(tokens[index + 2]); continue; }
      if (token.value === 'import' && tokens[index + 1]?.type === 'string') { add(tokens[index + 1]); continue; }
    }
    if (token.value !== 'import' && token.value !== 'export') continue;
    for (let next = index + 1; next < Math.min(tokens.length, index + 200); next += 1) {
      if (tokens[next].value === ';') break;
      if (tokens[next].type === 'identifier' && tokens[next].value === 'from') { add(tokens[next + 1]); break; }
    }
  }
  return imports;
}

/** Check one fully staged public root. Returns findings; never prints or edits. */
function checkReferences(directory) {
  const root = path.resolve(directory);
  const result = { ok: true, root, checked: { markdown: 0, source: 0, links: 0, inlinePaths: 0, imports: 0 },
    externalImports: [], skipped: [], findings: [], errors: [] };
  const error = (file, line, kind, target, message) => {
    result.findings.push({ file, line, kind, target, message });
    result.errors.push(`${file}:${line} [${kind}] ${target}: ${message}`);
  };
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    error('.', 1, 'root', directory, 'Public root is not a directory.'); result.ok = false; return result;
  }
  const exists = target => isInside(root, target) && fs.existsSync(target);
  function checkPath(filename, text, offset, target, kind, rootFallback = false) {
    if (isExternalURL(target.trim().replace(/^<|>$/g, ''))) return;
    const cleaned = cleanTarget(target);
    const candidates = cleaned.startsWith('/') ? [path.resolve(root, '.' + cleaned)]
      : [path.resolve(path.dirname(filename), cleaned || path.basename(filename))];
    if (rootFallback && cleaned) candidates.push(path.resolve(root, cleaned));
    if (!candidates.some(exists)) error(asPosix(path.relative(root, filename)), lineAt(text, offset), kind,
      target, 'Referenced file or directory is not present in the public package.');
  }
  for (const filename of walk(root).filter(file => /\.md$/i.test(file))) {
    result.checked.markdown += 1;
    const text = fs.readFileSync(filename, 'utf8');
    const document = asPosix(path.relative(root, filename));
    const prose = maskFences(text);
    const code = inlineCode(prose);
    let linksOnly = prose;
    for (const span of [...code].reverse()) linksOnly = linksOnly.slice(0, span.start) +
      linksOnly.slice(span.start, span.end).replace(/[^\r\n]/g, ' ') + linksOnly.slice(span.end);
    for (const link of markdownLinks(linksOnly)) {
      result.checked.links += 1;
      checkPath(filename, text, link.offset, link.target, 'markdown-link');
    }
    // A code-formatted link label is display text, not a second path. Its real
    // Markdown destination is already checked above (for example [`name.js`]).
    for (const span of code.filter(item => !/^\](?:\(|\[)/.test(prose.slice(item.end)))) for (const target of pathMention(span.value)) {
      result.checked.inlinePaths += 1;
      const reason = inlineException(document, target);
      if (reason) result.skipped.push({ file: document, line: lineAt(text, span.start), target, reason });
      else checkPath(filename, text, span.start, target, 'markdown-path', true);
    }
  }
  // Vendor overlays deliberately lie outside these source roots: their SDK
  // imports belong to the separately documented upstream rebuild environment.
  for (const scope of ['src', 'simulation', 'tools']) for (const filename of walk(path.join(root, scope))) {
    if (!SOURCE_EXTENSIONS.has(path.extname(filename))) continue;
    result.checked.source += 1;
    const text = fs.readFileSync(filename, 'utf8');
    const file = asPosix(path.relative(root, filename));
    for (const dependency of literalImports(text)) {
      result.checked.imports += 1;
      const target = path.resolve(path.dirname(filename), dependency.value);
      const relativeTarget = asPosix(path.relative(root, target));
      const line = lineAt(text, dependency.offset);
      if (relativeTarget === 'atlas/render.cjs' && EXTERNAL_HOSTS.has(file)) {
        result.externalImports.push({ file, line, target: relativeTarget,
          present: exists(target), reason: 'Declared external Atlas authoring helper; see SOURCE.md.' });
        continue;
      }
      const candidates = [target, ...['.js', '.json', '.node', '.cjs'].map(suffix => target + suffix),
        ...['index.js', 'index.json', 'index.cjs'].map(name => path.join(target, name))];
      if (!candidates.some(candidate => exists(candidate) && fs.statSync(candidate).isFile())) {
        error(file, line, 'module-import', dependency.value, 'Literal relative dependency is not supplied.');
      }
    }
  }
  result.ok = result.errors.length === 0;
  return result;
}

module.exports = { checkReferences };
if (require.main === module) {
  const result = checkReferences(process.argv[2] || process.cwd());
  const counts = result.checked;
  console.log(`${result.ok ? 'PASS' : 'FAIL'} references: ${counts.markdown} Markdown documents, ${counts.source} source files, ` +
    `${counts.links} links, ${counts.inlinePaths} inline paths, ${counts.imports} relative imports.`);
  for (const item of result.externalImports) console.log(`EXTERNAL ${item.file}:${item.line} -> ${item.target} (documented authoring dependency)`);
  console.log(`${result.skipped.length} qualified input/provenance/placeholder mentions; ${result.errors.length} missing references.`);
  for (const error of result.errors.slice(0, 40)) console.error(error);
  if (result.errors.length > 40) console.error(`... ${result.errors.length - 40} further errors; use checkReferences(root).errors for the full list.`);
  process.exitCode = result.ok ? 0 : 1;
}
