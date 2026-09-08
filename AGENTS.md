# War: Survival handoff

Read `README.md` for the player rules and `docs/visual-combat-guide.md` for the
rendering architecture, effect budgets, test fixtures and v0.7.2 changes.
`docs/balance.md` records the measured campaign outcomes. This is a standalone Git
repository inside `games-playground`; run Git and npm from this directory.

## Start here

- Static ES modules, vendored Three.js, no build step or runtime CDN.
- `npm ci`, then `npm start`; play at `http://127.0.0.1:4173/war-survival/`.
- Browser tests require Chrome. `CHROME_PATH`, `PLAYWRIGHT_MODULE`, and `TEST_URL`
  can point at an existing installation/server. See `package.json` for commands.
- On Windows, a Node `EPERM` resolving `C:\Users\burns` can be a sandbox issue;
  it is not a game failure. Use the execution tool's normal escalation workflow.
- If port 4173 is occupied, check whether the existing server serves this game
  before starting another. Do not terminate unrelated processes.
- No backend, account, online multiplayer, or save server. Progress is the
  `war_survival_campaign_v1` cookie; preserve its bitmask migration rules.

## Implementation invariants

- Simulation and cosmetic animation have separate clocks and random sources.
  Gameplay lives in `js/core/`; rendering must not award damage or rewards.
- Combat ticks at 60 Hz, with at most 360 live projectiles and 42 squad members.
  Quality changes never alter damage, enemy count, controls, or red warning zones.
- Left recruits, center fights/shoots pods, right upgrades. Side-lane reward shots
  never gain extra projectiles or splash from temporary ammunition.
- Rift rewards are exclusive: invalidate both targets before granting one.
  Choices pause ordinary recruit/weapon boards while retaining their progress.
- Ammo uses one replaceable timed slot. Major rifts and support buffs can coexist;
  all temporary effects reset on replay/next sector and freeze on pause.
- Add scenery under the active biome root so sector changes dispose it. Keep
  focal objects outside the bridge (`|x| > 7.6`). Check portrait composition too.
- Give each world a distinct fantasy creature and habitat. The user rejected
  repeated insects/birds and aquatic animals in the Sky Citadel. Most encounters
  should rest or watch; do not make every biome another flying population.
- Batch repeated rigid geometry by material and animated joint. Avoid per-shot
  meshes, per-enemy lights, unbounded particles and frame-by-frame canvas uploads.
- Keep live state behind `?test=1` instrumentation. Production has no debug global.
- Bump all local browser module/style release queries together for a release;
  do not add a bundler solely for cache busting.

## Verification by change

- Gameplay/rewards: `npm test`, `npm run test:balance` (180 deterministic runs).
  Investigate failed seeds; do not weaken the assertions to hide regressions.
- Visuals/effects: `npm run test:polish` checks every world, ammo and power visuals,
  simultaneous effects, cleanup, pause and reduced motion. Inspect its screenshots.
- Wildlife: also run `npm run test:wildlife` for exclusive fantasy encounters,
  grounded resting poses, dragon framing and butterfly gatherings in all 15 worlds.
- Controls/HUD: `npm run test:browser`, `npm run test:mobile`.
- End-to-end: `npm run test:campaign`; use `test:fun` to earn all seven powers
  through actual lane shooting, and `test:expansion` for old-save expansion checks.
- Avoid concurrent browser suites when collecting performance measurements.
  Screenshots, traces and JSON reports belong in ignored `test-results/`.
- Chrome emulation validates layout and desktop-host cost; physical iOS/Android
  GPU performance still needs device testing. Record the distinction in reports.

## Publishing default

The user authorized direct production publishing on 2026-09-08. For requested
War: Survival changes, finish the implementation and documentation, run all checks
applicable to the change, then commit and push directly to production on `main`
without asking for another publishing confirmation. A later instruction to keep
work local, make a draft, or wait overrides this default. Read-only reviews do not
authorize unrelated changes. Failed checks or unrelated unfinished work must not
be included in a release.

Follow [docs/publishing.md](docs/publishing.md): verify the repository and remote,
preserve others' changes, wait for the Pages deployment of the pushed commit, and
verify the public files and desktop/phone behavior before reporting success.
The Pages source is the repository root on `main` for
`vibecodingmatt/war-survival`. Never force-push to resolve divergence.

The v0.7 release passed the full readiness review on 2026-09-08. The v0.7.1
wildlife update passed unit, wildlife, polish, mobile and focused gathering
performance checks that day. See [docs/wildlife.md](docs/wildlife.md).
