# War: Survival

**The Ember Gate — mobile update, v0.3.1**

Lead a blue rifle squad against the Crimson Legion on a ruined stone bridge above
a jungle gorge. Beat **Level 1: Ashen Crossing** (617 enemies), then take on
**Level 2: Ember Gate** (741 enemies) at dusk, with faster formations, heavier
armor, shorter supply windows, and the Ember Marshal's three-impact attacks.
Both levels have four waves and can be selected immediately for playtesting.
Each starts with nine riflemen; beating Level 1 offers a Next Level button.

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
  Boards arrive in bursts of up to six, about 10–11 seconds apart. They disappear
  at the squad cap and return after casualties. Walking into them grants nothing.
- **Center:** shoot the horde. It keeps advancing while you invest in upgrades.
- **Right:** work down a tougher weapon goal. Partial damage stays when you
  switch lanes or finish a wave, **until that board passes the squad**.
  Boards float down the right lane with a visible countdown (about 21 seconds
  in Level 1, 16 in Level 2). A missed goal returns after a 4–5 second gap with
  full health. The next gun also arrives after a short gap when you unlock one.

Weapons progress through **Volley Rifle → Repeater → Gatling → Siege Cannon**.
Each changes the actual model, fire rate, damage, sound, and tracer effects;
the Siege Cannon adds splash damage. Weapon goals cost 650, 2,800, and 8,500
damage, so a larger squad helps unlock them faster.

Waves advance automatically after a three-second breather, restoring 10 integrity
without granting soldiers or weapons. Red circles mark incoming impacts.
Artillery reloads every 14 seconds and damages only enemies.
Every eight accumulated integrity damage costs one rifleman, down to the last
soldier; losses animate on the bridge. Healing between waves does not replace
soldiers. Recruitment rebuilds your firepower; reaching zero integrity ends the run.
The pause menu includes a **Balanced** graphics setting.

## Mobile web

Touch devices show drag-and-tap instructions throughout the menu, HUD, pause
help, and accessibility labels. Keyboard shortcuts remain available for desktop
players and appear when a physical keyboard is used.

- Drag anywhere on the bridge to move; lifting your finger stops movement.
  A small dead zone filters finger jitter. Beginning a drag cancels lane steering.
- Lane buttons respond on touch-down. A second finger can tap Artillery while
  the first keeps moving the squad.
- Phone controls use at least 44px touch targets, larger text, and screen inset
  spacing. Portrait, landscape, and tablet layouts keep the controls separate.
  Short phone screens use adjusted camera framing to keep the squad visible.
- Rotating during combat pauses the game and releases held movement. Tap
  Return to Battle after rotating; browser toolbar height changes do not pause.
- Touch devices default to Balanced graphics: pixel ratio capped at 1, 1024px
  shadow maps, and no blur behind HUD cards. Phone rendering is limited to about
  60 frames per second, and HUD updates run at 10Hz. Combat keeps its fixed 60Hz
  simulation. High graphics remains available in the pause menu.

Mobile verification uses Chrome touch emulation at eight sizes from 320×568 to
768×1024, including landscape and simulated notched-screen insets. It covers
multi-touch artillery, drag release, rotation, text/labels, full-squad visibility,
and a complete Level 2 run. Physical iOS/Android performance is not benchmarked.

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
css/mobile.css                Touch instructions, phone/tablet layouts, safe areas
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
locally. Sound preference and level completion checkmarks are stored in the
browser when storage is available. Runs start fresh and no level is locked.

## Verification

```sh
npm test
npm run test:balance
npm install
npm run test:browser
npm run test:mobile
```

The browser suite requires a running preview server and Chrome. Set
`CHROME_PATH` to your Chrome executable on other platforms. `TEST_URL` can point
to a deployed site. Browser screenshots go into ignored `test-results/`.

Simulation checks cover exclusive lane targeting, one-time recruit rewards,
squad caps and replacement recruits, timed bursts, moving weapon deadlines,
expired in-flight shots, all four weapon tiers, automatic waves, casualties,
defeat, pause, artillery, level selection, restart, and multi-seed balance.
Browser checks exercise keyboard, mouse, touch, lane buttons, target shooting,
all gun unlocks, responsive layouts, both complete levels, the Next Level button,
casualty/recruit visuals, missed goals, defeat, and replay.
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
