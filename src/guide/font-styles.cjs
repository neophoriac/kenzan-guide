const { root: projectRoot } = require("../paths.cjs");
const fs = require('node:fs');
const path = require('node:path');

const fontPath = 'assets/fonts/';
const fontDirectory = path.join(projectRoot, fontPath);

const bodyFonts = [
  { family: 'Source Sans 3', file: 'SourceSans3VF-Upright.woff2', weight: '200 900', license: 'SourceSans3-OFL.txt' },
  { family: 'Source Sans 3', file: 'SourceSans3VF-Italic.woff2', weight: '200 900', style: 'italic', license: 'SourceSans3-OFL.txt' },
];
const guideFonts = [
  { family: 'Instrument Serif', file: 'InstrumentSerif-Regular.woff2', weight: '400', license: 'InstrumentSerif-OFL.txt' },
  { family: 'BIZ UDMincho', file: 'BIZUDMincho-Regular-Latin.woff2', weight: '400', license: 'BIZUDMincho-OFL.txt' },
];
const workbench = { family: 'Workbench', file: 'Workbench-Regular.woff2', weight: '400', license: 'Workbench-OFL.txt' };

function fontFace({ family, file, weight, style = 'normal' }, fontUrl) {
  // Embedded fonts work when these pages are opened directly from disk.
  const source = fontUrl ? fontUrl(fontPath + file)
    : 'data:font/woff2;base64,' + fs.readFileSync(path.join(fontDirectory, file)).toString('base64');
  return `@font-face {
  font-family: '${family}';
  src: url('${source}') format('woff2');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`;
}

function licenseNotice(file) {
  const license = fs.readFileSync(path.join(fontDirectory, file), 'utf8').trimEnd();
  return `/*\n${license}\n*/`;
}

function fontStyles({ headingsOnly = false, allTrackerThemes = false, fontUrl } = {}) {
  const fonts = headingsOnly ? [...guideFonts, ...(allTrackerThemes ? [workbench] : [])] : bodyFonts;
  const includedLicenses = new Set();
  return fonts.flatMap(font => {
    const face = fontFace(font, fontUrl);
    if (fontUrl || includedLicenses.has(font.license)) return [face];
    includedLicenses.add(font.license);
    return [licenseNotice(font.license), face];
  }).join('\n');
}

const publicFontAssets = [...new Set([...bodyFonts, ...guideFonts]
  .flatMap(({ file, license }) => [fontPath + file, fontPath + license]))];

module.exports = { fontStyles, publicFontAssets };
