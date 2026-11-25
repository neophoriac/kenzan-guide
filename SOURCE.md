# Reading the guide source

This repository includes a readable snapshot of the guide's maintained code
alongside the published website. Source files are copied byte for byte;
`public-source-manifest.json` records their paths, sizes and SHA-256 hashes.
`VERSION` identifies the guide release.

| Path | Responsibility |
| --- | --- |
| `src/guide/` | Navigation, search, browser storage, lazy content and release packaging |
| `src/tracker/` | Completion controls, themes, save readers and RPCS3/PS3 import |
| `src/map/` | Kenzan-specific map data preparation, references and guide links |
| `src/quests/` | Story availability, walkthrough controls and quest milestones |
| `src/weapons/` | Upgrade trees, recipes, ownership and comparisons |
| `src/inventory/` | Items, valuables and restaurant presentation |
| `src/turtles/` | Turtle cards, food and race-planner UI/worker integration |
| `src/activities/` | Training, Revelations, yūjo and other activities |
| `simulation/turtle-racing/` | The seeded race model and its scene inputs |
| `data/` | Reviewed reference tables consumed by the guide and simulator |
| `maps/data/`, `maps/reference/` | Reviewed map, pin and step catalogues consumed by the host adapter |
| `tools/check-references.cjs` | Checks repository documentation and internal module references |

Start with [the PS3 import sequence](docs/research/save-import-ps3.md) for a
worked example. File selection and ZIP validation belong to
[`save-ps3-input.js`](src/tracker/save-ps3-input.js), decryption belongs to
[`save-ps3-crypto.js`](src/tracker/save-ps3-crypto.js), and
[`save-sync.js`](src/tracker/save-sync.js) owns the shared preview, cancellation
and Apply flow.

## Build scope

The turtle simulator includes its module dependencies and model inputs. See
its [README](simulation/turtle-racing/README.md) for the entry point and limits.
Run `node tools/check-references.cjs` from the repository root to check local
documentation links, documented paths and literal internal module imports.

The rest of the source snapshot is intended for reading and review, rather than
a complete site rebuild. The separate authoring workspace supplies imported
walkthrough content, extraction tools and the shared Atlas build package.
Top-level site-build scripts are omitted because they require that workspace.

Four build-time host modules use the external Atlas rendering helper
`atlas/render.cjs`: `src/activities/collectible-guide.cjs`,
`src/activities/locker-key-guide.cjs`, `src/activities/training-guide.cjs` and
`src/weapons/weapon-tree.cjs`. That path is an
explicit dependency on the separate authoring package, not a file supplied by
this repository. It is the only permitted missing relative import in the
reference check. The browser loads the shipped assets instead of this helper.

Atlas is a separate shared map engine. The exact renderer shipped by this
guide is readable in the published [`assets/`](assets/) directory; the current
filename is listed in [`asset-manifest.json`](asset-manifest.json). Its library,
worker, licence and provenance are under [`assets/atlas-lib/`](assets/atlas-lib/).
The guide's map source contains the Kenzan host adapter. The shared Atlas source
tree and experimental renderer branches are outside this snapshot. The shipped
MapLibre library's [patch notes](assets/atlas-lib/patches/raster-order/README.md)
describe its included source overlays and the external tools needed to rebuild
that library patch.

Some paths in reference-table provenance fields identify original game resources,
such as item tables, motion files and the executable. These are game-relative
source identities, not promised repository files. Raw game binaries, private
capture recordings and save fixtures are not included.
Some stable inventory `id` and `sourceId` values retain the authoring record's
historical name, including its old path. These are opaque identifiers used to
join records, not file links; changing them would change record identity.

The published website can be served from a local HTTP server without rebuilding.
Use HTTPS or localhost for encrypted PS3 imports, which use native WebCrypto.

## Publication boundaries

Only the code directories, reviewed data files and named documentation selected by
[`public-source.cjs`](src/guide/public-source.cjs) enter the source snapshot.
The exporter rejects filesystem links and records every included file. The
snapshot excludes gameplay saves, console/account identifiers, game executables,
raw imported documents, emulator instances, recordings, dependency folders and
private research captures. It does not change the website's runtime asset list.

The existing guide-author, translation, SEGA and library attributions still
apply. Publishing this snapshot does not relicense third-party material.
