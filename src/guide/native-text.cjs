// Native descriptions are plain text, not trusted HTML. Only the game's
// numeric Color commands are presentation; everything else stays escaped.
const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function nativeTextSegments(value) {
  const text = String(value ?? '');
  const segments = [];
  let color;
  let start = 0;
  for (const match of text.matchAll(/<Color:(Default|\d{1,3}(?:,\d{1,3}){3})>/gi)) {
    const channels = match[1].toLowerCase() === 'default' ? undefined : match[1].split(',').map(Number);
    // An unknown or malformed command is ordinary text. Never partially admit
    // its value as CSS, and never lose the words surrounding it.
    if (channels?.some(channel => channel > 255)) continue;
    if (match.index > start) segments.push({ text: text.slice(start, match.index), color });
    color = channels;
    start = match.index + match[0].length;
  }
  if (start < text.length) segments.push({ text: text.slice(start), color });
  return segments;
}

function plainNativeText(value) {
  return nativeTextSegments(value).map(segment => segment.text).join('');
}

function luminance(channels) {
  const linear = channels.map(value => {
    const component = value / 255;
    return component <= .04045 ? component / 12.92 : ((component + .055) / 1.055) ** 2.4;
  });
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}

function nativeColorGround([red, green, blue, alpha]) {
  // Keep the requested native RGB intact. A quiet backplate makes pale game
  // lettering readable on paper and dark lettering readable in Kenzan Classic.
  const opacity = alpha / 255;
  const contrastOn = ground => {
    const painted = [red, green, blue].map((channel, index) => channel * opacity + ground[index] * (1 - opacity));
    const first = luminance(painted), second = luminance(ground);
    return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
  };
  return contrastOn([37, 40, 32]) >= contrastOn([251, 248, 242]) ? 'dark' : 'light';
}

function formatNativeText(value) {
  return nativeTextSegments(value).map(({ text, color }) => {
    const escaped = escape(text);
    if (!color) return escaped;
    const [red, green, blue, alpha] = color;
    const css = `rgb(${red} ${green} ${blue}${alpha === 255 ? '' : ' / ' + alpha / 255})`;
    return `<span class="native-text-color" data-native-color-ground="${nativeColorGround(color)}" style="color:${css}">${escaped}</span>`;
  }).join('');
}

module.exports = { formatNativeText, plainNativeText };
