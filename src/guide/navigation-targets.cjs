const { parseGuide } = require('./search-data.cjs');

// Record only the lazy containers needed to materialize a fragment. This is
// reference metadata, never save state or an eager copy of hidden guide text.
function guideTargetRoutes(markup, sources) {
  const routes = Object.create(null);
  function visit(node, route, seen) {
    if (typeof node === 'string') return;
    if (node.attrs.id && route.length && !routes[node.attrs.id]) routes[node.attrs.id] = route;
    for (const child of node.parts) visit(child, route, seen);
    for (const [attribute, kind] of [['data-lazy-details', 'details'], ['data-checklist-content', 'checklist']]) {
      const source = node.attrs[attribute];
      if (!source || seen.has(source) || !sources.has(source)) continue;
      const value = sources.get(source);
      const content = typeof value === 'string' ? value
        : Array.isArray(value) ? value.flat(Infinity).filter(item => typeof item === 'string').join('\n') : '';
      visit(parseGuide(content), [...route, { kind, source }], new Set([...seen, source]));
    }
  }
  visit(parseGuide(markup), [], new Set());
  return routes;
}

function withGuideTargetRoutes(markup, sources) {
  const clean = markup.replace(/<script type="application\/json" id="guide-target-routes">[\s\S]*?<\/script>/g, '');
  const routes = JSON.stringify(guideTargetRoutes(clean, sources)).replaceAll('<', '\\u003c');
  return `${clean}\n<script type="application/json" id="guide-target-routes">${routes}</script>`;
}

module.exports = { guideTargetRoutes, withGuideTargetRoutes };
