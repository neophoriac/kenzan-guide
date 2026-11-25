// Read-only, independently authored PS3 savedata-format decoder. Format and
// constants: Apollo/pfdtool; pinned references and fixture results are recorded
// in docs/research/save-import-ps3.md. No console/account identity is needed.
const TITLE_FILE_ID = '908aa7013f9b2d0088e1cb98159101d2';
const MANAGER_KEY = 'd413b89663e1fe9f75143d3bb4565274';
const PFD_SIZE = 32768;
const SAVE_SIZES = new Set([0x13750, 0x33c]);
const invalidMetadata = () => new Error('PARAM.PFD is not supported or is damaged. Choose the complete Kenzan save folder again.');
const mismatch = () => new Error('USERDATA and PARAM.PFD do not match, or the save is damaged. Export both files from the same PS3 save and try again.');
const bytes = hex => Uint8Array.from(hex.match(/../g), value => parseInt(value, 16));
function check(signal) {
  if (signal?.aborted) throw signal.reason ?? new DOMException('Save import cancelled.', 'AbortError');
}

// PFD fields are big-endian u64 values. Bound them before converting to Number
// or deriving offsets; a hostile value must never control a large allocation.
function metadata(pfd, encryptedLength) {
  if (!(pfd instanceof Uint8Array) || pfd.length !== PFD_SIZE) throw invalidMetadata();
  const view = new DataView(pfd.buffer, pfd.byteOffset, pfd.byteLength);
  const integer = (offset, maximum) => {
    if (offset < 0 || offset + 8 > pfd.length) throw invalidMetadata();
    const value = view.getBigUint64(offset);
    if (value > BigInt(maximum)) throw invalidMetadata();
    return Number(value);
  };
  if (view.getBigUint64(0) !== 0x50464442n || ![3n, 4n].includes(view.getBigUint64(8))) throw invalidMetadata();
  const capacity = integer(96, 4096);
  const reserved = integer(104, 8192);
  const used = integer(112, reserved);
  const start = 120 + capacity * 8;
  if (!capacity || !used || start + reserved * 272 + capacity * 20 > pfd.length) throw invalidMetadata();
  let entry;
  for (let index = 0; index < used; index++) {
    const offset = start + index * 272;
    const nameBytes = pfd.subarray(offset + 8, offset + 73);
    const end = nameBytes.indexOf(0);
    if (end < 0) throw invalidMetadata();
    const name = String.fromCharCode(...nameBytes.subarray(0, end));
    if (name.toUpperCase() !== 'USERDATA') continue;
    if (name !== 'USERDATA' || entry) throw invalidMetadata();
    const size = integer(offset + 264, 0x13750);
    if (!SAVE_SIZES.has(size) || Math.ceil(size / 16) * 16 !== encryptedLength) throw mismatch();
    entry = { size, wrappedKey: pfd.slice(offset + 80, offset + 144), signature: pfd.slice(offset + 144, offset + 164) };
  }
  if (!entry) throw invalidMetadata();
  return entry;
}

// WebCrypto CBC includes PKCS#7 padding. Append a genuine padding block made
// with the last original ciphertext as IV, so decrypt can safely remove only
// that new block and return the original raw, unpadded CBC bytes.
async function decryptCBC(subtle, key, iv, ciphertext, signal) {
  check(signal);
  const tail = new Uint8Array(await subtle.encrypt({ name: 'AES-CBC', iv: ciphertext.slice(-16) }, key, new Uint8Array()));
  check(signal);
  const padded = new Uint8Array(ciphertext.length + 16);
  padded.set(ciphertext);
  padded.set(tail, ciphertext.length);
  const result = new Uint8Array(await subtle.decrypt({ name: 'AES-CBC', iv }, key, padded));
  check(signal);
  if (result.length !== ciphertext.length) throw invalidMetadata();
  return result;
}

/** Decode one protected USERDATA; callers still admit the full plaintext game
 * header with the established save parser. Inputs are borrowed read-only;
 * output is newly owned. All keys/intermediate buffers live in this call.
 * Neither source files nor browser persistence are written. */
export async function decryptPS3Save({ userdata, pfd }, { signal } = {}) {
  check(signal);
  if (!(userdata instanceof Uint8Array) || userdata.length > 80000 || !userdata.length) throw mismatch();
  const entry = metadata(pfd, userdata.length);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('PS3 save decryption needs a secure page. Open the guide over HTTPS or on localhost, then try again.');
  const fileId = bytes(TITLE_FILE_ID);
  const hashKey = new Uint8Array(20);
  const inserted = new Map([[1, 11], [2, 15], [5, 14], [8, 10]]);
  for (let i = 0, j = 0; i < hashKey.length; i++) hashKey[i] = inserted.has(i) ? inserted.get(i) : fileId[j++];
  const hmac = await subtle.importKey('raw', hashKey, { name: 'HMAC', hash: 'SHA-1' }, false, ['verify']);
  check(signal);
  const matches = await subtle.verify('HMAC', hmac, entry.signature, userdata);
  check(signal);
  if (!matches) throw mismatch();
  const manager = await subtle.importKey('raw', bytes(MANAGER_KEY), 'AES-CBC', false, ['encrypt', 'decrypt']);
  check(signal);
  const unwrapped = await decryptCBC(subtle, manager, hashKey.slice(0, 16), entry.wrappedKey, signal);
  const key = await subtle.importKey('raw', unwrapped.slice(0, 16), 'AES-CBC', false, ['encrypt', 'decrypt']);
  check(signal);
  const plain = await decryptCBC(subtle, key, new Uint8Array(16), userdata, signal);
  // Undo CBC's predecessor XOR to obtain raw AES-ECB decryption. Walk backwards
  // because the source ciphertext is borrowed and must remain unchanged.
  for (let offset = plain.length - 16; offset >= 16; offset -= 16) {
    for (let byte = 0; byte < 16; byte++) plain[offset + byte] ^= userdata[offset - 16 + byte];
  }
  // The PS3's counter occupies the first 64 bits, unlike WebCrypto AES-CTR's
  // low-bit counter. Independent single-block CBC encryptions supply its mask.
  // Keep at most 64 native requests alive and yield between batches so another
  // selection or view disposal can cancel without an unbounded task queue.
  const blocks = plain.length / 16;
  for (let first = 0; first < blocks; first += 64) {
    check(signal);
    const count = Math.min(64, blocks - first);
    const masks = await Promise.all(Array.from({ length: count }, async (_, index) => {
      const counter = new Uint8Array(16);
      new DataView(counter.buffer).setBigUint64(0, BigInt(first + index));
      return new Uint8Array(await subtle.encrypt({ name: 'AES-CBC', iv: new Uint8Array(16) }, key, counter));
    }));
    check(signal);
    for (let index = 0; index < count; index++) {
      const offset = (first + index) * 16;
      for (let byte = 0; byte < 16; byte++) plain[offset + byte] ^= masks[index][byte];
    }
    if (first + count < blocks) await new Promise(resolve => setTimeout(resolve, 0));
  }
  check(signal);
  return plain.slice(0, entry.size);
}
