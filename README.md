# War: Survival

**The Borderlands Campaign · v0.6.0**

A browser squad survival game with fifteen short, escalating levels. Recruit soldiers,
catch moving weapon upgrades, and defeat each sector's guardian. Every level starts
with nine riflemen and has four waves. Beat a sector to unlock the next; completed
sectors stay available for replay. A first-party cookie remembers victories for a
year in this browser, and earlier saved wins migrate automatically. Beating the
Dragon Observatory completes the campaign. Existing ten-sector saves retain every
victory and open Level 11. Deploy stays visible while the sector list scrolls.

**Play:** https://vibecodingmatt.github.io/war-survival/

## Controls

| Action | Desktop | Phone / tablet |
| --- | --- | --- |
| Move and aim | WASD, arrows, or drag | Drag anywhere on the battlefield |
| Recruit soldiers | Move left; shortcut 1 | Move left |
| Shoot enemies / supply pods | Move center; shortcut 2 | Move center |
| Upgrade weapons | Move right; shortcut 3 | Move right |
| Artillery | Space or Artillery button | Tap Artillery; a second finger works while dragging |
| Pause / graphics | Esc or pause button | Pause button |

Firing is automatic. Lifting your finger stops movement. The persistent lane buttons,
lane instructions, and separate weapon panel have been removed from battle. The
moving boards show their own information. Instructions are in the menu and pause help.
The HUD keeps squad integrity, the equipped weapon, temporary boosts, and Artillery.

## Campaign

| Sector | World | Guardian |
| --- | --- | --- |
| 01 · Ashen Crossing | Sunlit jungle gorge and waterfalls | Crimson Warden |
| 02 · Ember Gate | Dusk ruins, beacons and lanterns | Ember Marshal |
| 03 · Jade Cascades | Bamboo, cascading streams, foam and rain | Tidal Oracle |
| 04 · Frostglass Pass | Ice spires, snow and an aurora | Glacier King |
| 05 · Sunscar Oasis | Sandstone arches and an oasis | Brass Scarab |
| 06 · Tempest Reach | Monoliths, rainfall and distant lightning | Storm Herald |
| 07 · Amber Sanctuary | Autumn trees, pagodas and drifting lanterns | Autumn Ronin |
| 08 · Cinder Caldera | Basalt, lava, drifting ash and a smoking crater | Furnace Colossus |
| 09 · Lumen Wilds | Moonlit mushrooms and fireflies | Spore Empress |
| 10 · The Sky Citadel | Floating islands and an eclipse gate | Eclipse Sovereign |
| 11 · Coral Cathedral | Branching coral shelves, pulsing jellyfish and drifting tentacles | Coral Leviathan |
| 12 · Clockwork Gardens | Turning brass gears, pendulums and fluttering mechanical butterflies | Brass Timekeeper |
| 13 · Moonlotus Marsh | Unfurling lotus flowers, lily pads, ripples and dancing wisps | Lotus Matriarch |
| 14 · Prismatic Rift | Levitating crystal gardens, orbital fragments and aurora ribbons | Prism Titan |
| 15 · Dragon Observatory | Floating orreries, orbiting planets and an articulated flying dragon | Astral Wyrm |

Enemy count, health, and speed increase each sector. Levels 3–15 introduce two
champions in wave two, another champion in wave three (a pair from Level 5), and
the final guardian. Five boss silhouettes include
armored knights, siege tanks, six-legged crawlers, crystal guardians, and winged
oracles. Salvos, sweeping strikes, cross patterns, and summoned reinforcements require
different movement. Later guardians advance into melee range, wind up, and strike
the squad. Red warning zones show where the attack will land; dodging or killing
the attacking boss cancels the damage. Frost slows bosses less than infantry. Prolonged
boss waves trigger an enrage and repeated elite reinforcements; a guardian cannot
be safely stalled forever while ignoring upgrades.

## Varied openings

Level 1 retains the familiar introduction. Subsequent sectors rotate five distinct
openings, identified in the sector description:

- **Veteran Convoy:** three +3 recruit cards replace the initial +1 burst.
- **Rift Arrival:** choose reinforcements or a randomly offered fantasy power immediately.
- **Overdrive Drop:** shoot a central Overdrive crate; reinforcements arrive shortly afterward.
- **Armory Rush:** the first moving weapon goal starts closer and costs 30% less; recruits follow.
- **Power Duel:** choose between two different fantasy powers; only one can be claimed.

Each deployment shuffles a separate five-power reward bag. Every power appears
before the bag refills, with no consecutive duplicate draws. Pausing preserves the
draws and timers. Replaying rolls a new seed. Ordinary side-lane controls remain
consistent after the opening, and the existing equipment routes still apply.

## Weapons and battlefield opportunities

Each sector has an equipment route, shown in its menu description. The ten weapons
are Volley Rifle, Repeater, Gatling, Siege Cannon, Frost Lance, Arc Coil, Dragon
Breath, Rail Driver, Hailstorm, and Sunforge. They have distinct gun models, shot
colors, sounds, and damage behavior: freezing, chain lightning, burning, piercing,
or explosive splash. Routes are fixed per sector in this iteration.

- **Recruit boards:** +1 per shot, up to 42 soldiers. Boards come in short bursts,
  disappear at full strength, and return after casualties. Touching a board does
  not collect it.
- **Weapon goals:** move down the right lane. Partial damage survives changing
  lanes and waves, until the board passes. Misses return after a brief gap with
  full health. Later weapons must be pursued before the horde gets close; later
  sectors can offer the second upgrade during the first wave.
- **Supply pods, from sector 3:** shoot the center-lane crate for Overdrive
  (faster shooting for nine seconds), Aegis (30 shield, capped at 50), Rally
  (double recruits for twelve seconds), or Field Repair (+20 integrity).
- **Explosive carts, from sector 3:** shooting a red powder cart blasts nearby
  enemies and can start a chain reaction. Friendly artillery also detonates carts.

**Rift choices arrive in every sector.** Outside opening power duels, the linked cards offer
+6 soldiers on the left, a temporary power on the right. Hold fire on one for a
short volley to claim it; its partner closes immediately. A full squad gets a
+35 Aegis shield alternative (capped at 60). The cards have an opening grace period
and expire if ignored. Regular recruit and weapon boards pause during the choice,
then return with their progress intact. The center lane remains dangerous.

| Rift power | Effect |
| --- | --- |
| Starfall · 8 seconds | Repeated comet volleys blast clustered enemies into the air |
| Tesla Halo · 10 seconds | Three orbiting drones fire chaining lightning while your squad moves or pursues supplies |
| Prism Overload · 8 seconds | Enhanced shots ricochet through three nearby enemies; your permanent gun stays equipped |
| Gravity Well · 8 seconds | Pulls infantry into a damaging vortex, then detonates a final nova; bosses resist the pull |
| Phoenix Pact · 10 seconds | Restores 12 integrity and sends a fiery bird on repeated strafing runs; lethal damage consumes the pact to restore 35 integrity and up to six soldiers once |

Unshielded guardian swipes launch roughly 16% of the squad; champion swipes launch
10%, rounded up. Damage determines casualties, while other thrown soldiers stop
firing and recover into formation over 2.2 seconds. Partial shields reduce the
number launched, and a shield that absorbs the hit protects the whole squad.
A heavy hit gives 0.85 seconds of recovery against overlapping attacks; enemies
can still breach. Sweeping shockwaves, tumbling bodies, energy trails and impact
audio show the hit, and the shield has a visible energy dome.

Levels 11–15 give at least five seconds to regroup. An opening wave cleared early
leaves time to rearm until the 25-second mark, so a powerful opening does not
force an under-equipped squad straight into the champion wave.

Artillery reloads in 14 seconds. Clearing a wave restores 10 integrity. Every eight
unshielded damage costs a soldier, down to the last survivor; zero integrity loses
the level. Fallen soldiers and defeated bosses animate on the bridge. All weapons,
supplies, health, and buffs reset when restarting or moving to a new level.

## Mobile and rendering

Touch devices show no keyboard instructions, default to Balanced graphics (pixel
ratio 1 and 1024px shadows), and target 60 renders per second. Combat advances at a
fixed 60Hz. Drag input includes a small jitter dead zone. Rotation pauses combat
and releases movement; browser toolbar height changes do not pause it. High graphics
is available in the pause menu. Reduced motion suppresses lightning flashes and
camera shake, and softens ambient movement.

Waterfalls follow rocky stream beds over curved, irregular lips into foam and spray.
The caldera adds tumbling ash, rising embers, lava channels and expanding soot clouds.
Scenery uses bundled textures, instanced geometry, animated water, soft mist,
wind-driven foliage, and bounded weather particles. Sector scenery is disposed when
switching worlds; weapon models are cached as they are encountered. There is no
runtime CDN, backend, account, installation, or asset-generation service.

## Development and verification

Requires Node.js 18+. Start the dependency-free static server with `npm start`, then
open **http://127.0.0.1:4173/war-survival/**. Opening the HTML directly is not supported.

```sh
npm test
npm run test:balance
npm install
npm run test:browser
npm run test:mobile
npm run test:campaign
npm run test:fun
npm run test:expansion
```

Browser checks require Chrome and a running server. Set `CHROME_PATH` for another
Chrome executable, `PLAYWRIGHT_MODULE` for an existing Playwright installation, or
`TEST_URL` to check a deployed site. Screenshots and reports go into ignored
`test-results/`. Test instrumentation exists only with `?test=1`.

Checks cover fifteen-sector pressure, exclusive lane targeting, supply expiration,
casualties, weapon effects, boosts, cart explosions, boss attacks, multi-seed balance,
exclusive rift rewards, power expiry, percentage launches and airborne recovery,
keyboard/mouse input, next-level progression, saved completion, eight touch layouts,
multi-touch artillery, and full campaign playthroughs. Mobile coverage uses Chrome
emulation; physical iOS/Android performance has not been benchmarked.

Main files: `data/campaign.js` defines world palettes, bosses, and weapon routes;
`data/waves.js` defines pressure; `js/core/simulation.js` handles gameplay;
`js/world/ambience.js` builds biome landmarks and weather;
`js/world/wonderlands.js` animates the five expansion worlds; `js/entities/bosses.js`
builds guardians; `css/campaign.css` handles the sector menu and compact HUD.

## GitHub Pages

The `main` branch and repository root publish the static site. `.nojekyll` disables
Jekyll processing. Paths work beneath `/war-survival/`; changed browser modules use
a release query to prevent stale files from mixing after an update. Reference
videos, dependencies, logs, and screenshots are excluded from Git.

See [asset credits](docs/credits.md) and [balance notes](docs/balance.md).
