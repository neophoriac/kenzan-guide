const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scriptAsset = /^assets\/[\w-]+\.js$/;

/** One publication's executable-asset graph. Known literal dependencies are
 * rewritten before hashing their parent. No source code is evaluated. */
function createPublicScriptStager({ directory, generated, writeFingerprint }) {
  const urls = new Map();
  const replaceURLs = (source, entries = urls) => {
    let text = source;
    for (const [from, to] of entries) text = text.replaceAll(from, to);
    return text;
  };
  function stage(file, { contents, rewrite = true } = {}) {
    assert(scriptAsset.test(file), 'Unexpected executable asset: ' + file);
    assert(!urls.has(file), 'Duplicate executable asset: ' + file);
    const body = contents ?? fs.readFileSync(path.join(directory, file), 'utf8');
    const url = writeFingerprint(generated, file, rewrite ? replaceURLs(body) : body);
    urls.set(file, url);
    return url;
  }
  function rewriteTags(html) {
    return html.replace(/<script\b([^>]*\bsrc=")([^"]+)("[^>]*)><\/script>/g, (tag, start, file, end) => {
      assert(urls.has(file), 'Unstaged entry-point script: ' + file);
      return '<script' + start + urls.get(file) + end + '></script>';
    });
  }
  return { stage, replaceURLs, rewriteTags, url: file => urls.get(file) };
}

module.exports = { createPublicScriptStager };
