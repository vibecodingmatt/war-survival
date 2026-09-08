# Living Worlds & Toybox Arsenal · v0.7.1

This guide is the entry point for continuing the visual/combat work without the
original conversation. The release adds detail to all fifteen sectors, five random
ammo modifiers, two major rifts, comic battle reactions and mobile optimizations.
All art here is procedural Three.js geometry or canvas UI; no additional downloads
or generated raster assets were introduced.

## File map

| File | Responsibility |
| --- | --- |
| `data/campaign.js` | Fifteen palettes, landmarks, guardians and ten weapon routes |
| `data/powers.js` | Seven major rifts, names, icons and durations |
| `data/munitions.js` | Ammo/support specs, 13-entry supply bag, projectile styles |
| `js/core/simulation.js` | Fixed-step combat, target reservations, collision, resets |
| `js/core/encounters.js` | Exclusive rifts, duck strike zones and tank swept collisions |
| `js/core/munitions.js` | Supply draws, one ammo slot, volleys and ricochet damage |
| `js/core/geometry.js` | Indexed rigid-part merge; bakes offsets before instancing |
| `js/core/quality.js` | Cosmetic-only adaptive resolution with hysteresis |
| `js/world/environment.js` | Shared bridge, lighting, water, terrain and graphics setting |
| `js/world/ambience.js` | Active sector ownership, scenery cleanup, weather updates |
| `js/world/living-worlds.js` | Gardens, portrait landmarks, wildlife integration, ribbons and shafts |
| `data/wildlife.js` | Biome populations and analytical visitor schedules |
| `js/world/wildlife.js` | Bounded resident groups, occasional visitors and butterfly gatherings |
| `js/world/wildlife-models.js` | Colored animal geometry, curved wings, markings and feather layers |
| `js/world/wonderlands.js` | Original five expansion worlds and articulated dragon |
| `js/entities/army.js` | Material/joint batches, gait, recoil, slips and celebrations |
| `js/entities/bosses.js` | Guardian models, attacks, stagger and collapse animation |
| `js/systems/projectiles.js` | Tracers, shards, shells, rockets, fire and capped trails |
| `js/systems/comedy.js` | Duck bounce, wind-up tanks, helmets, casings, dizzy stars, finales |
| `js/systems/spectacle.js` | Shared lightning/trail batches, pulses, shards and power visuals |
| `js/systems/effects.js` | Particles, smoke, warning zones, quality forwarding |
| `js/main.js` | Input, UI, pause, adaptive setting and test-only browser hooks |

## Scenery

Each sector's `THEMES` entry contributes three named details to `world().details`.
The existing landmarks remain; nearby focal objects make themed scenery visible
in portrait. Gardens are instanced onto textured ledges. Orbit/stream/spiral/mistbow
ribbons share a draw and animate in a shader. Two soft light-shaft planes suggest
volume without a postprocessing pass or additional lights. Wildlife is instanced,
with separate body and wing batches; its travel remains outside the firing lanes.
v0.7.1 removes the shared triangle-wing swarm, the extra sixteen Clockwork
butterflies, and the seven static bird outlines. See [wildlife details](wildlife.md).

| Sectors | Added motifs |
| --- | --- |
| Ashen / Jade | Morphos, dragonflies, koi, macaws/kingfishers and waterfall rainbows |
| Ember / Amber | Fireflies, scarabs, monarchs, songbirds and swallows/cranes |
| Frostglass / Tempest | Snow finches/geese, swallows/ravens, halo arcs and vortices |
| Sunscar / Cinder | Scarabs, dragonflies, hawks/ravens, molten seams and lava fountains |
| Lumen / Moonlotus | Moon moths, fireflies, bats/herons and lotus terraces |
| Sky Citadel / Prismatic | Swallows, cloud/crystal rays and passing cranes/crystal birds |
| Coral | Striped reef fish, rays, manta visitors and caustic shafts |
| Clockwork | Brass beetles, glass-wing dragonflies, brass birds and escapement rings |
| Observatory | Star rays, fireflies, rare celestial whales and nearby astrolabes |

`ambience` owns and disposes biome geometry/materials when a sector changes. Bundled
stone textures and the shared cloud texture are borrowed, not disposed by a sector.
Do not attach a material whose vertex shader needs `instanceMatrix` to a plain Mesh.

## Ammo and major powers

Pods from sector 3 use their own seeded shuffled bag. The four original support
rewards appear twice and each of the five ammo types once per 13 draws. The golden
Rainbow Rush pod is therefore a one-in-thirteen bag entry, not a guaranteed roll
at any particular time. Replays use new seeds. The Overdrive opening remains fixed.

| Ammo | Firing behavior | Duration |
| --- | --- | --- |
| Fanfare | Three fan rounds, each at 46% damage; seeks left/right neighbors | 9s |
| Double Helix | Two corkscrewing rounds, each at 70% damage, slightly faster | 9s |
| Pinball | Four additional nearest-neighbor ricochets at 48% damage | 9s |
| Boom Box | 2.4× damage sonic shells, 1.55× firing interval, minimum radius 3 | 9s |
| Rainbow Rush | Multicolor rounds at 82% damage and 0.34× firing interval | 7s |

Collecting ammo replaces the previous ammo; support pickups preserve it. Overdrive
stacks, with a minimum firing interval of 75ms per soldier. Ammo only changes enemy
combat volleys. Recruit, armory, pod and rift shots retain a single ordinary round.
Projectiles snapshot their ammo at firing time, so rounds already in flight finish
normally when a modifier expires. The equipped permanent gun is never mutated.

Quack Attack lasts eight seconds: an enormous rubber duck falls onto a visible
friendly impact zone every 2.2 seconds, honks, squashes, and bounces away. Its
radius is 5.2 and damage is `760 + zeroBasedSector * 32`. Infantry tumble and flatten.
Toy Tanks lasts ten seconds: three wind-up tanks charge the lanes every 2.65 seconds.
Each tank hits an enemy once per run for `250 + zeroBasedSector * 18` damage (80% for
bosses); large boss hitboxes can span adjacent tank lanes. Swept forward collision
prevents a tank from jumping over a target. Tanks expire after 2.8 seconds or when
their buff expires. Both powers use ordinary earned rift choices.

Every third recurring choice offers two powers. Other regular choices offer
reinforcements/shield versus a power; the existing Power Duel opening is retained.
The seven-entry power bag has no adjacent repeated draws, including refill edges.

## Battle reactions

Occasional helmets and brass casings bounce on the bridge, electrocuted enemies
jitter, frozen defeats slide, and surviving knocked-down soldiers get dizzy stars.
Weapon unlocks and wave clears trigger small squad celebrations. These are cosmetic;
they do not change hitboxes, casualties or the existing airborne recovery rules.

Boss deaths stagger, brighten their core, topple, throw a crown, and emit staged
bursts at 0.5 and 1.2 seconds. The final particles expire after 3.1 seconds. Effects
advance on the visual clock, freeze on pause, and continue into the result screen.
Reduced motion removes duck fall trails, softens the finale rays, slows distant
motion, and retains the existing suppression of camera shake and lightning flashes.

## Performance budgets and measurement

| Pool/setting | High | Balanced |
| --- | --- | --- |
| Combat projectile cap | 360 | 360 |
| Spark particles | 900 | 420 |
| Smoke particles | 250 | 90 |
| Spectacle line segments | 900 | 480 |
| Debris shards | 180 | 90 |
| Bullet trails | 360 | 160 |
| Ambient weather | 420 | 240 |
| Resident wildlife | 4–10 | 3–7 |
| Wildlife including visits/gatherings | Up to 21 | Up to 13 |
| Shadow map | 2048 | 1024 |

Soldier parts are merged by material and joint, with their local offsets baked once.
Only root/joint matrices change per frame. Inactive weapon-model batches are disposed
after their fallen soldiers finish. Curved micro-details and distant mountain meshes
have fewer triangles. Balanced disables distant foliage/cliff shadows, updates
wildlife and weather at 30Hz, samples fewer muzzle effects and caps touch rendering
at 60Hz. Frame pacing consumes early tolerance-edge slots exactly once, including
on 90/120/144/165/180/240Hz displays. Target scans happen only when a soldier is
ready to fire.

On touch Balanced, three consecutive slow one-second samples (mean >22ms) lower
pixel ratio by 0.1, to a floor of 0.8, and reduce cosmetic density. Twelve fast samples
(mean <18ms) recover one step. Selecting High bypasses adaptation. Combat still ticks
at 60Hz; warning zones, aiming and damage are unchanged. Density changes immediately
trim cosmetic pools to their new limits.

Use `test:polish` with no other Chrome suite running. Its JSON report includes calls,
triangles, frame p95, and CPU time spent in the frame callback (not GPU completion
time). FPS uses wall time rather than the simulation's clamped catch-up interval,
so long stalls are visible. Desktop-host phone emulation is not a physical-device
FPS guarantee. Original
Balanced baseline for stationary first waves at 390×844 was 167/216/200/199 calls and
478,428/636,466/740,456/768,414 triangles for sectors 1/8/11/15 respectively. See the
latest `test-results/polish/report.json` for the current comparison and stress scene.

The final matched 2.2-second warm-up sample (Chrome, 390×844 touch emulation,
Balanced, 2026-09-07) produced:

| Sector | Calls before → after | Triangles before → after | Settled FPS |
| --- | --- | --- | --- |
| 1 | 167 → 151 | 478,428 → 331,746 | 60 |
| 8 | 216 → 178 | 636,466 → 359,436 | 60 |
| 11 | 200 → 163 | 740,456 → 481,414 | 60 |
| 15 | 199 → 154 | 768,414 → 449,538 | 60 |

The final combined stress sample held 60 FPS, 17ms frame p95 and 4.32ms mean frame
callback CPU time, at 238 draws / 794,440 triangles. Raw matched measurements are in
`test-results/performance-final.json`. These four stationary opening comparisons
show about 10–23% fewer calls and 31–44% fewer triangles; they are not benchmarks of
every possible fight. World construction and shader warm-up can stall a transition,
so `test:polish` waits 2.2 seconds before sampling each newly selected sector.

## Tests and fixtures

`npm test` covers ammunition cadence/damage, fair independent bags, side-lane reward
safety, swap/expiry/pause/reset, exclusive new powers, one-hit tank collision and
adaptive hysteresis. `test:balance` runs 180 seeded campaign policies.

`test:polish` captures all fifteen worlds twice (desktop and phone), revisits all of
them for resource growth checks, captures every new power/ammo mode, and exercises
42 soldiers with Rainbow Rush and four simultaneous powers. `test:fun` finds seeds
whose first normal rifts cover the deck, then earns them by shooting the choice.

`window.__warTest` is available only at `?test=1`. Alongside the original helpers:

- `power(kind)` / `ammo(kind)` inject a known effect for isolated visual checks.
- `duel()` opens a two-power choice; `equip(tier, squad)` sets a visual loadout.
- `stress()` creates a stationary, durable final wave and a fully upgraded squad.
- `useManualClock()`, `step(seconds,input)`, and `useRealtimeClock()` switch between
  reproducible game time and actual frame timing.
- `world()`, `spectacle()` and `renderer()` expose active counts, features and costs.

These fixtures are for rendering tests. `tests/strategy.mjs` is the ordinary-input
player policy used by the campaign and balance tests; never substitute fixture
damage or free upgrades into a claimed campaign victory.

`test:wildlife` visits every biome on desktop and phone, seeks to scheduled
visitors through the test-only `visualTime(seconds)` hook, verifies arrival,
departure, pause and the butterfly gathering, and captures the compositions.
This moves only the visual clock. `tests/wildlife.test.mjs` also checks geometry,
population caps, combat-lane clearance and changing visitor schedules.

The complete campaign/mobile examples use seed 19. The 180-run balance suite also
retains seeds 731 and 2048, including the permitted expansion defeats. The mobile
camera-framing check runs as a separate fixture after victory: pausing mid-movement
resets velocity and would change an otherwise deterministic campaign trajectory.
