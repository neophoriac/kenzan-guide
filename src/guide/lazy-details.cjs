const { root: projectRoot } = require("../paths.cjs");
const fs = require('node:fs');
const path = require('node:path');

const contentDirectory = 'assets/guide-content';
let contentCount = 0;
const contentSources = new Map();

function writeGuideContent(content) {
  if (contentCount === 0) fs.mkdirSync(path.join(projectRoot, contentDirectory), { recursive: true });
  const url = `${contentDirectory}/${++contentCount}.js`;
  contentSources.set(url, content);
  const payload = JSON.stringify(content).replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  fs.writeFileSync(path.join(projectRoot, url), `document.currentScript.receiveGuideContent(${payload});\n`);
  return url;
}

function renderLazyDetails(className, summary, content) {
  return `<details class="${className}" data-lazy-details="${writeGuideContent(content)}">
    <summary>${summary}</summary>
  </details>`;
}

// Build-time consumers borrow these authored bodies; no browser content is read.
const getGuideContentSources = () => new Map(contentSources);

// A separate publication process reads the same data envelopes without
// executing their JavaScript. Follow nested disclosures once per URL.
function loadGuideContentSources(markup, directory = projectRoot) {
  const result = new Map();
  const pending = [markup];
  const urls = /\bdata-(?:lazy-details|checklist-content)="(assets\/guide-content\/[1-9]\d*\.js)"/g;
  while (pending.length) {
    const text = pending.pop();
    for (const [, url] of text.matchAll(urls)) {
      if (result.has(url)) continue;
      const envelope = fs.readFileSync(path.join(directory, url), 'utf8');
      const prefix = 'document.currentScript.receiveGuideContent(';
      if (!envelope.startsWith(prefix) || !envelope.trimEnd().endsWith(');')) throw new Error('Unexpected lazy content envelope: ' + url);
      const value = JSON.parse(envelope.trimEnd().slice(prefix.length, -2));
      result.set(url, value);
      pending.push(typeof value === 'string' ? value : Array.isArray(value) ? value.flat(Infinity).filter(item => typeof item === 'string').join('\n') : '');
    }
  }
  return result;
}

module.exports = { renderLazyDetails, writeGuideContent, getGuideContentSources, loadGuideContentSources };
