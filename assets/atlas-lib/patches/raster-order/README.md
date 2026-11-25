# Raster-only placement-order patch

This package contains the source recipe for the reviewed patch used by Atlas’s
published MapLibre GL JS 6.19.0 main module. The worker, CSS, license and upstream
package metadata remain unchanged. The [active provenance](../../provenance.json)
identifies the shipped artifacts; the [recipe provenance](provenance.json)
records the exact source inputs, expected outputs and historical evidence hashes.

## Package contents

| File | Purpose |
| --- | --- |
| [README.md](README.md) | Scope, external inputs and reproduction limits |
| [provenance.json](provenance.json) | Immutable input/output hashes and historical evidence |
| [rebuild.mjs](rebuild.mjs) | Guarded rebuild recipe |
| [raster-order-placement.patch](raster-order-placement.patch) | Two-file change for human review |
| [overlays/style.ts](overlays/style.ts) | Exact reviewed Style module |
| [overlays/pauseable_placement.ts](overlays/pauseable_placement.ts) | Exact reviewed placement module |
| [LICENSE.txt](LICENSE.txt) | Upstream BSD attribution and license |

## What changes

Raster add/remove/move operations can retain a stable symbol-only placement
cursor. Other structural layer mutations keep the original sticky restart
behavior. Ordered native layer-reference checks catch same-ID replacement,
and the new traversal/placement pair is published after construction succeeds.
Camera, collision, opacity, worker and tile policies remain unchanged.

Rebuilding uses a source loader at each original upstream module ID; the
prepared upstream files stay unchanged. Paths such as `src/style/style.ts` in
the provenance identify files in the upstream SDK source tree, not files at the
root of this guide repository.

## Inputs

The prepared SDK/dependency directory is an **external prerequisite**. It is
not included in this package or the guide repository. Provide it explicitly;
it must contain:

- `upstream/`: the immutable official 6.19.0 source tree, entry points, generated
  source, package metadata, exact release tsconfig and license;
- `package.json` and `package-lock.json` for the reviewed build dependencies;
- `node_modules/` with those dependencies, including Rolldown 1.3.2.

Keep that directory structure when relocating the prepared environment.
Standard package resolution then reaches the reviewed dependencies from the
SDK source. Nothing is installed automatically or globally. The known build
used Node 24.18.0. Exact output hashes remain the final reproduction guard.

The exact dependency-lock, source and configuration hashes are recorded in the
recipe provenance. A fresh dependency install or an arbitrary checkout of the
same release is not established to satisfy those hashes. This package does not
provide an automatic preparation or dependency-installation tool. No absolute
workspace path is baked into the recipe.

## Rebuild

With that matching external environment prepared, run the included recipe from
any working directory and provide both arguments:

    node "<patch directory>/rebuild.mjs" --prepared-root "<prepared SDK/dependency directory>" --output-dir "<separate output directory>"

The output directory must be outside both the patch package and prepared
inputs. Use a dedicated build directory. The recipe writes:

- original/: rebuilt official main, worker, source maps and original license;
- patched/: patched main, unchanged worker, source maps and original license;
- confirm/: a second patched main build and source map, plus the license;
- rebuild-receipt.json: paths, tool identity, input binding and output hashes.

The recipe first checks the immutable source, tsconfig, package, license,
dependency-lock, rebuild-script, patch and overlay hashes. Its own executable
hash is bound in `build.rebuildScript`; changing that script requires a reviewed
recipe revision. It reproduces the official main and
worker, checks the patched main against the accepted ca41cf61… hash, verifies
that the worker remains byte-identical, then reproduces the patched main again.
Both patched source-map entries must contain the exact reviewed overlay text.
Source-map paths can change when inputs move; JavaScript output bytes and
sourcesContent hashes must still match.

Expected original and patched hashes are stored directly in the recipe provenance.
The recipe never reads the active Atlas vendor directory, so it still works
after that directory’s main module is patched. It also does not copy anything
into the active vendor directory, update product provenance or publish files.
CSS and upstream package metadata are outside the changed artifact set.

## Evidence and limits

The accepted isolated candidate passes 69/69 tests for both original and
patched variants, including real native classes and a small glyph/collision/
duplicate fixture. Its clean baseline matches the official distribution;
the patched main reproduces and the worker stays official.

The historical portable-rebuild check also reproduced the official baseline,
patched main, repeated patched main and unchanged worker. Its receipt hashes
are retained for provenance; the private receipts are not included or required
at rebuild time. This documentation update did not rerun that rebuild or the
69-check native gate. Those focused checks are not a TypeScript typecheck,
a general WebGL restoration test or proof of ordinary-motion performance.

If a guard fails, keep the inputs and output for inspection. Do not change an
expected hash merely to accept a different compiler, source revision or patch.
Review the difference and issue a separately validated revision instead.
