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
| `build_guide.cjs`, `build_atlas.cjs`, `build_pages.cjs` | Local guide/map generation and public-release staging |

Start with [the PS3 import sequence](docs/research/save-import-ps3.md) for a
worked example. File selection and ZIP validation belong to
[`save-ps3-input.js`](src/tracker/save-ps3-input.js), decryption belongs to
[`save-ps3-crypto.js`](src/tracker/save-ps3-crypto.js), and
[`save-sync.js`](src/tracker/save-sync.js) owns the shared preview, cancellation
and Apply flow.

## Build scope

This snapshot is intended for reading and review. The full authoring workspace
also contains reviewed content inputs, extracted reference tables, authored map
catalogues, the shared Atlas project and extraction tools. Those inputs and
their preparation are required to run the build entry points; this snapshot
does not provide a self-contained rebuild of the site.

Atlas is a separate shared map engine. The exact renderer shipped by this
guide is readable in the published [`assets/`](assets/) directory; the current
filename is listed in [`asset-manifest.json`](asset-manifest.json). Its library,
worker, licence and provenance are under [`assets/atlas-lib/`](assets/atlas-lib/).
The guide's `src/map/` files contain the Kenzan host adapter, not the shared
Atlas source tree. Independent Atlas development and experimental renderer
branches are outside this snapshot.

The published website can be served from a local HTTP server without rebuilding.
Use HTTPS or localhost for encrypted PS3 imports, which use native WebCrypto.

## Publication boundaries

Only the code directories and named documentation files selected by
[`public-source.cjs`](src/guide/public-source.cjs) enter the source snapshot.
The exporter rejects filesystem links and records every included file. The
snapshot excludes gameplay saves, console/account identifiers, game executables,
raw imported documents, emulator instances, recordings, dependency folders and
private research captures. It does not change the website's runtime asset list.

The existing guide-author, translation, SEGA and library attributions still
apply. Publishing this snapshot does not relicense third-party material.
