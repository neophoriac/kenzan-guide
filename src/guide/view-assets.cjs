const { root: projectRoot } = require("../paths.cjs");
const fs = require('node:fs');
const path = require('node:path');

const viewPaths = { guide: 'assets/guide-view.js', map: 'assets/atlas-view.js' };
const mountPrefix = 'kenzanViews.register(...';
const previousPrefix = 'kenzanViews.mount(...';
const initializer = ', (viewSignal, viewState) => {';
const initializerEnd = '\n});\n';

function encodeView(view, markup, css, script) {
  const data = JSON.stringify([view, markup, css]).replaceAll('<', '\\u003c');
  return `${mountPrefix}${data}${initializer}\n${script}${initializerEnd}`;
}

function writeView(view, markup, css, script) {
  fs.writeFileSync(path.join(projectRoot, viewPaths[view]), encodeView(view, markup, css, script));
}

function readView(view, directory = projectRoot, file = viewPaths[view]) {
  return decodeView(view, fs.readFileSync(path.join(directory, file), 'utf8'));
}

function decodeView(view, contents) {
  const source = contents.replace(/\r\n/g, '\n');
  const end = source.indexOf('\n');
  const current = source.startsWith(mountPrefix);
  const [name, markup, css] = JSON.parse(source.slice(
    (current ? mountPrefix : previousPrefix).length,
    end - (current ? initializer.length : 2),
  ));
  if (name !== view) throw new Error(`Unexpected view asset for ${view}`);
  return { markup, css, script: source.slice(end + 1, current ? -initializerEnd.length : undefined) };
}

module.exports = { encodeView, readView, writeView, viewPaths, decodeView };
