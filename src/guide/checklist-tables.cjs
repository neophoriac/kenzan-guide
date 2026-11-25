const assert = require('node:assert/strict');
const { writeGuideContent } = require('./lazy-details.cjs');

// Keep just the cells needed to register goals and apply filters at startup.
function deferChecklistTables(html) {
  return html.replace(/<tbody>([\s\S]*?)<\/tbody>/g, (_, body) => {
    const content = [];
    const rows = body.replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g, (_, attributes, cells) => {
      const retained = [];
      const deferred = [];
      let pending = '';
      const remainder = cells.replace(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/g, (cell, tag, cellAttributes, copy) => {
        const notes = copy.indexOf('<p class="quest-window-note" data-training-continuation');
        const keep = tag === 'th' || /\bdata-checklist-live\b/.test(cellAttributes) || /<input\b|\bdata-training-ability\b/.test(copy);
        if (!keep && notes < 0) {
          assert(!/\bid=/.test(cell), 'A deferred cell contains a link target');
          pending += cell;
        } else {
          if (pending) deferred.push([retained.length, pending]);
          pending = '';
          if (notes >= 0) {
            deferred.push([retained.length, copy.slice(0, notes), true]);
            retained.push(`<td${cellAttributes}><div data-checklist-copy></div>${copy.slice(notes)}</td>`);
          } else {
            retained.push(cell);
          }
        }
        return '';
      });
      assert(!remainder.trim(), 'Expected only cells inside a checklist row');
      if (pending) deferred.push([retained.length, pending]);
      content.push(deferred);
      return `<tr${attributes}>${retained.join('')}</tr>`;
    });
    assert(content.length && !body.replace(/<tr\b[^>]*>[\s\S]*?<\/tr>/g, '').trim(),
      'Expected only rows inside a checklist table body');
    return `<tbody data-checklist-content="${writeGuideContent(content)}">${rows}</tbody>`;
  });
}

module.exports = { deferChecklistTables };
