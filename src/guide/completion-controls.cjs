// Only authored completion controls are rewritten. IDs, inputs and native
// descriptions keep their exact data; the native checkbox remains the control.
function decorateCompletionControls(html) {
  return html.replace(/<label\b[^>]*class="[^"]*\bquest-check\b[^"]*"[^>]*>[\s\S]*?<\/label>/g, label => {
    let next = label.replace(/(>\s*)Done(\s*<\/span>\s*<\/label>|\s*<\/label>)/g, '$1Finished$2')
      .replace(/(aria-label="[^"]*) done"/g, '$1 finished"');
    const visible = next.replace(/<[^>]*>/g, '').trim();
    if (!visible && /\bdata-(?:collectible-collected|locker-key-collected)\b/.test(next)) {
      next = next.replace('</label>', '<span>Collected</span></label>');
    } else if (!visible && /\bdata-training-done\b/.test(next)) {
      next = next.replace('</label>', '<span>Finished</span></label>');
    } else if (!visible && /\bdata-(?:side|coliseum)-done\b/.test(next)) {
      const label = /aria-label="(Acquired|Collected|Opened|Learned)\b/.exec(next)?.[1]
        ?? (/data-side-done="weapon-/.test(next) ? 'Acquired' : 'Finished');
      next = next.replace('</label>', `<span>${label}</span></label>`);
    }
    return next;
  });
}
module.exports = { decorateCompletionControls };
