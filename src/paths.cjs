const path = require('node:path');

// Filesystem roots only. Browser asset URLs remain relative to the guide page.
const root = path.resolve(__dirname, '..');
module.exports = { root, maps: path.join(root, 'maps'), workspace: path.resolve(root, '../..') };
