# Releasing λWAVES

Two branches, one public address, one rule: **`main` is what is live, and it moves only when a release is cut.** The current state
of the tree (what is pushed, what is deployed, what is verified) is the status block at the top of
[`docs/SHIPPING-READINESS.md`](docs/SHIPPING-READINESS.md).

| Branch | Address | What it is |
|---|---|---|
| `main` | https://lambdawaves.magic-commons.com | The release. Frozen between releases; every commit on it is a tagged release or a hotfix. |
| `dev` | local only (`./serve.sh 8711` → https://127.0.0.1:8711/lab/) | Development. It is not deployed anywhere public: the `dev.lambdawaves.magic-commons.com` worker was deleted on 2026-09-12. |

## Day to day (on `dev`)

```bash
git switch dev
# … edit lab/ …
node tests/pwa.test.mjs --write && npm test        # rehash + the node gate
git commit -am "…" && git push                     # CI runs the node gate
./serve.sh 8711                                    # play the development copy locally
```

The development copy is played on the local machine, or on the local network with `LW_HOST`. If a private development URL is ever
needed for a tablet, put Cloudflare Access (Zero Trust, a one-time-PIN policy on the maintainer's e-mail) in front of the hostname
before `npx wrangler deploy --env dev`; `wrangler.jsonc` keeps that environment.

## Release-day checks

Run on the release commit; each must read as below before the tag.

```bash
./test.sh node                                     # every node suite + state-scopes --check + hints-census --check: EXIT 0
./test.sh browser                                  # the browser suites (a machine with a GPU, Firefox and geckodriver)
npx --no-install knip                              # the deliberate keeps only, 0 unused files
npx --no-install dependency-cruiser --no-config --include-only '^lab' --output-type json lab   # 0 circular edges in lab/
npm audit && (cd tools/platform/electron && npm audit)                                       # 0 in both packages
node tools/build-deploy.mjs --quiet                # dist/ assembled and verified: rc 0
node tools/changelog.mjs --check                   # CHANGELOG, CITATION.cff and BUILD_LINE in step: rc 0
# THE LOCK on a served tree (tools/gate/server.py), both fixtures: 0 changed leaves
nice -n 10 env LW_PORT=<p> GD_PORT=<gd> node tools/perf/digest-lock.mjs --check --query gastab=0
nice -n 10 env LW_PORT=<p> GD_PORT=<gd> node tools/perf/digest-lock.mjs --check --fixture research/release-0.4.0/measure/digest-lock-s4a.json
```

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
unverified (`docs/SHIPPING-READINESS.md`); closing them comes after 1.0, not before it. Bump the middle number for a release, the last
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
