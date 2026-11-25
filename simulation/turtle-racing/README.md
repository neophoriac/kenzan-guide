# Turtle racing simulation

These modules implement the guide's seeded race model.
[`race-planner-scenes.cjs`](race-planner-scenes.cjs) is the planner entry module
bundled into the guide's browser worker. Its dependencies include the
[native turtle tables](../../data/turtles/turtle-native-data.json) and the
[save turtle parser](../../src/tracker/save-turtle-bucket.js).
[`race-capture-start.cjs`](race-capture-start.cjs) remains part of the runtime
because the planner uses its scene-state decoding helpers.

The [opening snapshots](race-planner-openings.json) and
[motion curves](race-planner-root-curves.json) are included model inputs.
Openings represent sampled shared-arena scenes; applying them to other courses
or lineups is a modelling assumption. Each trial generates rivals and samples
its active race seed independently of the opening's original random state.
Preserve these qualifications when changing sampling or presenting estimates.

The simulator's modules and input tables are included here. The guide's worker
bundle is already shipped with the website; building the full guide requires
the separate authoring inputs described in [SOURCE.md](../../SOURCE.md).
Private capture/replay tools, save fixtures and research notebooks are not
part of this repository.

Planner results are experimental estimates from simulated fields and
representative starting scenes. A matching replay of a recorded race does not
establish that the sampled win rates match every possible in-game race.
