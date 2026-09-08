# Publishing War: Survival

## Authorization and destination

The user's standing instruction, given on 2026-09-08, is to publish completed
requested changes straight to production when all applicable checks pass. Do not
stop at a local implementation or ask for a second publishing confirmation. An
explicit request to leave work local, prepare a draft, or wait takes precedence.
This instruction applies to this game, not other repositories or products.

- Repository: `https://github.com/vibecodingmatt/war-survival`
- Production branch: `main`
- GitHub Pages source: repository root `/` (branch deployment)
- Public URL: `https://vibecodingmatt.github.io/war-survival/`
- Local checkout: `C:/Users/burns/dev/games-playground/war-survival`

## Prepare and check

1. Read `AGENTS.md`, inspect Git status and the complete intended diff, and confirm
   `origin` targets this repository. Keep unrelated unfinished changes out of the
   commit. Use an isolated worktree when necessary.
2. Update the player/developer documentation affected by the change. For a runtime
   release, update the package and lockfile versions, visible build stamp, and all
   local browser module/style release queries together. Keep static metadata and
   share-image URLs working beneath `/war-survival/`.
3. Run `npm test`, `npm run verify:release`, `git diff --check`, and all checks
   applicable under `AGENTS.md`. Visual changes require `test:polish` and screenshot
   inspection; wildlife changes also require `test:wildlife`; controls require
   browser/mobile coverage; gameplay changes require balance coverage. Add
   campaign, reward or save-migration coverage when those behaviors change.
   Reuse passing checks from the same session when their tested files are unchanged;
   documentation-only follow-ups do not require repeating browser suites. Run
   browser performance suites sequentially. Keep artifacts under `test-results/`.
4. Fix failures before publishing. Do not weaken assertions or ship unrelated
   unfinished work to satisfy this default. Chrome phone emulation does not prove
   physical iOS/Android GPU performance.

`npm start` normally serves port 4173. If occupied, verify the server belongs to
this checkout; use another port and `TEST_URL` if necessary. On Windows, Node
`EPERM` resolving `C:/Users/burns` may require the tool's normal sandbox escalation.
Standing publishing authorization does not bypass execution permissions.

## Commit and publish

Fetch `origin/main` before publishing. If it advanced, integrate it without
overwriting remote work, inspect the resulting diff, and rerun checks affected by
conflict resolution. Commit only the intended files and push with
`git push origin HEAD:main`. Do not force-push. A rejected push is a reason to fetch
and reconcile, not replace remote history. No extra permission prompt is needed
for an ordinary successful release within the standing authorization.

Record the pushed SHA. Use the GitHub CLI to check Pages configuration and find
the deployment for that SHA:

```powershell
gh api repos/vibecodingmatt/war-survival/pages
gh run list --repo vibecodingmatt/war-survival --commit <sha> --limit 5 --json databaseId,name,status,conclusion,headSha,url
```

Wait for the matching Pages run to succeed, checking its status at reasonable
intervals and keeping the user informed. Diagnose build failures before claiming
completion. Do not report a deployment as live solely because Git push succeeded.

## Verify production

Run `npm run verify:live` from the released checkout after Pages succeeds. It
checks live HTML, every game module/style and the three share/icon assets against
local release content, then smoke-tests normal desktop/phone startup, pause/resume,
old-save expansion unlocks and the absence of production debug globals. It is
read-only against the site. `RELEASE_URL` can select another server for rehearsal.

For wildlife releases, also run `test:wildlife` with `TEST_URL` set to the public
URL to exercise actual fantasy-creature and gathering behavior. This touches only a local
browser's test state and cookie. Keep local and production reports distinguishable.
If the public site is temporarily stale, wait and retry verification; do not edit
or republish source simply to defeat a cache. Persistent errors need investigation.

Finish with the live URL, released version/commit, verification result, and any
remaining limitation. Keep the production release and local skill installation
distinct when describing what was updated.

## Maintainer skill

`skills/war-survival-maintainer/SKILL.md` is the versioned source. Install the same
file in `~/.codex/skills/war-survival-maintainer/SKILL.md` for discovery in future
sessions. Maintain both copies when changing the skill; repository documentation
is the source of truth for release details and the user's standing preference.
