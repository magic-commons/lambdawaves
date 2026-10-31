# Releasing λWAVES

Two branches, one public address, one rule: **`main` is what is live, and it moves only when a release is cut.** The current state
of the tree (what is pushed, what is deployed, what is verified) is the status block at the top of
[`SHIPPING-READINESS.md`](SHIPPING-READINESS.md).

| Branch | Address | What it is |
|---|---|---|
| `main` | https://lambdawaves.magic-commons.com | The release. Frozen between releases; every commit on it is a tagged release or a hotfix. |
| `dev` | local only (`tools/serve.sh 8711` → https://127.0.0.1:8711/lab/) | Development. It is not deployed anywhere public: the `dev.lambdawaves.magic-commons.com` worker was deleted on 2026-09-12. |

## Day to day (on `dev`)

```bash
git switch dev
# … edit lab/ …
node tests/pwa.test.mjs --write && npm test        # rehash + the node gate
git commit -am "…" && git push                     # CI runs the node gate
tools/serve.sh 8711                                # play the development copy locally
```

The development copy is played on the local machine, or on the local network with `LW_HOST`. If a private development URL is ever
needed for a tablet, put Cloudflare Access (Zero Trust, a one-time-PIN policy on the maintainer's e-mail) in front of the hostname
before `npx wrangler deploy --env dev`; `wrangler.jsonc` keeps that environment.

## Release-day checks

Run on the release commit; each must read as below before the tag. The right-hand column is what each read on 2026-10-30
(the 0.9.9 tree the day before the beta cut, the Linux workstation with the RTX 3070).

```bash
./test.sh node                                     # 116 node suites (pwa last) + state-scopes --check + hints-census --check: EXIT 0
./test.sh browser                                  # 41 browser suites (a machine with a GPU, Firefox and geckodriver)
npx --yes knip@6.43.0 --config tools/knip.json     # app (lab/ less lab/mir): 14 unused exports, all deliberate keeps; 0 unused app files
npx --no-install dependency-cruiser --no-config --include-only '^lab' --output-type json lab   # 0 circular edges outside lab/mir (the kit's own: 37)
npm audit                                          # 0 vulnerabilities
(cd tools/platform/electron && npm audit)          # 5 moderate (glob, minimatch under @electron/packager 20.3.0); 0 high
node tools/build-deploy.mjs --quiet                # rc 0: dist/ 1,740 files, 29.59 MiB
node tools/changelog.mjs --check                   # rc 0: CHANGELOG, CITATION.cff and BUILD_LINE (0.9.9-beta) in step
# THE LOCK on a served tree (python3 tools/gate/server.py . <p> &), both fixtures: 0 readback differences
nice -n 10 env LW_PORT=<p> GD_PORT=<gd> node tools/perf/digest-lock.mjs --check --query gastab=0                                            # 843 · 0
nice -n 10 env LW_PORT=<p> GD_PORT=<gd> node tools/perf/digest-lock.mjs --check --query gastab=0 --fixture tests/fixtures/digest-lock-s4a.json # 987 · 0
```

The browser suites by area (one server, `nice -n 10`, one browser at a time) are listed in `CLAUDE.md` § THE GATES; on 2026-10-30
`molecular-names`, `menubar`, `start` and `lw-facade` were run green, the rest were last run by the rows that changed their areas.
The two Electron advisories are fixed upstream only by a major downgrade of `@electron/packager` (`npm audit fix --force` → 18.4.4);
the packager runs at build time and does not ship.

## Cutting a release (dev → main)

When `dev` has been green for a while and has been used on a tablet and a desktop for a few days:

```bash
git switch main && git merge --ff-only dev         # main takes exactly what dev is; if this refuses, rebase dev on main first
# the release-day checks above
# BUILD_LINE (lab/build-line.js) and CITATION.cff's version: + date-released: are written together, before the tag
git tag -a v0.2.0-alpha -m "…what changed…"        # semantic version + stage; the changelog is generated from tags
node tools/changelog.mjs && node tools/changelog.mjs --check && git commit -am "CHANGELOG for v0.2.0-alpha" && git push --follow-tags
node tools/snapshot-release.mjs v0.2.0-alpha       # a playable copy outside the repository (LW_SNAPSHOTS, LW_SNAPSHOT_INDEX choose where)
node tools/build-deploy.mjs && npx wrangler deploy # the release goes live
gh release create v0.2.0-alpha --generate-notes    # the GitHub Release page
git switch dev
```

Version numbers: `0.x.0-alpha` while features are still being added and the file format may move; `0.x.0-beta` once a project saved
today is promised to open next month; `1.0.0` is the tree in which the last confirmed critical or high finding of the 0.9.9 stability
review is closed. The device matrix, the installed-PWA update test and a screen-reader pass are what 1.0 ships with and states as
unverified (`SHIPPING-READINESS.md`); closing them comes after 1.0, not before it. Bump the middle number for a release, the last
for a hotfix.

## A hotfix (something broken on the live site)

```bash
git switch main && git switch -c hotfix/whatever   # from main, not dev
# … the smallest fix …
node tests/pwa.test.mjs --write && ./test.sh
git switch main && git merge --ff-only hotfix/whatever && git tag -a v0.1.1-alpha -m "…" && git push --follow-tags
node tools/build-deploy.mjs && npx wrangler deploy
git switch dev && git merge main                   # dev takes the fix too, so it is not lost at the next release
```

## When to release

- Not on a schedule: when the development copy is something you would show, and its gate is green.
- Never from `dev` directly to the release address, and never with a red gate.
- A demonstration is a reason to release *before* it, not during it.
