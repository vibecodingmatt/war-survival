# Wildlife variety · v0.7.1

Small resident populations give each world an identity. Occasional visitors add
larger silhouettes with quiet intervals, and butterflies have two dedicated
settings rather than appearing throughout the campaign.

| World | Residents | Occasional visitor |
| --- | --- | --- |
| Ashen Crossing | Blue morphos, dragonflies | Macaws; a separate butterfly gathering |
| Ember Gate | Fireflies, bronze scarabs | Dusk swallows |
| Jade Cascades | Dragonflies, koi | Kingfishers |
| Frostglass Pass | Snow finches | White geese |
| Sunscar Oasis | Copper scarabs, oasis dragonflies | Hawks |
| Tempest Reach | Swallows | Ravens |
| Amber Sanctuary | Monarchs, songbirds | Cranes |
| Cinder Caldera | Ember beetles | Ravens |
| Lumen Wilds | Moon moths, fireflies | Bats |
| Sky Citadel | Swallows, cloud rays | Cranes |
| Coral Cathedral | Striped reef fish, rays | Mantas |
| Clockwork Gardens | Brass beetles, mechanical dragonflies | Brass birds |
| Moonlotus Marsh | Fireflies, dragonflies | Herons |
| Prismatic Rift | Crystal rays | Crystal-wing birds |
| Dragon Observatory | Star rays, fireflies | A celestial whale |

The first visitor arrives 5–13 visual seconds after entering a world. Visits last
11–15 seconds in 47-second scheduling windows; timing and formation vary per
window. Flocks have two to four members (at most two on Balanced); a whale travels
alone. Jungle gatherings add eight morphos (five on Balanced) for 14–18 seconds
in separate 67-second windows. Encounters use a dedicated cosmetic seed and never
consume simulation randomness. They are decorative and award no gameplay effects.

Models have merged, colored geometry: eyes and segmented bodies, wing veins,
curved surfaces, layered feathers, fish stripes, fin markings, and patterned
butterfly wings on both faces. Blue morphos use an iridescent physical material.
Birds alternate wing beats and glides; insects hover, fish cruise, rays undulate,
and the butterfly gathering rises in a spiral beside the waterfall.

Each species uses two instanced draws, for body and wings. At most three species
are resident or visiting in a world, so wildlife adds at most six batches; total
living-world detail stays within twelve batches. No wildlife lights, external
textures, or per-frame canvas uploads are introduced. The biome root owns the
meshes/materials and disposes them on a level change. Counts remain bounded while
visitors arrive and leave. Geometry detail is retained on Balanced, which reduces
resident and visitor counts and updates wildlife at 30 Hz. Reduced motion slows
wing animation, and pausing freezes the visual clock.

Run `npm test`, `npm run test:wildlife`, `npm run test:polish`, and
`npm run test:mobile`. Review images in `test-results/wildlife/` and the full visual
suite's resource/stress results. Chrome phone emulation is not physical-device
performance measurement.

## Validation recorded on 2026-09-08

All five unit test files passed, followed by the wildlife, polish and mobile
browser suites. Desktop and phone screenshots cover all 15 worlds, scheduled
visitors, the butterfly gathering and quiet intervals. Checks also cover paused
animation, bounded resources after revisiting worlds, eight touch layouts and a
mobile Level 15 victory.

Chrome phone emulation held 60 FPS during the four-power combat stress scenario
(16.8 ms frame p95). A separate butterfly gathering with the same combat effects
held 60 FPS (16.7 ms p95, 223 draws). These are desktop-host emulation measurements.
Detailed logs and screenshots are in ignored `test-results/wildlife/` and
`test-results/polish/`. The gameplay logic was unchanged; combat-module diffs
only update browser import queries to v0.7.1.
