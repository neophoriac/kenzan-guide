// Bounded, read-only selection of a console save's USERDATA/PARAM.PFD pair.
// This module owns no DOM, file handles, progress state or decryption keys.
const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;
const MAX_ENTRIES = 32;
const MAX_USERDATA_BYTES = 80000;
const PFD_BYTES = 32768;
const SLOT_NAME = /^BLJM60064-(?:LIST-\d+|FIXED-)$/;
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function aborted(signal) {
  if (signal?.aborted) throw new DOMException('Save import was cancelled.', 'AbortError');
}

function invalid(message = 'This ZIP is incomplete or unsupported. Choose the extracted PS3 save folder instead.') {
  return new Error(message);
}

function checkedPath(name) {
  if (typeof name !== 'string' || !name || /[\\\x00-\x1f:]/.test(name) || name.startsWith('/')) {
    throw invalid('The save contains an unsafe file path. Choose the original PS3 save folder.');
  }
  const directory = name.endsWith('/');
  const parts = (directory ? name.slice(0, -1) : name).split('/');
  if (parts.some(part => !part || part === '.' || part === '..') || parts.length > 2) {
    throw invalid('Choose one PS3 save slot, not a parent folder containing several saves.');
  }
  if ((parts.length === 2 && !SLOT_NAME.test(parts[0]))
    || (directory && (parts.length !== 1 || !SLOT_NAME.test(parts[0])))) {
    throw invalid('Choose the original BLJM60064-LIST-… or BLJM60064-FIXED- save folder.');
  }
  return { name, directory, parts, folder: parts.length === 2 ? parts[0] : '' };
}

function pairFrom(entries, requireFolder) {
  const names = new Set();
  let totalBytes = 0;
  for (const entry of entries) {
    const key = entry.path.name.replace(/\/$/, '').toLowerCase();
    if (names.has(key)) throw invalid('The selection contains duplicate files. Choose just one PS3 save folder.');
    names.add(key);
    totalBytes += entry.size;
    if (!Number.isSafeInteger(entry.size) || entry.size < 0 || totalBytes > MAX_ARCHIVE_BYTES) {
      throw invalid('This selection is too large. Choose only one PS3 save folder, up to 8 MB.');
    }
  }
  const required = key => entries.filter(entry => !entry.path.directory
    && entry.path.parts.at(-1).toUpperCase() === key);
  const userdata = required('USERDATA');
  const pfd = required('PARAM.PFD');
  if (userdata.length > 1 || pfd.length > 1) {
    throw invalid('More than one save was found. Choose one save slot containing USERDATA and PARAM.PFD.');
  }
  if (!userdata.length || !pfd.length) {
    const missing = !userdata.length && !pfd.length ? 'USERDATA and PARAM.PFD'
      : !userdata.length ? 'USERDATA' : 'PARAM.PFD';
    throw invalid(`${missing} ${missing.includes(' and ') ? 'are' : 'is'} missing. Choose the whole PS3 save folder or its ZIP.`);
  }
  if (userdata[0].path.folder !== pfd[0].path.folder
    || (requireFolder && !userdata[0].path.folder)) {
    throw invalid('USERDATA and PARAM.PFD must come from the same PS3 save folder.');
  }
  const folder = userdata[0].path.folder;
  if (entries.some(entry => entry.path.directory ? entry.path.parts[0] !== folder : entry.path.folder !== folder)) {
    throw invalid('Choose just one PS3 save folder, without files from other folders.');
  }
  if (userdata[0].size < 16 || userdata[0].size > MAX_USERDATA_BYTES || pfd[0].size !== PFD_BYTES) {
    throw invalid('These files do not have the expected Kenzan save sizes. Choose an unmodified save folder.');
  }
  return { userdata: userdata[0], pfd: pfd[0], slot: userdata[0].path.folder || 'BLJM60064' };
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC_TABLE[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

async function readFile(file, signal) {
  aborted(signal);
  const bytes = new Uint8Array(await file.arrayBuffer());
  aborted(signal);
  if (bytes.byteLength !== file.size) throw invalid('The selected file could not be read completely. Select it again.');
  return bytes;
}

function extraFields(bytes) {
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 0; offset < bytes.length;) {
    if (offset + 4 > bytes.length) throw invalid();
    const id = data.getUint16(offset, true);
    const size = data.getUint16(offset + 2, true);
    if (id === 1 || offset + 4 + size > bytes.length) throw invalid('ZIP64 saves are unsupported. Choose the extracted save folder.');
    offset += 4 + size;
  }
}

function sameBytes(left, right) {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

function zipEntries(bytes) {
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
    if (data.getUint32(offset, true) === 0x06054b50
      && offset + 22 + data.getUint16(offset + 20, true) === bytes.length) {
      end = offset;
      break;
    }
  }
  if (end < 0) throw invalid();
  const count = data.getUint16(end + 10, true);
  const centralSize = data.getUint32(end + 12, true);
  const centralOffset = data.getUint32(end + 16, true);
  if (data.getUint16(end + 4, true) || data.getUint16(end + 6, true)
    || data.getUint16(end + 8, true) !== count || count === 0xffff
    || centralSize === 0xffffffff || centralOffset === 0xffffffff) throw invalid();
  if (!count || count > MAX_ENTRIES || centralOffset + centralSize !== end
    || centralSize < count * 46) throw invalid('Choose one PS3 save folder or its ZIP, with no more than 32 files.');
  const entries = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let cursor = centralOffset;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || data.getUint32(cursor, true) !== 0x02014b50) throw invalid();
    const version = data.getUint16(cursor + 6, true);
    const flags = data.getUint16(cursor + 8, true);
    const method = data.getUint16(cursor + 10, true);
    const crc = data.getUint32(cursor + 16, true);
    const packedSize = data.getUint32(cursor + 20, true);
    const size = data.getUint32(cursor + 24, true);
    const nameSize = data.getUint16(cursor + 28, true);
    const extraSize = data.getUint16(cursor + 30, true);
    const commentSize = data.getUint16(cursor + 32, true);
    const localOffset = data.getUint32(cursor + 42, true);
    const mode = data.getUint32(cursor + 38, true) >>> 16;
    const next = cursor + 46 + nameSize + extraSize + commentSize;
    if (next > end || version > 20 || data.getUint16(cursor + 34, true)
      || [packedSize, size, localOffset].includes(0xffffffff)) throw invalid();
    if (flags & ~0x080e || ![0, 8].includes(method) || (method === 0 && (flags & 6))) {
      throw invalid('Use an unencrypted ZIP with Store or Deflate compression, or choose the extracted save folder.');
    }
    if ((mode & 0xf000) === 0xa000) throw invalid('The save ZIP contains a file link. Choose the original save folder.');
    const rawName = bytes.subarray(cursor + 46, cursor + 46 + nameSize);
    let name;
    try { name = decoder.decode(rawName); } catch { throw invalid('The ZIP filenames could not be read. Choose the extracted save folder.'); }
    const entryPath = checkedPath(name);
    if (entryPath.directory && size !== 0) throw invalid();
    extraFields(bytes.subarray(cursor + 46 + nameSize, cursor + 46 + nameSize + extraSize));
    if (localOffset + 30 > centralOffset || data.getUint32(localOffset, true) !== 0x04034b50
      || data.getUint16(localOffset + 4, true) !== version
      || data.getUint16(localOffset + 6, true) !== flags
      || data.getUint16(localOffset + 8, true) !== method) throw invalid();
    const localNameSize = data.getUint16(localOffset + 26, true);
    const localExtraSize = data.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameSize + localExtraSize;
    const stop = start + packedSize;
    if (start > centralOffset || stop > centralOffset || !sameBytes(rawName,
      bytes.subarray(localOffset + 30, localOffset + 30 + localNameSize))) throw invalid();
    extraFields(bytes.subarray(localOffset + 30 + localNameSize, start));
    let rangeEnd = stop;
    if (flags & 8) {
      // Bit 3 permits local zeroes; the central directory supplies the sizes.
      for (const [offset, expected] of [[14, crc], [18, packedSize], [22, size]]) {
        const value = data.getUint32(localOffset + offset, true);
        if (value !== 0 && value !== expected) throw invalid();
      }
      const descriptorMatches = at => at + 12 <= centralOffset
        && data.getUint32(at, true) === crc && data.getUint32(at + 4, true) === packedSize
        && data.getUint32(at + 8, true) === size;
      if (stop + 4 <= centralOffset && data.getUint32(stop, true) === 0x08074b50 && descriptorMatches(stop + 4)) rangeEnd += 16;
      else if (descriptorMatches(stop)) rangeEnd += 12;
      else throw invalid();
    } else if (data.getUint32(localOffset + 14, true) !== crc
      || data.getUint32(localOffset + 18, true) !== packedSize
      || data.getUint32(localOffset + 22, true) !== size) throw invalid();
    if (method === 0 && packedSize !== size) throw invalid();
    entries.push({ path: entryPath, size, packedSize, crc, method, start, stop, rangeStart: localOffset, rangeEnd });
    cursor = next;
  }
  if (cursor !== end) throw invalid();
  const ranges = [...entries].sort((left, right) => left.rangeStart - right.rangeStart);
  if (ranges[0].rangeStart !== 0 || ranges.some((entry, index) => index && entry.rangeStart < ranges[index - 1].rangeEnd)) throw invalid();
  return entries;
}

async function unpack(entry, archive, signal) {
  aborted(signal);
  const packed = archive.subarray(entry.start, entry.stop);
  let bytes;
  if (entry.method === 0) bytes = packed.slice();
  else {
    let stream;
    try { stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw')); }
    catch { throw invalid('This browser cannot open compressed ZIP files. Choose the extracted PS3 save folder instead.'); }
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    const cancel = () => { reader.cancel().catch(() => {}); };
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      while (true) {
        aborted(signal);
        const { done, value } = await reader.read();
        aborted(signal);
        if (done) break;
        total += value.length;
        if (total > entry.size) { cancel(); throw invalid('The ZIP expands beyond its declared size. Choose the original save folder.'); }
        chunks.push(value);
      }
      bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    } catch (error) {
      if (signal?.aborted) aborted(signal);
      if (error instanceof Error && error.message.startsWith('The ZIP expands')) throw error;
      throw invalid('The ZIP could not be unpacked. Choose the extracted PS3 save folder.');
    } finally {
      signal?.removeEventListener('abort', cancel);
      reader.releaseLock();
    }
  }
  aborted(signal);
  if (bytes.length !== entry.size || crc32(bytes) !== entry.crc) {
    throw invalid('A required file in the ZIP is damaged. Copy the save from your PS3 again.');
  }
  return bytes;
}

/** Resolve only the two required files, without extracting or writing a ZIP.
 * Returned bytes are owned copies. Callers own cancellation and progress state.
 */
export async function readPS3SaveFiles(files, { signal } = {}) {
  aborted(signal);
  const selected = [];
  for (const file of files ?? []) {
    if (selected.length === MAX_ENTRIES) throw invalid('Choose one PS3 save slot, with no more than 32 files.');
    selected.push(file);
  }
  if (!selected.length) throw invalid('Choose a PS3 save folder or its ZIP.');
  if (selected.length === 1 && /\.zip$/i.test(selected[0].name)) {
    const file = selected[0];
    if (!Number.isSafeInteger(file.size) || file.size < 22 || file.size > MAX_ARCHIVE_BYTES) {
      throw invalid('Choose a ZIP containing one PS3 save folder, up to 8 MB.');
    }
    const archive = await readFile(file, signal);
    const pair = pairFrom(zipEntries(archive), false);
    const userdata = await unpack(pair.userdata, archive, signal);
    const pfd = await unpack(pair.pfd, archive, signal);
    return { userdata, pfd, slot: pair.slot };
  }
  const entries = selected.map(file => {
    const entryPath = checkedPath(file.webkitRelativePath || file.name);
    if (entryPath.directory || file.name !== entryPath.parts.at(-1)) throw invalid();
    return { path: entryPath, size: file.size, file };
  });
  const pair = pairFrom(entries, true);
  const userdata = await readFile(pair.userdata.file, signal);
  const pfd = await readFile(pair.pfd.file, signal);
  return { userdata, pfd, slot: pair.slot };
}
