# Importing saves exported from a PS3

The PS3 importer accepts one `BLJM60064-LIST-<slot>` or `BLJM60064-FIXED-`
folder containing `USERDATA` and `PARAM.PFD`, or a Store/Deflate ZIP containing
that pair. A ZIP may contain the pair directly or inside one named save slot.
It does not monitor a selected folder. Inputs are read only, processed locally
and never uploaded. Neither the original save nor its account/console identity
is modified. Personal snapshots keep the existing tab-only lifetime.

## Import sequence

`PARAM.PFD` is partly encrypted. Its readable index locates the file records;
the record for `USERDATA` contains its wrapped encryption key and integrity
check. The guide follows this sequence:

1. **Admit the input.** Read one selected folder or ZIP, check archive paths,
   counts and sizes, and select one matching `USERDATA`/`PARAM.PFD` pair.
2. **Check for readable game data.** If `USERDATA` already has the complete
   supported Kenzan header, pass it to the existing parser. This path skips
   decryption and PFD cryptographic checks.
3. **Read the PFD structure.** Check the `PFDB` identifier, version 3 or 4,
   bounded table counts and offsets. Find one `USERDATA` record and read its
   logical size, 64-byte wrapped-key field and 20-byte ciphertext HMAC.
4. **Prepare the verification key.** Expand the known 16-byte Kenzan secure-file
   ID into the format's 20-byte HMAC key using its fixed insertion pattern.
   This identifier is a game constant; no personal console/account ID is used.
5. **Verify encrypted USERDATA.** Calculate HMAC-SHA1 over the ciphertext and
   compare it with the stored value. A mismatch stops the import. This check
   covers the encrypted file, not the entire PFD or console/account ownership.
6. **Unwrap the file key inside the PFD.** AES-128-CBC decrypts the record's
   64-byte wrapped-key field using the known PS3 manager key. Its IV—the
   operation's starting value—is the first 16 bytes of the derived HMAC key.
   The first 16 decoded bytes become USERDATA's AES key.
7. **Decrypt USERDATA.** For each 16-byte block, starting at index zero, combine
   its AES-decrypted bytes with the AES-encrypted block counter using XOR:

   ```text
   P[i] = AES-decrypt(K, C[i]) XOR AES-encrypt(K, BE64(i) || zero64)
   ```

   Here `K` is the recovered file key, `C[i]` the encrypted block, and `P[i]`
   the readable block. The counter stores the index as a big-endian 64-bit
   number followed by eight zero bytes. Trim alignment bytes to the verified
   logical length: a system save may occupy 832 encrypted bytes for 828 logical
   bytes. Gameplay data occupies 79,696 bytes.
8. **Read and preview progress.** Validate the complete plaintext header again,
   run the established save reader, and show its progress preview. The shared
   Apply action adds recognised completion marks while keeping existing marks.
   Original files are never written.

The import generation and AbortController span both manual import paths. A new
selection or disposed view cancels earlier work before it can replace the
current preview or snapshot.

## Separate global PFD-header verification

A full PFD verifier also handles an encrypted 64-byte authentication block at
`0x20–0x5f`. AES-128-CBC decrypts it with the PS3 manager key and the 16-byte IV
stored at PFD offset `0x10`. Decoded block bytes 40–59 supply a separate key for
the PFD's table HMACs: version 3 uses it directly; version 4 derives the working
key with HMAC-SHA1 and the format's key-generation constant. Recalculating and
comparing the table hashes is a further verification operation.

This global table key is distinct from the game-derived USERDATA HMAC key and
USERDATA's AES file key. Decrypting the global header alone does not authenticate
the whole PFD. The guide reads the plaintext file index and unwraps USERDATA's
own key; it does not decrypt that global authentication block, verify every PFD
table, re-sign the save or change its ownership.

## Responsibilities

- `src/tracker/save-ps3-input.js` admits bounded files/archive metadata, selects
  exactly one pair, and returns owned bytes. It reads no unrelated picture/SFO
  contents and writes nothing. ZIP entry counts, ranges, paths, compression,
  descriptors and required-file CRCs are checked before use; decompression is
  streamed with an output bound. Limits: 8 MiB archive/declared contents,
  32 entries, 80,000-byte USERDATA maximum and a 32,768-byte PFD.
- `src/tracker/save-ps3-crypto.js` owns only one decode call's intermediates.
  It bounds PFD v3/v4 tables and big-endian integers, finds the USERDATA entry,
  verifies its stored ciphertext HMAC and decodes its protected contents.
  Gameplay data is 79,696 logical bytes; the 828-byte system data occupies
  832 encrypted bytes. It does not parse game progress or persist anything.
- `src/tracker/save-sync.js` owns one generation/AbortController shared by
  RPCS3 and PS3 manual imports. A newer read or view disposal invalidates prior
  work. The existing full-header validator and save parser admit decoded bytes;
  an already-readable save skips decryption. Existing personal snapshot and
  story-follow behavior remains; completion still waits for Apply checkmarks.
- The authoring pipeline writes two separate ESM assets. They load only when a
  PS3 import is requested. Release staging fingerprints both before rewriting
  the save runtime's literal URLs, preserving nested deployment paths.

## Browser crypto and limits

The implementation is independently authored JavaScript using the documented
PS3 savedata format and native WebCrypto primitives. It does not ship the
private diagnostic or downloaded Apollo C source. Relevant format constants
and operations are corroborated against these pinned primary sources:

- [Apollo PS3 savedata-format implementation](https://github.com/bucanero/apollo-patcher/blob/cffe90ced76eb2c0562c053ab17ae125ada447a1/core/ps3/pfd_savedata.c),
  derived from flatz's pfdtool; upstream code is GPL-3.0.
- [Apollo title secure-file ID database](https://github.com/bucanero/apollo-patches/blob/21701270f5161c0d44b14252498725fe013754c5/PS3/games.conf),
  explicitly listing BLJM60064.
- [Apollo savedata documentation](https://github.com/bucanero/apollo-patcher/blob/cffe90ced76eb2c0562c053ab17ae125ada447a1/docs/internals/savedata.md).

WebCrypto CBC supplies padding automatically. The decoder appends a genuine
padding ciphertext block before decrypting raw CBC data, then undoes CBC's
predecessor XOR where ECB is required. PS3 counter masks use independent
single-block encryptions with the counter in the first 64 bits. At most 64
native requests run together; batches yield and check cancellation.

Native WebCrypto requires a secure context. HTTPS, localhost and supported
local-file contexts can provide it; ordinary LAN HTTP such as the phone test
server cannot. That case shows an HTTPS/localhost recovery, while plaintext
RPCS3 imports remain available. Compressed ZIPs require DecompressionStream's
deflate-raw support; extracted-folder selection is the recovery when absent.

USERDATA's HMAC, decoded full game header and parser are admission checks.
The HMAC check applies to encrypted imports; an already-readable USERDATA uses
the established plaintext header/parser path without checking PFD integrity.
This is not a full PARAM.PFD signature or console/account-identity validator.
A failed read cannot apply checkmarks or replace a previous successful snapshot.

## Evidence

Validation compared an independent Node reference decoder with the browser's
native WebCrypto decoder. Focused checks also covered malformed archives,
missing or mismatched files, cancellation and the plaintext-import path.
The original save was kept unchanged. Private saves, account data and their
test fixtures are excluded from this repository; these notes describe the
implementation and its limits without requiring access to those fixtures.
