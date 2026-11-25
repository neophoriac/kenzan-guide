# Turtle racing simulation

These modules implement the guide's seeded race model. `race-planner-scenes.cjs`
is the browser worker entry point bundled by the guide build. Its dependencies
include the native tables in `data/turtles/` and the save turtle parser in
`src/tracker/`. `race-capture-start.cjs` remains part of this runtime because the
planner uses its scene-state decoding helpers.

The opening snapshots and motion curves are model inputs. Preserve their source
qualifications when changing sampling or presenting estimates. The research
history is in `docs/research/turtles/simulator-history.md`; capture and replay
tools are in `tools/turtles/`.

From the project root, run `node tools/turtles/verify-relocation.cjs --verify`
to compare the exported APIs and 18 fixed core/planner cases with their results
before the directory move. This verifies the relocation, not new native-race
accuracy.
