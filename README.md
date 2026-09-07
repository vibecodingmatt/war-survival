# War: Survival

**Ashen Crossing — The Growing Horde, v0.2.0**

Lead a blue rifle squad against the Crimson Legion on a ruined stone bridge above
a jungle gorge. Survive four waves with **617 enemies**, build your squad by
shooting +1 targets, unlock bigger guns, and defeat the Crimson Warden.

**Play:** https://vibecodingmatt.github.io/war-survival/

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move squad | WASD / arrow keys, or click and drag | Drag on the battlefield |
| Fire rifles | Automatic | Automatic |
| Recruit +1 | Move left, press 1, or click the left lane button | Move left or tap +1 Soldier |
| Shoot enemies | Move to center, press 2, or click Hold the Line | Center or tap Hold the Line |
| Upgrade guns | Move right, press 3, or click Bigger Guns | Move right or tap Bigger Guns |
| Artillery barrage | Space or Artillery button | Artillery button |
| Pause | Esc or pause button | Pause button |
| Sound | Speaker button | Speaker button |

Your position selects what the squad shoots. The lane buttons (or 1 / 2 / 3)
steer you to the corresponding lane; manual movement takes over immediately.

- **Left:** each blue +1 board you shoot adds exactly one soldier, up to 42.
  Boards approach continuously; walking into them does not collect them.
- **Center:** shoot the horde. It keeps advancing while you invest in upgrades.
- **Right:** work down a tougher weapon goal. Partial damage stays when you
  switch lanes or finish a wave.

Weapons progress through **Volley Rifle → Repeater → Gatling → Siege Cannon**.
Each changes the actual model, fire rate, damage, sound, and tracer effects;
the Siege Cannon adds splash damage. Weapon goals cost 650, 2,800, and 8,500
damage, so a larger squad helps unlock them faster.

Waves advance automatically after a three-second breather, restoring 10 integrity
without granting soldiers or weapons. Red circles mark incoming impacts.
Artillery reloads every 14 seconds and damages only enemies.
The pause menu includes a **Balanced** graphics setting.

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
js/world/targets.js           Approaching +1 boards and the weapon goal display
js/systems/effects.js          Tracers, sparks, smoke, explosions, and target hits
js/systems/audio.js            Procedural sound and ambience
data/waves.js                 Wave pressure, weapon stats, and upgrade costs
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
npm run test:balance
npm install
npm run test:browser
```

The browser suite requires a running preview server and Chrome. Set
`CHROME_PATH` to your Chrome executable on other platforms. `TEST_URL` can point
to a deployed site. Browser screenshots go into ignored `test-results/`.

Simulation checks cover exclusive lane targeting, one-time recruit rewards,
squad caps, persistent weapon progress, all four weapon tiers, automatic waves,
damage, defeat, pause, artillery, restart, and multi-seed balance regressions.
Browser checks exercise keyboard, mouse, touch, lane buttons, target shooting,
all gun unlocks, responsive layouts, a complete tactical win, defeat, and replay.
See [balance notes](docs/balance.md) for the tested strategies.

Test instrumentation is available only with `?test=1`; it is absent during
normal play.

## GitHub Pages

This project uses the same publishing method as Dino Defense: the `main` branch,
repository root. `.nojekyll` keeps the site as plain static files. All runtime
asset paths work beneath `/war-survival/`.

Push reviewed changes to `main` to publish a new version. The reference video,
local screenshots, logs, and dependencies are excluded from Git.

See [asset credits](docs/credits.md) and [reference notes](docs/gameplay-plan.md).
