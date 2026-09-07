# War: Survival

**Ashen Crossing — first playable, v0.1.0**

Lead a blue rifle squad against the Crimson Legion on a ruined stone bridge above
a jungle gorge. Survive four waves, reinforce your squad, and defeat the Crimson
Warden. This is a short sample encounter for feedback on visuals and combat.

**Play:** https://vibecodingmatt.github.io/war-survival/

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move squad | WASD / arrow keys, or click and drag | Drag on the battlefield |
| Fire rifles | Automatic | Automatic |
| Artillery barrage | Space or Artillery button | Artillery button |
| Pause | Esc or pause button | Pause button |
| Sound | Speaker button | Speaker button |

Move into blue supply crates to recruit riflemen. Red circles mark enemy impacts:
move out before they fill. Between waves, choose recruits, stronger ammunition,
or healing. Artillery reloads every 12 seconds. The pause menu includes a
**Balanced** graphics setting.

## Local development

Requires Node.js 18 or newer. No dependency install or build is needed to play:

```sh
npm start
```

Open **http://127.0.0.1:4173/war-survival/**. The local server also supports the root
URL. ES modules and textures require HTTP hosting; double-clicking the HTML file
is not supported.

## Project layout

```text
index.html                    Menus, HUD, and accessible controls
css/style.css                 Responsive interface
js/main.js                    Browser startup, input, camera, and UI
js/core/simulation.js          Fixed-step gameplay, damage, waves, and progression
js/core/math.js                Seeded random numbers and formation helpers
js/entities/army.js            Instanced troop models and animation
js/world/environment.js       Bridge, gorge, ruins, vegetation, water, and lighting
js/systems/effects.js          Tracers, sparks, smoke, explosions, and pickups
js/systems/audio.js            Procedural sound and ambience
data/waves.js                 Encounter tuning
assets/textures/              Bundled surface textures and environment lighting
vendor/                       Pinned Three.js 0.180.0 and its HDR loader
scripts/serve.mjs              Dependency-free local preview server
tests/                        Simulation and browser checks
docs/                         Reference observations, credits, and playtest notes
references/gameplay/           Local reference video (ignored by Git)
```

The game has no runtime CDN, API, font, account, or backend dependency. All
rendering libraries and textures are hosted with the site. Sound is synthesized
locally; only the sound preference is stored in the browser. Runs start fresh.

## Verification

```sh
npm test
npm install
npm run test:browser
```

The browser suite requires a running preview server and Chrome. Set
`CHROME_PATH` to your Chrome executable on other platforms. `TEST_URL` can point
to a deployed site. Browser screenshots go into ignored `test-results/`.

Simulation checks cover movement boundaries, automatic combat, damage and
defeat, pause, artillery cooldowns, pickups, all four waves, upgrades, and restart.
Browser checks exercise keyboard, mouse, touch, responsive layouts, graphics
switching, sound controls, a complete tactical win, defeat, and replay.

Test instrumentation is available only with `?test=1`; it is absent during
normal play.

## GitHub Pages

This project uses the same publishing method as Dino Defense: the `main` branch,
repository root. `.nojekyll` keeps the site as plain static files. All runtime
asset paths work beneath `/war-survival/`.

Push reviewed changes to `main` to publish a new version. The reference video,
local screenshots, logs, and dependencies are excluded from Git.

See [asset credits](docs/credits.md) and [reference notes](docs/gameplay-plan.md).
