---
name: war-survival-maintainer
description: Maintain, test, or publish the War Survival browser game in the war-survival repository, including its Three.js worlds, wildlife, gameplay, mobile controls, social previews and GitHub Pages releases. Use for requested changes to this game and its production site; not for Dino Defense or Roblox projects.
---

# War Survival maintainer

Work in `C:/Users/burns/dev/games-playground/war-survival` or its current checkout.
It is a standalone Git repository nested inside `games-playground`. Start with
its `AGENTS.md`; use `README.md` for player behavior and commands.

## Route by task

- Rendering, mobile performance and combat effects: `docs/visual-combat-guide.md`.
- Wildlife populations, geometry, visitor timing and test fixtures: `docs/wildlife.md`.
- Campaign tuning and measured outcomes: `docs/balance.md`.
- SMS/social sharing metadata and assets: `docs/social-preview.md`.
- Every release: `docs/publishing.md`.

Use the existing static ES modules and vendored Three.js. Scene art is authored
geometry; favor native geometry and instancing for creatures. Keep scenery under
the active biome root for disposal, outside the bridge, and visible on phones.
Cosmetic clocks/randomness must stay separate from simulation. Test hooks belong
only behind `?test=1`; production has no debug global.

The user wants fantastical, original encounters, not repeated insects and birds.
Every world has its own signature creature, anatomy, behavior and habitat. Most
rest or watch; do not make flight the default. Volcano dragons and the Sky Citadel
griffin fit their worlds; aquatic creatures belong in the reef. Preserve the
jungle's detailed morphos and occasional gathering without spreading butterflies
across the campaign. Do not substitute palette swaps for distinct creatures.
Run the wildlife and polish suites and inspect desktop/phone screenshots, including
animal scale, dragon framing and feet actually meeting their support.
Avoid overlapping browser performance suites. Report phone emulation separately
from physical-device testing.

## Finish through production

The user explicitly instructed on 2026-09-08 that completed requested changes to
this game should publish straight to production once all applicable checks pass.
Treat this as standing authorization to commit, push to `main`, wait for Pages,
and verify the public site without asking again. A subsequent request to leave
work local, prepare a draft, or wait overrides the default. Read-only reviews do
not authorize unrelated changes, and failed checks must be fixed before release.

Production is `vibecodingmatt/war-survival`, GitHub Pages from `main` and `/`, at
`https://vibecodingmatt.github.io/war-survival/`. Follow the repository publishing
guide for scoped commits, remote integration, release queries and verification.
Reuse valid checks already completed on unchanged files. Never force-push to
resolve divergence or equate a successful push with a verified deployment.

The versioned skill source lives at `skills/war-survival-maintainer/SKILL.md` in
the repository. Keep that source and the installed skill synchronized when edited.
